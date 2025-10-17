"""
Game state data models for Flooding Islands.

Defines core game entities including field states, positions, player roles,
game status, and the complete game room state.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class FieldState(str, Enum):
    """State of a field on the game grid."""

    DRY = "dry"
    FLOODED = "flooded"


class PlayerRole(str, Enum):
    """Player role in the game."""

    JOURNEYMAN = "journeyman"
    WEATHER = "weather"


class GameStatus(str, Enum):
    """Current status of the game."""

    WAITING = "waiting"  # Waiting for players to join/select roles
    CONFIGURING = "configuring"  # Both roles filled, configuring grid
    ACTIVE = "active"  # Game in progress
    ENDED = "ended"  # Game finished


class Position(BaseModel):
    """Coordinates on the game grid."""

    x: int = Field(..., ge=0, description="X coordinate (non-negative)")
    y: int = Field(..., ge=0, description="Y coordinate (non-negative)")

    def __eq__(self, other):
        """Check equality based on coordinates."""
        if not isinstance(other, Position):
            return False
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        """Make Position hashable for use in sets/dicts."""
        return hash((self.x, self.y))


class GameRoom(BaseModel):
    """Complete game room state."""

    room_id: str = Field(..., description="Unique room identifier")
    grid_size: int | None = Field(
        None, ge=3, le=10, description="Grid size (3-10), None until configured"
    )
    grid: list[list[FieldState]] | None = Field(
        None, description="2D grid of field states, None until game starts"
    )
    journeyman_position: Position | None = Field(
        None, description="Current position of journeyman, None until game starts"
    )
    current_turn: int = Field(
        1, ge=1, le=365, description="Current turn number (1-365)"
    )
    current_role: PlayerRole = Field(
        PlayerRole.JOURNEYMAN, description="Which player's turn it is"
    )
    players: dict[str, bool] = Field(
        default_factory=lambda: {"journeyman": False, "weather": False},
        description="Which roles are filled",
    )
    game_status: GameStatus = Field(
        GameStatus.WAITING, description="Current game status"
    )
    winner: PlayerRole | None = Field(
        None, description="Winner of the game, None if not ended"
    )
    created_at: datetime = Field(
        default_factory=datetime.now, description="Room creation timestamp"
    )
    ended_at: datetime | None = Field(
        None, description="Game end timestamp, None if not ended"
    )

    @field_validator("grid")
    @classmethod
    def validate_grid(cls, v, info):
        """Validate that grid matches grid_size if both are set."""
        if v is not None:
            grid_size = info.data.get("grid_size")
            if grid_size is not None:
                if len(v) != grid_size:
                    raise ValueError(f"Grid height must equal grid_size ({grid_size})")
                for row in v:
                    if len(row) != grid_size:
                        raise ValueError(
                            f"Grid width must equal grid_size ({grid_size})"
                        )
        return v

    class Config:
        """Pydantic configuration."""

        use_enum_values = False  # Keep enums as enum instances
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            FieldState: lambda v: v.value,
            PlayerRole: lambda v: v.value,
            GameStatus: lambda v: v.value,
        }
