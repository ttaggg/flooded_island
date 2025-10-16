"""
Game logic module for Flooding Islands.

Contains core game mechanics including board management, move validation,
and win condition checking.
"""

from game.board import Board
from game.validator import (
    is_journeyman_trapped,
    validate_grid_size,
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
    "validate_grid_size",
    "check_journeyman_victory",
    "check_weather_victory",
    "calculate_statistics",
    "check_win_condition",
]
