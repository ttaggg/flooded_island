"""
WebSocket connection handler for Flooded Island game.

Manages real-time multiplayer communication including connection management,
message routing, and broadcasting to players in game rooms.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from game.board import Board
from game.room_manager import room_manager
from game.validator import (
    validate_adventurer_move,
    validate_grid_dimensions,
    validate_weather_flood,
)
from game.win_checker import check_win_condition
from models.game import FieldState, GameRoom, GameStatus, PlayerRole, Position
from models.messages import (
    ConfigureGridMessage,
    ErrorMessage,
    FloodMessage,
    GameOverMessage,
    MoveMessage,
    PlayerDisconnectedMessage,
    PlayerReconnectedMessage,
    RoomStateMessage,
    SelectRoleMessage,
)


logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for game rooms.

    Tracks active connections per room and provides utilities for
    broadcasting messages to all players in a room.
    """

    def __init__(self):
        """Initialize the connection manager with empty storage and lock."""
        # Structure: {room_id: {player_id: WebSocket}}
        self.active_connections: dict[str, dict[str, WebSocket]] = {}
        # Track player ID to role mapping: {room_id: {player_id: role}}
        self.player_roles: dict[str, dict[str, PlayerRole | None]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, room_id: str, player_id: str, websocket: WebSocket) -> None:
        """
        Add a new WebSocket connection to a room.

        Args:
            room_id: The room identifier
            player_id: Unique identifier for the player
            websocket: The WebSocket connection
        """
        async with self.lock:
            if room_id not in self.active_connections:
                self.active_connections[room_id] = {}
                self.player_roles[room_id] = {}

            self.active_connections[room_id][player_id] = websocket
            self.player_roles[room_id][player_id] = None  # Role not assigned yet

            print(f"✅ Player {player_id[:8]} connected to room {room_id}")

    async def disconnect(self, room_id: str, player_id: str) -> PlayerRole | None:
        """
        Remove a WebSocket connection from a room.

        Args:
            room_id: The room identifier
            player_id: Unique identifier for the player

        Returns:
            The role of the disconnected player, if they had one
        """
        player_role = None

        async with self.lock:
            if room_id in self.active_connections:
                if player_id in self.active_connections[room_id]:
                    del self.active_connections[room_id][player_id]
                    player_role = self.player_roles[room_id].get(player_id)

                    if player_id in self.player_roles[room_id]:
                        del self.player_roles[room_id][player_id]

                    print(f"❌ Player {player_id[:8]} disconnected from room {room_id}")

                # Clean up empty rooms
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
                    if room_id in self.player_roles:
                        del self.player_roles[room_id]
                    print(f"🧹 Room {room_id} has no active connections")

        return player_role

    async def get_connections(self, room_id: str) -> dict[str, WebSocket]:
        """
        Get all active connections for a room.

        Args:
            room_id: The room identifier

        Returns:
            Dictionary mapping player IDs to WebSocket connections
        """
        return self.active_connections.get(room_id, {}).copy()

    async def set_player_role(
        self, room_id: str, player_id: str, role: PlayerRole
    ) -> None:
        """
        Set the role for a player in a room.

        Args:
            room_id: The room identifier
            player_id: Unique identifier for the player
            role: The role to assign
        """
        async with self.lock:
            if room_id in self.player_roles and player_id in self.player_roles[room_id]:
                self.player_roles[room_id][player_id] = role
                print(
                    f"🎭 Player {player_id[:8]} assigned role {role.value} in room {room_id}"
                )

    async def get_player_role(self, room_id: str, player_id: str) -> PlayerRole | None:
        """
        Get the role for a player in a room.

        Args:
            room_id: The room identifier
            player_id: Unique identifier for the player

        Returns:
            The player's role, or None if not assigned
        """
        if room_id in self.player_roles:
            return self.player_roles[room_id].get(player_id)
        return None

    async def broadcast(self, room_id: str, message: dict) -> int:
        """
        Broadcast a message to all players in a room.

        Args:
            room_id: The room identifier
            message: Message dictionary to send (will be JSON serialized)

        Returns:
            Number of successful sends
        """
        connections = await self.get_connections(room_id)
        success_count = 0
        failed_players = []

        for player_id, websocket in connections.items():
            try:
                await websocket.send_json(message)
                success_count += 1
            except Exception as e:
                print(f"⚠️ Failed to send to player {player_id[:8]}: {e}")
                failed_players.append(player_id)

        # Clean up failed connections
        for player_id in failed_players:
            await self.disconnect(room_id, player_id)

        if success_count > 0:
            msg_type = message.get("type", "unknown")
            print(
                f"📢 Broadcast {msg_type} to {success_count} player(s) in room {room_id}"
            )

        return success_count

    async def send_to_player(self, room_id: str, player_id: str, message: dict) -> bool:
        """
        Send a message to a specific player.

        Args:
            room_id: The room identifier
            player_id: Unique identifier for the player
            message: Message dictionary to send (will be JSON serialized)

        Returns:
            True if successful, False otherwise
        """
        connections = await self.get_connections(room_id)

        if player_id not in connections:
            print(f"⚠️ Player {player_id[:8]} not found in room {room_id}")
            return False

        try:
            await connections[player_id].send_json(message)
            msg_type = message.get("type", "unknown")
            print(f"📤 Sent {msg_type} to player {player_id[:8]} in room {room_id}")
            return True
        except Exception as e:
            print(f"⚠️ Failed to send to player {player_id[:8]}: {e}")
            await self.disconnect(room_id, player_id)
            return False


# Global connection manager instance
connection_manager = ConnectionManager()

# Create router
router = APIRouter()


class MessageContext:
    """
    Context object for message handling.

    Encapsulates common data and operations needed by message handlers,
    reducing parameter passing and providing caching for room and role lookups.
    """

    def __init__(self, room_id: str, player_id: str, websocket: WebSocket):
        """Initialize message context."""
        self.room_id = room_id
        self.player_id = player_id
        self.websocket = websocket
        self._room: GameRoom | None = None
        self._player_role: PlayerRole | None = None

    async def get_room(self) -> GameRoom | None:
        """Get room state (cached after first call)."""
        if self._room is None:
            self._room = await room_manager.get_room(self.room_id)
        return self._room

    async def get_player_role(self) -> PlayerRole | None:
        """Get player role (cached after first call)."""
        if self._player_role is None:
            self._player_role = await connection_manager.get_player_role(
                self.room_id, self.player_id
            )
        return self._player_role

    async def send_error(self, message: str) -> None:
        """Send error message to player."""
        error_msg = ErrorMessage(type="error", message=message)
        await self.websocket.send_json(error_msg.model_dump())

    async def broadcast(self, message: dict) -> int:
        """Broadcast message to all players in room."""
        return await connection_manager.broadcast(self.room_id, message)

    async def update_room(self, room: GameRoom) -> None:
        """Update room state in manager and clear cache."""
        await room_manager.update_room(self.room_id, room)
        self._room = room  # Update cache


async def validate_player_has_role(
    ctx: MessageContext, required_role: PlayerRole | None = None
) -> tuple[bool, str | None]:
    """
    Validate that player has selected a role.

    Args:
        ctx: Message context
        required_role: If specified, validates player has this specific role

    Returns:
        (is_valid, error_message)
    """
    player_role = await ctx.get_player_role()

    if not player_role:
        return False, "You must select a role before performing this action"

    if required_role and player_role != required_role:
        return False, f"Only the {required_role.value} player can perform this action"

    return True, None


async def validate_game_status(
    ctx: MessageContext, required_status: GameStatus
) -> tuple[bool, str | None]:
    """
    Validate that game is in required status.

    Args:
        ctx: Message context
        required_status: Required game status

    Returns:
        (is_valid, error_message)
    """
    room = await ctx.get_room()

    if not room:
        return False, "Room not found"

    if room.game_status != required_status:
        return (
            False,
            f"Game must be in {required_status.value} state (current: {room.game_status.value})",
        )

    return True, None


async def validate_current_turn(
    ctx: MessageContext, expected_role: PlayerRole
) -> tuple[bool, str | None]:
    """
    Validate that it's the expected player's turn.

    Args:
        ctx: Message context
        expected_role: Role that should have current turn

    Returns:
        (is_valid, error_message)
    """
    room = await ctx.get_room()

    if not room:
        return False, "Room not found"

    if room.current_role != expected_role:
        return False, f"It's not your turn (current: {room.current_role.value})"

    return True, None


def serialize_room_state(room: GameRoom) -> dict:
    """
    Serialize a GameRoom to a JSON-serializable dictionary with camelCase keys.

    Args:
        room: The GameRoom instance to serialize

    Returns:
        Dictionary representation of the room state (camelCase keys for frontend)
    """
    return {
        "roomId": room.room_id,
        "gridWidth": room.grid_width,
        "gridHeight": room.grid_height,
        "grid": (
            [[field.value for field in row] if row else None for row in room.grid]
            if room.grid
            else None
        ),
        "adventurerPosition": (
            {
                "x": room.adventurer_position.x,
                "y": room.adventurer_position.y,
            }
            if room.adventurer_position
            else None
        ),
        "currentTurn": room.current_turn,
        "currentRole": room.current_role.value,
        "players": room.players,
        "gameStatus": room.game_status.value,
        "winner": room.winner.value if room.winner else None,
        "maxFloodCount": room.max_flood_count,
        "createdAt": room.created_at.isoformat(),
        "endedAt": room.ended_at.isoformat() if room.ended_at else None,
    }


async def handle_select_role(message: dict, ctx: MessageContext) -> None:
    """
    Handle role selection message.

    Args:
        message: The role selection message
        ctx: Message context
    """
    logger.info(f"Handling select_role for player {ctx.player_id[:8]}")

    # Parse and validate message
    role_msg = SelectRoleMessage(**message)
    selected_role = role_msg.role
    print(f"  → Role selection: {selected_role.value}")

    # Get current room state
    room = await ctx.get_room()
    if not room:
        await ctx.send_error("Room not found")
        return

    # Check if role is already taken
    if room.players[selected_role.value]:
        # Check if this is a reconnection attempt
        # For reconnection, we allow the player to reclaim their role
        # even if it appears "taken" (because the previous connection was lost)
        is_reconnection_attempt = room.game_status in [
            GameStatus.CONFIGURING,
            GameStatus.ACTIVE,
        ]

        if is_reconnection_attempt:
            print(
                f"  → Reconnection attempt: allowing {selected_role.value} to reclaim role"
            )
            # Clear the "taken" status to allow reconnection
            room.players[selected_role.value] = False
        else:
            await ctx.send_error(f"Role {selected_role.value} is already taken")
            return

    # Check if this player already has a different role and clear it
    current_role = await ctx.get_player_role()
    if current_role and current_role != selected_role:
        room.players[current_role.value] = False
        print(
            f"  → Player {ctx.player_id[:8]} switching from {current_role.value} to {selected_role.value}"
        )

    # Assign role to player
    await connection_manager.set_player_role(ctx.room_id, ctx.player_id, selected_role)
    room.players[selected_role.value] = True

    # Detect if this is a reconnection (joining an active game)
    is_reconnection = room.game_status == GameStatus.ACTIVE

    # Check if both roles are filled
    if (
        room.players["adventurer"]
        and room.players["weather"]
        and room.game_status == GameStatus.WAITING
    ):
        # Only transition to CONFIGURING if currently WAITING
        # Keep ACTIVE status if already active (reconnection case)
        room.game_status = GameStatus.CONFIGURING
        print(f"  → Both roles filled! Room {ctx.room_id} transitioning to CONFIGURING")

    # Save updated room state
    await ctx.update_room(room)

    # Broadcast appropriate message based on reconnection status
    if is_reconnection:
        # Reconnection: notify other player that opponent is back
        logger.info(f"Player reconnected to active game in room {ctx.room_id}")
        print(f"  → Reconnection! {selected_role.value} rejoined active game")
        reconnect_msg = PlayerReconnectedMessage(
            type="player_reconnected", role=selected_role
        )
        broadcast_count = await ctx.broadcast(reconnect_msg.model_dump())
        logger.info(f"Reconnection broadcast sent to {broadcast_count} player(s)")
    else:
        # Initial connection: broadcast room state
        logger.info(f"Broadcasting role update to room {ctx.room_id}")
        room_state_msg = RoomStateMessage(
            type="room_state", state=serialize_room_state(room)
        )
        broadcast_count = await ctx.broadcast(room_state_msg.model_dump())
        logger.info(f"Broadcast sent to {broadcast_count} player(s)")


async def handle_configure_grid(message: dict, ctx: MessageContext) -> None:
    """
    Handle grid configuration message.

    Args:
        message: The grid configuration message
        ctx: Message context
    """
    logger.info(f"Handling configure_grid for player {ctx.player_id[:8]}")

    # Parse and validate message
    config_msg = ConfigureGridMessage(**message)
    grid_width = config_msg.width
    grid_height = config_msg.height
    max_flood_count = config_msg.max_flood_count
    print(
        f"  → Grid configuration: width={grid_width}, height={grid_height}, max_flood_count={max_flood_count}"
    )

    # Get current room state
    room = await ctx.get_room()
    if not room:
        await ctx.send_error("Room not found")
        return

    # Validate player has adventurer role
    is_valid, error_msg = await validate_player_has_role(ctx, PlayerRole.ADVENTURER)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Check room status (must be CONFIGURING)
    is_valid, error_msg = await validate_game_status(ctx, GameStatus.CONFIGURING)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Validate grid dimensions (3-10)
    is_valid, error_msg = validate_grid_dimensions(grid_width, grid_height)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Initialize game board
    board = Board(grid_width, grid_height)
    print(f"  → Board initialized: {grid_width}x{grid_height} grid with all DRY fields")

    # Update room state
    room.grid_width = grid_width
    room.grid_height = grid_height
    room.max_flood_count = max_flood_count
    room.grid = board.grid
    room.adventurer_position = Position(x=0, y=0)
    room.game_status = GameStatus.ACTIVE
    room.current_role = PlayerRole.ADVENTURER
    room.current_turn = 1

    print("  → Adventurer placed at (0, 0), game status: ACTIVE, turn: 1")

    # Save updated room state
    await ctx.update_room(room)

    # Broadcast updated room state to all players
    logger.info(f"Broadcasting game start to room {ctx.room_id}")
    room_state_msg = RoomStateMessage(
        type="room_state", state=serialize_room_state(room)
    )
    broadcast_count = await ctx.broadcast(room_state_msg.model_dump())
    logger.info(f"Game started! Broadcast sent to {broadcast_count} player(s)")
    print(f"  → Game started! Broadcast sent to {broadcast_count} player(s)")


async def handle_move(message: dict, ctx: MessageContext) -> None:
    """
    Handle adventurer move message.

    Args:
        message: The move message
        ctx: Message context
    """
    logger.info(f"Handling move for player {ctx.player_id[:8]}")

    # Parse and validate message
    move_msg = MoveMessage(**message)
    target_pos = move_msg.position
    print(f"  → Adventurer move to: ({target_pos.x}, {target_pos.y})")

    # Get current room state
    room = await ctx.get_room()
    if not room:
        await ctx.send_error("Room not found")
        return

    # Validate player has adventurer role
    is_valid, error_msg = await validate_player_has_role(ctx, PlayerRole.ADVENTURER)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Check room status (must be ACTIVE)
    is_valid, error_msg = await validate_game_status(ctx, GameStatus.ACTIVE)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Check if it's adventurer's turn
    is_valid, error_msg = await validate_current_turn(ctx, PlayerRole.ADVENTURER)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Create board instance from room state
    board = Board(room.grid_width, room.grid_height)
    board.grid = room.grid

    # Validate move
    is_valid, error_msg = validate_adventurer_move(
        board, room.adventurer_position, target_pos
    )
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Execute move: Update adventurer position
    room.adventurer_position = target_pos
    print(f"  → Adventurer moved to ({target_pos.x}, {target_pos.y})")

    # Dry adjacent fields (4 directions: N, E, S, W)
    adjacent_positions = board.get_adjacent_positions(
        target_pos, include_diagonals=False
    )
    dried_count = 0
    for adj_pos in adjacent_positions:
        if board.get_field_state(adj_pos) == FieldState.FLOODED:
            board.set_field_state(adj_pos, FieldState.DRY)
            dried_count += 1
    print(f"  → Dried {dried_count} adjacent field(s)")

    # Update room grid with modified board state
    room.grid = board.grid

    # Switch turn to weather
    room.current_role = PlayerRole.WEATHER

    # Check win condition
    winner, statistics = check_win_condition(
        board, room.adventurer_position, room.current_turn, PlayerRole.ADVENTURER
    )

    if winner:
        # Game over - adventurer won
        room.game_status = GameStatus.ENDED
        room.winner = winner
        room.ended_at = datetime.now()
        print(
            f"  → 🎉 GAME OVER! Winner: {winner.value} after {room.current_turn} turns"
        )

        # Save room state
        await ctx.update_room(room)

        # Broadcast game over message
        game_over_msg = GameOverMessage(
            type="game_over", winner=winner, stats=statistics
        )
        broadcast_count = await ctx.broadcast(game_over_msg.model_dump())
        logger.info(f"Game over broadcast sent to {broadcast_count} player(s)")
    else:
        # Game continues
        # Save room state
        await ctx.update_room(room)

        # Broadcast updated room state
        logger.info(f"Broadcasting move update to room {ctx.room_id}")
        room_state_msg = RoomStateMessage(
            type="room_state", state=serialize_room_state(room)
        )
        broadcast_count = await ctx.broadcast(room_state_msg.model_dump())
        logger.info(f"Move broadcast sent to {broadcast_count} player(s)")
        print(
            f"  → Move complete! Turn switched to weather. Broadcast to {broadcast_count} player(s)"
        )


async def handle_flood(message: dict, ctx: MessageContext) -> None:
    """
    Handle weather flood message.

    Args:
        message: The flood message
        ctx: Message context
    """
    logger.info(f"Handling flood for player {ctx.player_id[:8]}")

    # Parse and validate message
    flood_msg = FloodMessage(**message)
    flood_positions = flood_msg.positions
    print(f"  → Weather flood: {len(flood_positions)} position(s)")

    # Get current room state
    room = await ctx.get_room()
    if not room:
        await ctx.send_error("Room not found")
        return

    # Validate player has weather role
    is_valid, error_msg = await validate_player_has_role(ctx, PlayerRole.WEATHER)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Check room status (must be ACTIVE)
    is_valid, error_msg = await validate_game_status(ctx, GameStatus.ACTIVE)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Check if it's weather's turn
    is_valid, error_msg = await validate_current_turn(ctx, PlayerRole.WEATHER)
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Create board instance from room state
    board = Board(room.grid_width, room.grid_height)
    board.grid = room.grid

    # Validate flood
    is_valid, error_msg = validate_weather_flood(
        board, flood_positions, room.adventurer_position, room.max_flood_count
    )
    if not is_valid:
        await ctx.send_error(error_msg)
        return

    # Execute flood: Set positions to FLOODED
    for pos in flood_positions:
        board.set_field_state(pos, FieldState.FLOODED)
        print(f"  → Flooded field at ({pos.x}, {pos.y})")

    # Update room grid with modified board state
    room.grid = board.grid

    # Increment turn counter
    room.current_turn += 1
    print(f"  → Turn incremented to {room.current_turn}")

    # Switch turn to adventurer
    room.current_role = PlayerRole.ADVENTURER

    # Check win condition
    winner, statistics = check_win_condition(
        board, room.adventurer_position, room.current_turn, PlayerRole.WEATHER
    )

    if winner:
        # Game over - weather won (adventurer trapped)
        room.game_status = GameStatus.ENDED
        room.winner = winner
        room.ended_at = datetime.now()
        print(
            f"  → 🎉 GAME OVER! Winner: {winner.value} after {room.current_turn} turns"
        )

        # Save room state
        await ctx.update_room(room)

        # Broadcast game over message
        game_over_msg = GameOverMessage(
            type="game_over", winner=winner, stats=statistics
        )
        broadcast_count = await ctx.broadcast(game_over_msg.model_dump())
        logger.info(f"Game over broadcast sent to {broadcast_count} player(s)")
    else:
        # Game continues
        # Save room state
        await ctx.update_room(room)

        # Broadcast updated room state
        logger.info(f"Broadcasting flood update to room {ctx.room_id}")
        room_state_msg = RoomStateMessage(
            type="room_state", state=serialize_room_state(room)
        )
        broadcast_count = await ctx.broadcast(room_state_msg.model_dump())
        logger.info(f"Flood broadcast sent to {broadcast_count} player(s)")
        print(
            f"  → Flood complete! Turn {room.current_turn} switched to adventurer. Broadcast to {broadcast_count} player(s)"
        )


# Message handler registry
MESSAGE_HANDLERS = {
    "select_role": handle_select_role,
    "configure_grid": handle_configure_grid,
    "move": handle_move,
    "flood": handle_flood,
}


async def dispatch_message(message: dict, ctx: MessageContext) -> None:
    """
    Dispatch message to appropriate handler.

    Args:
        message: The message dictionary
        ctx: Message context
    """
    message_type = message.get("type")

    if not message_type:
        await ctx.send_error("Message must include 'type' field")
        return

    handler = MESSAGE_HANDLERS.get(message_type)

    if handler:
        try:
            await handler(message, ctx)
        except ValidationError as e:
            await ctx.send_error(f"Invalid message format: {str(e)}")
        except Exception as e:
            logger.exception(f"Error in {message_type} handler")
            print(f"⚠️ Error handling message: {e}")
            await ctx.send_error("Internal server error")
    else:
        await ctx.send_error(f"Unknown message type: {message_type}")


async def get_or_create_room(room_id: str) -> GameRoom:
    """
    Get existing room or create a new one.

    Args:
        room_id: The room identifier

    Returns:
        The GameRoom instance
    """
    room = await room_manager.get_room(room_id)

    if not room:
        # Create room if it doesn't exist (first player creates the room)
        room = GameRoom(
            room_id=room_id,
            grid_width=None,
            grid_height=None,
            grid=None,
            adventurer_position=None,
            current_turn=1,
            current_role=PlayerRole.ADVENTURER,
            players={"adventurer": False, "weather": False},
            game_status=GameStatus.WAITING,
            winner=None,
            created_at=datetime.now(),
            ended_at=None,
        )
        # Directly add to room manager (update_room requires room to exist)
        async with room_manager.lock:
            room_manager.rooms[room_id] = room
        print(f"🎮 Room {room_id} created by first player")

    return room


async def send_initial_state(websocket: WebSocket, room: GameRoom) -> None:
    """
    Send initial room state to a connecting player.

    Args:
        websocket: The WebSocket connection
        room: The GameRoom instance
    """
    room_state_msg = RoomStateMessage(
        type="room_state", state=serialize_room_state(room)
    )
    await websocket.send_json(room_state_msg.model_dump())


async def handle_message_loop(
    room_id: str, player_id: str, websocket: WebSocket
) -> None:
    """
    Handle incoming messages in a loop until disconnect.

    Args:
        room_id: The room identifier
        player_id: The player identifier
        websocket: The WebSocket connection
    """
    while True:
        # Receive message from client
        data = await websocket.receive_text()

        try:
            # Parse JSON message
            message = json.loads(data)
            message_type = message.get("type", "unknown")

            logger.info(
                f"📨 Received {message_type} from player {player_id[:8]} in room {room_id}"
            )
            print(
                f"📨 Received {message_type} from player {player_id[:8]} in room {room_id}"
            )

            # Create context and dispatch message
            ctx = MessageContext(room_id, player_id, websocket)
            await dispatch_message(message, ctx)

        except json.JSONDecodeError:
            error_msg = ErrorMessage(type="error", message="Invalid JSON format")
            await websocket.send_json(error_msg.model_dump())
        except Exception as e:
            print(f"⚠️ Error handling message: {e}")
            error_msg = ErrorMessage(type="error", message="Internal server error")
            await websocket.send_json(error_msg.model_dump())


async def handle_disconnection(room_id: str, player_id: str) -> None:
    """
    Handle player disconnection cleanup.

    Args:
        room_id: The room identifier
        player_id: The player identifier
    """
    # Handle disconnection
    player_role = await connection_manager.disconnect(room_id, player_id)

    # Notify other players if this player had a role
    if player_role:
        disconnect_msg = PlayerDisconnectedMessage(
            type="player_disconnected", role=player_role
        )
        await connection_manager.broadcast(room_id, disconnect_msg.model_dump())

        # Update room state to mark player as disconnected
        room = await room_manager.get_room(room_id)
        if room:
            room.players[player_role.value] = False
            await room_manager.update_room(room_id, room)
            print(f"🔄 Updated room {room_id}: {player_role.value} disconnected")


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for game room connections.

    Handles connection, message routing, and disconnection for players
    joining a specific game room.

    Args:
        websocket: The WebSocket connection
        room_id: The room identifier to join
    """
    # Accept connection first (required by FastAPI/Starlette)
    await websocket.accept()

    # Generate unique player ID
    player_id = str(uuid.uuid4())

    # Get or create room
    room = await get_or_create_room(room_id)

    # Connect player to room
    await connection_manager.connect(room_id, player_id, websocket)

    try:
        # Send initial room state to the connecting player
        await send_initial_state(websocket, room)
        print(f"📤 Sent initial room state to player {player_id[:8]}")

        # Handle incoming messages in a loop
        await handle_message_loop(room_id, player_id, websocket)

    except WebSocketDisconnect:
        print(f"🔌 Player {player_id[:8]} disconnected from room {room_id}")
    except Exception as e:
        print(f"⚠️ Unexpected error in WebSocket connection: {e}")
    finally:
        # Clean up on disconnection
        await handle_disconnection(room_id, player_id)
