"""
FastAPI application entry point for Flooded Island game.
Provides health check endpoint and configures CORS for frontend communication.
"""

import asyncio
import os
from contextlib import asynccontextmanager, suppress

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from game.room_manager import start_cleanup_task
from routers import websocket


# Load environment variables
load_dotenv()

# Get frontend URL for CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for startup and shutdown events.
    Replaces deprecated @app.on_event decorators.
    """
    # Startup
    print("🌊 Flooded Island API starting up...")
    print(f"📡 CORS enabled for: {frontend_url}")

    # Start background cleanup task
    cleanup_task = asyncio.create_task(start_cleanup_task())

    yield

    # Shutdown
    print("🌊 Flooded Island API shutting down...")
    cleanup_task.cancel()
    with suppress(asyncio.CancelledError):
        await cleanup_task


# Initialize FastAPI application
app = FastAPI(
    title="Flooded Island API",
    description="Backend API for the Flooded Island multiplayer game",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket router
app.include_router(websocket.router, tags=["websocket"])


@app.get("/")
async def health_check():
    """
    Health check endpoint.
    Returns API status and basic information.
    """
    return {
        "status": "ok",
        "message": "Flooded Island API is running",
        "version": "1.0.0",
    }


@app.post("/rooms")
async def create_room():
    """
    Create a new game room.
    Returns the room ID and initial state.
    """
    from game.room_manager import room_manager

    room = await room_manager.create_room()
    return {
        "room_id": room.room_id,
        "status": room.game_status.value,
        "created_at": room.created_at.isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, log_level="info")
