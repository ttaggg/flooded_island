"""
Game logic module for Flooded Island.

Contains core game mechanics including board management, move validation,
win condition checking, and room management.
"""

from game.board import Board
from game.room_manager import RoomManager, room_manager
from game.validator import (
    is_journeyman_trapped,
    validate_grid_dimensions,
    validate_journeyman_move,
    validate_weather_flood,
)
from game.win_checker import (
    calculate_statistics,
    check_journeyman_victory,
    check_weather_victory,
    check_win_condition,
)


__all__ = [
    "Board",
    "validate_journeyman_move",
    "validate_weather_flood",
    "is_journeyman_trapped",
    "validate_grid_dimensions",
    "check_journeyman_victory",
    "check_weather_victory",
    "calculate_statistics",
    "check_win_condition",
    "RoomManager",
    "room_manager",
]
