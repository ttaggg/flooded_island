"""
WebSocket connection handler for Flooding Islands game.

Manages real-time multiplayer communication including connection management,
message routing, and broadcasting to players in game rooms.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from game.board import Board
from game.room_manager import room_manager
from game.validator import (
    validate_grid_size,
    validate_journeyman_move,
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
        self.player_roles: dict[str, dict[str, Optional[PlayerRole]]] = {}
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

    async def disconnect(self, room_id: str, player_id: str) -> Optional[PlayerRole]:
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

    async def get_player_role(
        self, room_id: str, player_id: str
    ) -> Optional[PlayerRole]:
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


def serialize_room_state(room: GameRoom) -> dict:
    """
    Serialize a GameRoom to a JSON-serializable dictionary.

    Args:
        room: The GameRoom instance to serialize

    Returns:
        Dictionary representation of the room state
    """
    return {
        "room_id": room.room_id,
        "grid_size": room.grid_size,
        "grid": (
            [[field.value for field in row] if row else None for row in room.grid]
            if room.grid
            else None
        ),
        "journeyman_position": (
            {
                "x": room.journeyman_position.x,
                "y": room.journeyman_position.y,
            }
            if room.journeyman_position
            else None
        ),
        "current_turn": room.current_turn,
        "current_role": room.current_role.value,
        "players": room.players,
        "game_status": room.game_status.value,
        "winner": room.winner.value if room.winner else None,
        "created_at": room.created_at.isoformat(),
        "ended_at": room.ended_at.isoformat() if room.ended_at else None,
    }


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
    room = await room_manager.get_room(room_id)

    if not room:
        # Create room if it doesn't exist (first player creates the room)
        room = GameRoom(
            room_id=room_id,
            grid_size=None,
            grid=None,
            journeyman_position=None,
            current_turn=1,
            current_role=PlayerRole.JOURNEYMAN,
            players={"journeyman": False, "weather": False},
            game_status=GameStatus.WAITING,
            winner=None,
            created_at=datetime.now(),
            ended_at=None,
        )
        # Directly add to room manager (update_room requires room to exist)
        async with room_manager.lock:
            room_manager.rooms[room_id] = room
        print(f"🎮 Room {room_id} created by first player")

    await connection_manager.connect(room_id, player_id, websocket)

    try:
        # Send initial room state to the connecting player
        room_state_msg = RoomStateMessage(
            type="room_state", state=serialize_room_state(room)
        )
        await websocket.send_json(room_state_msg.model_dump())
        print(f"📤 Sent initial room state to player {player_id[:8]}")

        # Message loop - keep connection alive and handle incoming messages
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                # Parse JSON message
                message = json.loads(data)
                message_type = message.get("type")

                if not message_type:
                    error_msg = ErrorMessage(
                        type="error", message="Message must include 'type' field"
                    )
                    await websocket.send_json(error_msg.model_dump())
                    continue

                logger.info(
                    f"📨 Received {message_type} from player {player_id[:8]} in room {room_id}"
                )
                print(
                    f"📨 Received {message_type} from player {player_id[:8]} in room {room_id}"
                )

                # Message handling - implemented in tasks 3.2-3.4
                if message_type == "select_role":
                    logger.info(f"Handling select_role for player {player_id[:8]}")
                    # Task 3.2: Role Selection
                    try:
                        # Parse and validate message
                        role_msg = SelectRoleMessage(**message)
                        selected_role = role_msg.role
                        print(f"  → Role selection: {selected_role.value}")

                        # Get current room state
                        room = await room_manager.get_room(room_id)
                        if not room:
                            error_msg = ErrorMessage(
                                type="error", message="Room not found"
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check if role is already taken
                        if room.players[selected_role.value]:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"Role {selected_role.value} is already taken",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check if this player already has a different role and clear it
                        current_role = await connection_manager.get_player_role(
                            room_id, player_id
                        )
                        if current_role and current_role != selected_role:
                            room.players[current_role.value] = False
                            print(
                                f"  → Player {player_id[:8]} switching from {current_role.value} to {selected_role.value}"
                            )

                        # Assign role to player
                        await connection_manager.set_player_role(
                            room_id, player_id, selected_role
                        )
                        room.players[selected_role.value] = True

                        # Detect if this is a reconnection (joining an active game)
                        is_reconnection = room.game_status == GameStatus.ACTIVE

                        # Check if both roles are filled
                        if room.players["journeyman"] and room.players["weather"]:
                            # Only transition to CONFIGURING if currently WAITING
                            # Keep ACTIVE status if already active (reconnection case)
                            if room.game_status == GameStatus.WAITING:
                                room.game_status = GameStatus.CONFIGURING
                                print(
                                    f"  → Both roles filled! Room {room_id} transitioning to CONFIGURING"
                                )

                        # Save updated room state
                        await room_manager.update_room(room_id, room)

                        # Broadcast appropriate message based on reconnection status
                        if is_reconnection:
                            # Reconnection: notify other player that opponent is back
                            logger.info(
                                f"Player reconnected to active game in room {room_id}"
                            )
                            print(
                                f"  → Reconnection! {selected_role.value} rejoined active game"
                            )
                            reconnect_msg = PlayerReconnectedMessage(
                                type="player_reconnected", role=selected_role
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, reconnect_msg.model_dump()
                            )
                            logger.info(
                                f"Reconnection broadcast sent to {broadcast_count} player(s)"
                            )
                        else:
                            # Initial connection: broadcast room state
                            logger.info(f"Broadcasting role update to room {room_id}")
                            room_state_msg = RoomStateMessage(
                                type="room_state", state=serialize_room_state(room)
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, room_state_msg.model_dump()
                            )
                            logger.info(
                                f"Broadcast sent to {broadcast_count} player(s)"
                            )

                    except ValidationError as e:
                        error_msg = ErrorMessage(
                            type="error",
                            message=f"Invalid role selection: {str(e)}",
                        )
                        await websocket.send_json(error_msg.model_dump())

                elif message_type == "configure_grid":
                    logger.info(f"Handling configure_grid for player {player_id[:8]}")
                    # Task 3.3: Grid Configuration
                    try:
                        # Parse and validate message
                        config_msg = ConfigureGridMessage(**message)
                        grid_size = config_msg.size
                        print(f"  → Grid configuration: size={grid_size}")

                        # Get current room state
                        room = await room_manager.get_room(room_id)
                        if not room:
                            error_msg = ErrorMessage(
                                type="error", message="Room not found"
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Verify player role first (more specific error)
                        player_role = await connection_manager.get_player_role(
                            room_id, player_id
                        )
                        if not player_role:
                            error_msg = ErrorMessage(
                                type="error",
                                message="You must select a role before configuring the grid",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        if player_role != PlayerRole.JOURNEYMAN:
                            error_msg = ErrorMessage(
                                type="error",
                                message="Only the journeyman player can configure the grid",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check room status (must be CONFIGURING)
                        if room.game_status != GameStatus.CONFIGURING:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"Room must be in configuring state to set grid size (current: {room.game_status.value})",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Validate grid size (3-10)
                        is_valid, error_message = validate_grid_size(grid_size)
                        if not is_valid:
                            error_msg = ErrorMessage(
                                type="error", message=error_message
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Initialize game board
                        board = Board(grid_size)
                        print(
                            f"  → Board initialized: {grid_size}x{grid_size} grid with all DRY fields"
                        )

                        # Update room state
                        room.grid_size = grid_size
                        room.grid = board.grid
                        room.journeyman_position = Position(x=0, y=0)
                        room.game_status = GameStatus.ACTIVE
                        room.current_role = PlayerRole.JOURNEYMAN
                        room.current_turn = 1

                        print(
                            f"  → Journeyman placed at (0, 0), game status: ACTIVE, turn: 1"
                        )

                        # Save updated room state
                        await room_manager.update_room(room_id, room)

                        # Broadcast updated room state to all players
                        logger.info(f"Broadcasting game start to room {room_id}")
                        room_state_msg = RoomStateMessage(
                            type="room_state", state=serialize_room_state(room)
                        )
                        broadcast_count = await connection_manager.broadcast(
                            room_id, room_state_msg.model_dump()
                        )
                        logger.info(
                            f"Game started! Broadcast sent to {broadcast_count} player(s)"
                        )
                        print(
                            f"  → Game started! Broadcast sent to {broadcast_count} player(s)"
                        )

                    except ValidationError as e:
                        error_msg = ErrorMessage(
                            type="error",
                            message=f"Invalid grid configuration: {str(e)}",
                        )
                        await websocket.send_json(error_msg.model_dump())

                elif message_type == "move":
                    logger.info(f"Handling move for player {player_id[:8]}")
                    # Task 3.4: Journeyman Move
                    try:
                        # Parse and validate message
                        move_msg = MoveMessage(**message)
                        target_pos = move_msg.position
                        print(
                            f"  → Journeyman move to: ({target_pos.x}, {target_pos.y})"
                        )

                        # Get current room state
                        room = await room_manager.get_room(room_id)
                        if not room:
                            error_msg = ErrorMessage(
                                type="error", message="Room not found"
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Verify player role
                        player_role = await connection_manager.get_player_role(
                            room_id, player_id
                        )
                        if not player_role:
                            error_msg = ErrorMessage(
                                type="error",
                                message="You must select a role before making a move",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        if player_role != PlayerRole.JOURNEYMAN:
                            error_msg = ErrorMessage(
                                type="error",
                                message="Only the journeyman player can make moves",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check room status (must be ACTIVE)
                        if room.game_status != GameStatus.ACTIVE:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"Game must be active to make moves (current: {room.game_status.value})",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check if it's journeyman's turn
                        if room.current_role != PlayerRole.JOURNEYMAN:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"It's not your turn (current: {room.current_role.value})",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Create board instance from room state
                        board = Board(room.grid_size)
                        board.grid = room.grid

                        # Validate move
                        is_valid, error_message = validate_journeyman_move(
                            board, room.journeyman_position, target_pos
                        )
                        if not is_valid:
                            error_msg = ErrorMessage(
                                type="error", message=error_message
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Execute move: Update journeyman position
                        room.journeyman_position = target_pos
                        print(
                            f"  → Journeyman moved to ({target_pos.x}, {target_pos.y})"
                        )

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
                            board,
                            room.journeyman_position,
                            room.current_turn,
                            PlayerRole.JOURNEYMAN,
                        )

                        if winner:
                            # Game over - journeyman won
                            room.game_status = GameStatus.ENDED
                            room.winner = winner
                            room.ended_at = datetime.now()
                            print(
                                f"  → 🎉 GAME OVER! Winner: {winner.value} after {room.current_turn} turns"
                            )

                            # Save room state
                            await room_manager.update_room(room_id, room)

                            # Broadcast game over message
                            game_over_msg = GameOverMessage(
                                type="game_over", winner=winner, stats=statistics
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, game_over_msg.model_dump()
                            )
                            logger.info(
                                f"Game over broadcast sent to {broadcast_count} player(s)"
                            )
                        else:
                            # Game continues
                            # Save room state
                            await room_manager.update_room(room_id, room)

                            # Broadcast updated room state
                            logger.info(f"Broadcasting move update to room {room_id}")
                            room_state_msg = RoomStateMessage(
                                type="room_state", state=serialize_room_state(room)
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, room_state_msg.model_dump()
                            )
                            logger.info(
                                f"Move broadcast sent to {broadcast_count} player(s)"
                            )
                            print(
                                f"  → Move complete! Turn switched to weather. Broadcast to {broadcast_count} player(s)"
                            )

                    except ValidationError as e:
                        error_msg = ErrorMessage(
                            type="error",
                            message=f"Invalid move message: {str(e)}",
                        )
                        await websocket.send_json(error_msg.model_dump())

                elif message_type == "flood":
                    logger.info(f"Handling flood for player {player_id[:8]}")
                    # Task 3.4: Weather Flood
                    try:
                        # Parse and validate message
                        flood_msg = FloodMessage(**message)
                        flood_positions = flood_msg.positions
                        print(f"  → Weather flood: {len(flood_positions)} position(s)")

                        # Get current room state
                        room = await room_manager.get_room(room_id)
                        if not room:
                            error_msg = ErrorMessage(
                                type="error", message="Room not found"
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Verify player role
                        player_role = await connection_manager.get_player_role(
                            room_id, player_id
                        )
                        if not player_role:
                            error_msg = ErrorMessage(
                                type="error",
                                message="You must select a role before flooding fields",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        if player_role != PlayerRole.WEATHER:
                            error_msg = ErrorMessage(
                                type="error",
                                message="Only the weather player can flood fields",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check room status (must be ACTIVE)
                        if room.game_status != GameStatus.ACTIVE:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"Game must be active to flood fields (current: {room.game_status.value})",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Check if it's weather's turn
                        if room.current_role != PlayerRole.WEATHER:
                            error_msg = ErrorMessage(
                                type="error",
                                message=f"It's not your turn (current: {room.current_role.value})",
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Create board instance from room state
                        board = Board(room.grid_size)
                        board.grid = room.grid

                        # Validate flood
                        is_valid, error_message = validate_weather_flood(
                            board, flood_positions, room.journeyman_position
                        )
                        if not is_valid:
                            error_msg = ErrorMessage(
                                type="error", message=error_message
                            )
                            await websocket.send_json(error_msg.model_dump())
                            continue

                        # Execute flood: Set positions to FLOODED
                        for pos in flood_positions:
                            board.set_field_state(pos, FieldState.FLOODED)
                            print(f"  → Flooded field at ({pos.x}, {pos.y})")

                        # Update room grid with modified board state
                        room.grid = board.grid

                        # Increment turn counter
                        room.current_turn += 1
                        print(f"  → Turn incremented to {room.current_turn}")

                        # Switch turn to journeyman
                        room.current_role = PlayerRole.JOURNEYMAN

                        # Check win condition
                        winner, statistics = check_win_condition(
                            board,
                            room.journeyman_position,
                            room.current_turn,
                            PlayerRole.WEATHER,
                        )

                        if winner:
                            # Game over - weather won (journeyman trapped)
                            room.game_status = GameStatus.ENDED
                            room.winner = winner
                            room.ended_at = datetime.now()
                            print(
                                f"  → 🎉 GAME OVER! Winner: {winner.value} after {room.current_turn} turns"
                            )

                            # Save room state
                            await room_manager.update_room(room_id, room)

                            # Broadcast game over message
                            game_over_msg = GameOverMessage(
                                type="game_over", winner=winner, stats=statistics
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, game_over_msg.model_dump()
                            )
                            logger.info(
                                f"Game over broadcast sent to {broadcast_count} player(s)"
                            )
                        else:
                            # Game continues
                            # Save room state
                            await room_manager.update_room(room_id, room)

                            # Broadcast updated room state
                            logger.info(f"Broadcasting flood update to room {room_id}")
                            room_state_msg = RoomStateMessage(
                                type="room_state", state=serialize_room_state(room)
                            )
                            broadcast_count = await connection_manager.broadcast(
                                room_id, room_state_msg.model_dump()
                            )
                            logger.info(
                                f"Flood broadcast sent to {broadcast_count} player(s)"
                            )
                            print(
                                f"  → Flood complete! Turn {room.current_turn} switched to journeyman. Broadcast to {broadcast_count} player(s)"
                            )

                    except ValidationError as e:
                        error_msg = ErrorMessage(
                            type="error",
                            message=f"Invalid flood message: {str(e)}",
                        )
                        await websocket.send_json(error_msg.model_dump())

                else:
                    # Unknown message type
                    error_msg = ErrorMessage(
                        type="error", message=f"Unknown message type: {message_type}"
                    )
                    await websocket.send_json(error_msg.model_dump())

            except json.JSONDecodeError:
                error_msg = ErrorMessage(type="error", message="Invalid JSON format")
                await websocket.send_json(error_msg.model_dump())
            except ValidationError as e:
                error_msg = ErrorMessage(
                    type="error", message=f"Message validation failed: {str(e)}"
                )
                await websocket.send_json(error_msg.model_dump())
            except Exception as e:
                print(f"⚠️ Error handling message: {e}")
                error_msg = ErrorMessage(type="error", message="Internal server error")
                await websocket.send_json(error_msg.model_dump())

    except WebSocketDisconnect:
        print(f"🔌 Player {player_id[:8]} disconnected from room {room_id}")
    except Exception as e:
        print(f"⚠️ Unexpected error in WebSocket connection: {e}")
    finally:
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
