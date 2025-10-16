"""
FastAPI application entry point for Flooding Islands game.
Provides health check endpoint and configures CORS for frontend communication.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    print("🌊 Flooding Islands API starting up...")
    print(f"📡 CORS enabled for: {frontend_url}")
    yield
    # Shutdown
    print("🌊 Flooding Islands API shutting down...")


# Initialize FastAPI application
app = FastAPI(
    title="Flooding Islands API",
    description="Backend API for the Flooding Islands multiplayer game",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    """
    Health check endpoint.
    Returns API status and basic information.
    """
    return {
        "status": "ok",
        "message": "Flooding Islands API is running",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, log_level="info")
