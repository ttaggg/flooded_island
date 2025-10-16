"""
Board management for Flooding Islands game.

Handles grid initialization, field state management, position validation,
and adjacency calculations for both movement (8 directions) and drying (4 directions).
"""

from models.game import FieldState, Position


class Board:
    """
    Manages the game board grid and field operations.

    The board is an NxN grid where (0,0) is the top-left corner
    and (n-1, n-1) is the bottom-right corner.
    """

    def __init__(self, grid_size: int):
        """
        Initialize a new game board.

        Args:
            grid_size: Size of the grid (must be between 3 and 10 inclusive)

        Raises:
            ValueError: If grid_size is not between 3 and 10
        """
        if not 3 <= grid_size <= 10:
            raise ValueError(f"Grid size must be between 3 and 10, got {grid_size}")

        self.grid_size = grid_size
        # Initialize all fields as DRY
        self.grid: list[list[FieldState]] = [
            [FieldState.DRY for _ in range(grid_size)] for _ in range(grid_size)
        ]

    def get_field_state(self, position: Position) -> FieldState:
        """
        Get the state of a field at the given position.

        Args:
            position: The position to query

        Returns:
            The state of the field (DRY or FLOODED)

        Raises:
            ValueError: If position is outside grid bounds
        """
        if not self.is_valid_position(position):
            raise ValueError(
                f"Position ({position.x}, {position.y}) is outside grid bounds (0-{self.grid_size - 1})"
            )

        return self.grid[position.y][position.x]

    def set_field_state(self, position: Position, state: FieldState) -> None:
        """
        Set the state of a field at the given position.

        Args:
            position: The position to update
            state: The new state (DRY or FLOODED)

        Raises:
            ValueError: If position is outside grid bounds
        """
        if not self.is_valid_position(position):
            raise ValueError(
                f"Position ({position.x}, {position.y}) is outside grid bounds (0-{self.grid_size - 1})"
            )

        self.grid[position.y][position.x] = state

    def is_valid_position(self, position: Position) -> bool:
        """
        Check if a position is within the grid bounds.

        Args:
            position: The position to validate

        Returns:
            True if position is within bounds, False otherwise
        """
        return 0 <= position.x < self.grid_size and 0 <= position.y < self.grid_size

    def get_adjacent_positions(
        self, position: Position, include_diagonals: bool = True
    ) -> list[Position]:
        """
        Get all valid adjacent positions to a given position.

        Args:
            position: The center position
            include_diagonals: If True, includes diagonal neighbors (8 directions)
                             If False, only cardinal directions (4 directions: N, E, S, W)

        Returns:
            List of valid adjacent positions (only those within grid bounds)
        """
        adjacent = []

        if include_diagonals:
            # 8 directions: N, NE, E, SE, S, SW, W, NW
            directions = [
                (-1, -1),  # NW
                (0, -1),  # N
                (1, -1),  # NE
                (1, 0),  # E
                (1, 1),  # SE
                (0, 1),  # S
                (-1, 1),  # SW
                (-1, 0),  # W
            ]
        else:
            # 4 directions: N, E, S, W (cardinal directions only)
            directions = [
                (0, -1),  # N
                (1, 0),  # E
                (0, 1),  # S
                (-1, 0),  # W
            ]

        for dx, dy in directions:
            new_x = position.x + dx
            new_y = position.y + dy
            # Check bounds before creating Position (Position validates x,y >= 0)
            if 0 <= new_x < self.grid_size and 0 <= new_y < self.grid_size:
                adjacent.append(Position(x=new_x, y=new_y))

        return adjacent
