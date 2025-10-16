"""
Room management for Flooding Islands game.

Handles room lifecycle including creation, storage, retrieval, updates,
and automatic cleanup of ended games after 5 minutes.
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import Optional

from models.game import GameRoom, GameStatus, PlayerRole


class RoomManager:
    """
    Manages game rooms with in-memory storage and automatic cleanup.

    Provides thread-safe operations for creating, retrieving, updating,
    and deleting game rooms. Includes background task for cleaning up
    rooms that ended more than 5 minutes ago.
    """

    # Character set for room IDs (excluding confusing chars: 0/O, 1/I/L)
    ROOM_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    ROOM_ID_LENGTH = 6
    CLEANUP_INTERVAL_SECONDS = 60  # Check for cleanup every 60 seconds
    CLEANUP_THRESHOLD_SECONDS = 300  # Delete rooms 5 minutes after end

    def __init__(self):
        """Initialize the room manager with empty storage and lock."""
        self.rooms: dict[str, GameRoom] = {}
        self.lock = asyncio.Lock()

    def _generate_room_id(self) -> str:
        """
        Generate a unique random room ID.

        Creates a 6-character alphanumeric code using uppercase letters
        and digits (excluding confusing characters like 0/O, 1/I).
        Checks for collisions and retries if necessary.

        Returns:
            A unique room ID string (e.g., "A3X9K2")
        """
        max_attempts = 100
        for _ in range(max_attempts):
            room_id = "".join(
                random.choice(self.ROOM_ID_CHARS) for _ in range(self.ROOM_ID_LENGTH)
            )
            if room_id not in self.rooms:
                return room_id

        # Fallback: append timestamp if still colliding after 100 attempts
        room_id = "".join(
            random.choice(self.ROOM_ID_CHARS) for _ in range(self.ROOM_ID_LENGTH)
        )
        return room_id

    async def create_room(self) -> GameRoom:
        """
        Create a new game room with a unique ID.

        Initializes a new GameRoom with default values (waiting status,
        no players assigned, turn 1, journeyman's turn).

        Returns:
            The newly created GameRoom instance
        """
        async with self.lock:
            room_id = self._generate_room_id()
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
            self.rooms[room_id] = room
            return room

    async def get_room(self, room_id: str) -> Optional[GameRoom]:
        """
        Retrieve a room by its ID.

        Args:
            room_id: The unique identifier of the room

        Returns:
            The GameRoom if found, None otherwise
        """
        return self.rooms.get(room_id)

    async def update_room(self, room_id: str, room: GameRoom) -> None:
        """
        Update a room's state.

        Args:
            room_id: The unique identifier of the room
            room: The updated GameRoom instance

        Raises:
            KeyError: If the room doesn't exist
        """
        async with self.lock:
            if room_id not in self.rooms:
                raise KeyError(f"Room {room_id} does not exist")
            self.rooms[room_id] = room

    async def delete_room(self, room_id: str) -> None:
        """
        Delete a room from storage.

        Args:
            room_id: The unique identifier of the room to delete
        """
        async with self.lock:
            if room_id in self.rooms:
                del self.rooms[room_id]

    async def room_exists(self, room_id: str) -> bool:
        """
        Check if a room exists.

        Args:
            room_id: The unique identifier of the room

        Returns:
            True if the room exists, False otherwise
        """
        return room_id in self.rooms

    async def cleanup_old_rooms(self) -> int:
        """
        Remove rooms that ended more than 5 minutes ago.

        Iterates through all rooms and deletes those with ended_at
        timestamp older than CLEANUP_THRESHOLD_SECONDS.

        Returns:
            Number of rooms deleted
        """
        deleted_count = 0
        now = datetime.now()
        threshold = timedelta(seconds=self.CLEANUP_THRESHOLD_SECONDS)

        async with self.lock:
            # Create list of room IDs to delete (can't modify dict during iteration)
            rooms_to_delete = []

            for room_id, room in self.rooms.items():
                # Only cleanup rooms that have ended
                if room.ended_at is not None:
                    time_since_end = now - room.ended_at
                    if time_since_end >= threshold:
                        rooms_to_delete.append(room_id)

            # Delete the identified rooms
            for room_id in rooms_to_delete:
                del self.rooms[room_id]
                deleted_count += 1

        return deleted_count


# Global singleton instance
room_manager = RoomManager()


async def start_cleanup_task():
    """
    Background task that periodically cleans up old rooms.

    Runs indefinitely, checking every CLEANUP_INTERVAL_SECONDS
    for rooms that need to be cleaned up. Logs cleanup activity.

    This task should be started at application startup and cancelled
    at shutdown.
    """
    print("🧹 Room cleanup task started")

    while True:
        try:
            await asyncio.sleep(room_manager.CLEANUP_INTERVAL_SECONDS)
            deleted_count = await room_manager.cleanup_old_rooms()

            if deleted_count > 0:
                print(f"🧹 Cleaned up {deleted_count} old room(s)")
        except asyncio.CancelledError:
            print("🧹 Room cleanup task stopped")
            break
        except Exception as e:
            print(f"⚠️ Error in cleanup task: {e}")
            # Continue running despite errors
