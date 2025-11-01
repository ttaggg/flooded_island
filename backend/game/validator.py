"""
Move validation logic for Flooded Island game.

Provides validation functions for adventurer movement, weather flooding,
trap detection, and grid configuration.
"""

from game.board import Board
from models.game import FieldState, Position


def validate_adventurer_move(
    board: Board, current_pos: Position, target_pos: Position
) -> tuple[bool, str]:
    """
    Validate if adventurer can move from current position to target position.

    Args:
        board: The game board
        current_pos: Current position of the adventurer
        target_pos: Target position to move to

    Returns:
        Tuple of (is_valid, error_message). If valid, error_message is empty string.
    """
    # Check if target position is within grid bounds
    if not board.is_valid_position(target_pos):
        return (
            False,
            f"Target position ({target_pos.x}, {target_pos.y}) is outside grid bounds",
        )

    # Check if target position is adjacent (8 directions)
    adjacent_positions = board.get_adjacent_positions(
        current_pos, include_diagonals=True
    )
    if target_pos not in adjacent_positions:
        return (
            False,
            f"Target position ({target_pos.x}, {target_pos.y}) is not adjacent to current position ({current_pos.x}, {current_pos.y})",
        )

    # Check if target field is DRY
    target_state = board.get_field_state(target_pos)
    if target_state != FieldState.DRY:
        return (
            False,
            f"Target position ({target_pos.x}, {target_pos.y}) is flooded - adventurer can only move to dry fields",
        )

    return (True, "")


def validate_weather_flood(
    board: Board,
    positions: list[Position],
    adventurer_pos: Position,
    max_flood_count: int,
) -> tuple[bool, str]:
    """
    Validate if weather can flood the specified positions.

    Args:
        board: The game board
        positions: List of positions to flood (0 to max_flood_count positions)
        adventurer_pos: Current position of the adventurer
        max_flood_count: Maximum number of fields weather can flood per turn

    Returns:
        Tuple of (is_valid, error_message). If valid, error_message is empty string.
    """
    # Check positions count is within limit
    if len(positions) > max_flood_count:
        return (
            False,
            f"Weather can only flood up to {max_flood_count} fields per turn, got {len(positions)}",
        )

    # Validate each position
    for pos in positions:
        # Check if position is within grid bounds
        if not board.is_valid_position(pos):
            return (
                False,
                f"Position ({pos.x}, {pos.y}) is outside grid bounds",
            )

        # Check if field is currently DRY (cannot flood already flooded fields)
        field_state = board.get_field_state(pos)
        if field_state != FieldState.DRY:
            return (
                False,
                f"Position ({pos.x}, {pos.y}) is already flooded - can only flood dry fields",
            )

        # Check if position is NOT the adventurer's current position
        if pos == adventurer_pos:
            return (
                False,
                f"Cannot flood position ({pos.x}, {pos.y}) - adventurer is currently there",
            )

    return (True, "")


def is_adventurer_trapped(board: Board, adventurer_pos: Position) -> bool:
    """
    Check if the adventurer is trapped (no valid moves available).

    Args:
        board: The game board
        adventurer_pos: Current position of the adventurer

    Returns:
        True if adventurer is trapped (no dry adjacent fields), False otherwise
    """
    # Get all adjacent positions (8 directions)
    adjacent_positions = board.get_adjacent_positions(
        adventurer_pos, include_diagonals=True
    )

    # Check if any adjacent field is DRY
    for pos in adjacent_positions:
        if board.get_field_state(pos) == FieldState.DRY:
            return False  # Found at least one dry field, not trapped

    # No dry fields available - adventurer is trapped
    return True


def validate_grid_dimensions(width: int, height: int) -> tuple[bool, str]:
    """
    Validate if the grid dimensions are within acceptable range.

    Args:
        width: Proposed grid width
        height: Proposed grid height

    Returns:
        Tuple of (is_valid, error_message). If valid, error_message is empty string.
    """
    if not 3 <= width <= 10:
        return (
            False,
            f"Grid width must be between 3 and 10 (inclusive), got {width}",
        )
    if not 3 <= height <= 10:
        return (
            False,
            f"Grid height must be between 3 and 10 (inclusive), got {height}",
        )

    return (True, "")
