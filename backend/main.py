"""
FastAPI application entry point for Flooded Island game.
Provides health check endpoint and configures CORS for frontend communication.
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from game.room_manager import start_cleanup_task
from routers import websocket


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

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
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", 8000)))
    logger.info("🌊 Flooded Island API starting up...")
    logger.info(f"📡 CORS enabled for: {frontend_url}")
    logger.info(f"🔌 WebSocket endpoint: ws://0.0.0.0:{port}/ws/{{room_id}}")
    logger.info(f"🌐 Server listening on port: {port}")

    # Start background cleanup task
    cleanup_task = asyncio.create_task(start_cleanup_task())

    yield

    # Shutdown
    logger.info("🌊 Flooded Island API shutting down...")
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
# Note: CORS doesn't apply to WebSocket connections, but helps with preflight requests
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


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint.
    Returns API status and basic information.
    """
    return {
        "status": "ok",
        "message": "Flooded Island API is running",
        "version": "1.0.0",
        "websocket_supported": True,
        "websocket_endpoint": "/ws/{room_id}",
    }


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
    import uvicorn

    # Render.com uses PORT environment variable, fallback to BACKEND_PORT, then 8000
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", 8000)))
    # Disable reload in production (Render sets this automatically)
    reload = os.getenv("ENVIRONMENT", "").lower() != "production"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload, log_level="info")
