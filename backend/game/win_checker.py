"""
Win condition checking and game statistics for Flooding Islands.

Provides functions to check victory conditions for both players
and calculate game statistics.
"""

from game.board import Board
from game.validator import is_journeyman_trapped
from models.game import FieldState, PlayerRole, Position


def check_journeyman_victory(current_turn: int) -> bool:
    """
    Check if the journeyman has won by surviving 365 turns.

    Args:
        current_turn: The current turn number

    Returns:
        True if journeyman has survived 365 turns, False otherwise
    """
    return current_turn >= 365


def check_weather_victory(board: Board, journeyman_pos: Position) -> bool:
    """
    Check if weather has won by trapping the journeyman.

    Args:
        board: The game board
        journeyman_pos: Current position of the journeyman

    Returns:
        True if journeyman is trapped (no valid moves), False otherwise
    """
    return is_journeyman_trapped(board, journeyman_pos)


def calculate_statistics(board: Board, current_turn: int) -> dict:
    """
    Calculate game statistics.

    Args:
        board: The game board
        current_turn: The current turn number

    Returns:
        Dictionary containing:
        - days_survived: Number of turns played
        - fields_flooded: Count of flooded fields
        - fields_dry: Count of dry fields
        - total_fields: Total number of fields on the board
    """
    # Count field states
    fields_flooded = 0
    fields_dry = 0

    for row in board.grid:
        for field_state in row:
            if field_state == FieldState.FLOODED:
                fields_flooded += 1
            else:
                fields_dry += 1

    total_fields = board.grid_size * board.grid_size

    return {
        "days_survived": current_turn,
        "fields_flooded": fields_flooded,
        "fields_dry": fields_dry,
        "total_fields": total_fields,
    }


def check_win_condition(
    board: Board,
    journeyman_pos: Position,
    current_turn: int,
    current_role: PlayerRole,
) -> tuple[PlayerRole | None, dict]:
    """
    Check for win conditions after a turn is completed.

    This function should be called after each player's turn to determine
    if the game has ended and calculate final statistics.

    Args:
        board: The game board
        journeyman_pos: Current position of the journeyman
        current_turn: The current turn number
        current_role: The role that just completed their turn

    Returns:
        Tuple of (winner, statistics):
        - winner: PlayerRole of the winner, or None if game continues
        - statistics: Dictionary with game statistics
    """
    statistics = calculate_statistics(board, current_turn)
    winner = None

    # Check journeyman victory (365 turns completed)
    # This should be checked after journeyman completes their turn
    if current_role == PlayerRole.JOURNEYMAN and check_journeyman_victory(current_turn):
        winner = PlayerRole.JOURNEYMAN

    # Check weather victory (journeyman trapped)
    # This should be checked after weather completes their turn
    if current_role == PlayerRole.WEATHER and check_weather_victory(
        board, journeyman_pos
    ):
        winner = PlayerRole.WEATHER

    return (winner, statistics)
