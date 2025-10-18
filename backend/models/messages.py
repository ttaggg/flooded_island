"""
WebSocket message models for Flooded Island.

Defines all message types for client-to-server and server-to-client communication.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from .game import PlayerRole, Position


# ============================================================================
# Client → Server Messages
# ============================================================================


class SelectRoleMessage(BaseModel):
    """Message sent when a player selects their role."""

    type: Literal["select_role"] = "select_role"
    role: PlayerRole = Field(..., description="Role the player wants to take")


class ConfigureGridMessage(BaseModel):
    """Message sent to configure the grid dimensions."""

    type: Literal["configure_grid"] = "configure_grid"
    width: int = Field(..., ge=3, le=10, description="Grid width (3-10)")
    height: int = Field(..., ge=3, le=10, description="Grid height (3-10)")
    max_flood_count: int = Field(
        ...,
        ge=1,
        le=3,
        alias="maxFloodCount",
        description="Maximum fields weather can flood per turn (1-3)",
    )

    @field_validator("max_flood_count")
    @classmethod
    def validate_max_flood_count(cls, v):
        """Ensure max flood count is within valid range."""
        if v < 1 or v > 3:
            raise ValueError("Max flood count must be between 1 and 3")
        return v

    class Config:
        """Pydantic configuration."""

        populate_by_name = True  # Allow both field name and alias


class MoveMessage(BaseModel):
    """Message sent when journeyman moves."""

    type: Literal["move"] = "move"
    position: Position = Field(..., description="Destination position")


class FloodMessage(BaseModel):
    """Message sent when weather floods fields."""

    type: Literal["flood"] = "flood"
    positions: list[Position] = Field(
        ..., description="Positions to flood (0 to max_flood_count fields)"
    )

    @field_validator("positions")
    @classmethod
    def validate_positions_count(cls, v):
        """Ensure positions list is not empty and contains valid positions."""
        if len(v) < 0:
            raise ValueError("Positions list cannot be negative")
        return v


class EndTurnMessage(BaseModel):
    """Message sent to end the current turn."""

    type: Literal["end_turn"] = "end_turn"


# ============================================================================
# Server → Client Messages
# ============================================================================


class RoomStateMessage(BaseModel):
    """Message containing the current room state."""

    type: Literal["room_state"] = "room_state"
    state: dict[str, Any] = Field(
        ...,
        description="Current room state (simplified, without WebSocket connections)",
    )


class GameUpdateMessage(BaseModel):
    """Message containing game state updates."""

    type: Literal["game_update"] = "game_update"
    state: dict[str, Any] = Field(..., description="Updated game state")


class GameOverMessage(BaseModel):
    """Message sent when the game ends."""

    type: Literal["game_over"] = "game_over"
    winner: PlayerRole = Field(..., description="Winner of the game")
    stats: dict[str, Any] = Field(
        ..., description="Game statistics (days survived, fields flooded, etc.)"
    )


class ErrorMessage(BaseModel):
    """Message sent when an error occurs."""

    type: Literal["error"] = "error"
    message: str = Field(..., description="Error description")


class PlayerDisconnectedMessage(BaseModel):
    """Message sent when a player disconnects."""

    type: Literal["player_disconnected"] = "player_disconnected"
    role: PlayerRole = Field(..., description="Role of the disconnected player")


class PlayerReconnectedMessage(BaseModel):
    """Message sent when a player reconnects."""

    type: Literal["player_reconnected"] = "player_reconnected"
    role: PlayerRole = Field(..., description="Role of the reconnected player")
