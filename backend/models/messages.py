"""
WebSocket message models for Flooding Islands.

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
    """Message sent to configure the grid size."""

    type: Literal["configure_grid"] = "configure_grid"
    size: int = Field(..., ge=3, le=10, description="Grid size (3-10)")


class MoveMessage(BaseModel):
    """Message sent when journeyman moves."""

    type: Literal["move"] = "move"
    position: Position = Field(..., description="Destination position")


class FloodMessage(BaseModel):
    """Message sent when weather floods fields."""

    type: Literal["flood"] = "flood"
    positions: list[Position] = Field(
        ..., description="Positions to flood (0-2 fields)"
    )

    @field_validator("positions")
    @classmethod
    def validate_positions_count(cls, v):
        """Ensure weather can only flood 0-2 fields per turn."""
        if len(v) > 2:
            raise ValueError("Weather can only flood up to 2 fields per turn")
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
