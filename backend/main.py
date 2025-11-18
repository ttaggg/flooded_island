"""
FastAPI application entry point for Flooded Island game.
Provides health check endpoint and configures CORS for frontend communication.
"""

import asyncio
import os
from contextlib import asynccontextmanager, suppress
from datetime import UTC, datetime
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from game.room_manager import start_cleanup_task
from routers import websocket


# Load environment variables
load_dotenv(".env")

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

# Mount static files (frontend build) - mount everything except API routes
frontend_dist_path = Path(__file__).parent.parent / "frontend" / "dist"
if Path(frontend_dist_path).exists():
    # Mount static files for all non-API routes
    app.mount(
        "/assets", StaticFiles(directory=frontend_dist_path / "assets"), name="assets"
    )
    app.mount("/vite.svg", StaticFiles(directory=frontend_dist_path), name="vite-svg")


def health_payload() -> dict[str, str]:
    """
    Return a consistent payload for health endpoints.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
        "service": "flooded-island-backend",
    }


@app.get("/")
async def serve_frontend():
    """
    Serve the frontend application.
    Falls back to API info if frontend is not built.
    """
    frontend_dist_path = Path(__file__).parent.parent / "frontend" / "dist"
    index_file = Path(frontend_dist_path) / "index.html"

    if Path(index_file).exists():
        return FileResponse(index_file)
    # Fallback to API info if frontend is not built
    return {
        "status": "ok",
        "message": "Flooded Island API is running",
        "version": "1.0.0",
        "note": "Frontend not built. Run 'cd frontend && npm run build' to build the frontend.",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns API status and basic information.
    """
    return health_payload()


@app.post("/api/rooms")
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


@app.get("/{path:path}")
async def catch_all(path: str):
    """
    Catch-all route to serve the frontend for any non-API routes.
    This handles client-side routing for React.
    """
    # Skip API routes
    if path.startswith("api/") or path.startswith("ws"):
        return {"error": "Not found"}

    frontend_dist_path = Path(__file__).parent.parent / "frontend" / "dist"
    index_file = Path(frontend_dist_path) / "index.html"

    if Path(index_file).exists():
        return FileResponse(index_file)
    return {"error": "Frontend not built"}


if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8000))
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, log_level="info")
