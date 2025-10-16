# Flooding Islands - Backend

FastAPI backend for the Flooding Islands multiplayer game.

## Prerequisites

- Python 3.13 (or 3.11+)
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer (install via `curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Setup Instructions

### 1. Create Virtual Environment with uv

```bash
cd backend
uv venv
```

This creates a `.venv` directory with a Python virtual environment using uv (a fast Python package installer).

### 2. Activate Virtual Environment

**macOS/Linux:**
```bash
source .venv/bin/activate
```

**Windows:**
```bash
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
uv pip install -r requirements.txt
```

**Note:** Using `uv` provides significantly faster dependency resolution and installation compared to traditional pip.

### 4. Configure Environment Variables

Environment variables are configured in the **root `.env` file** (shared with frontend).
The root `.env` file contains all necessary configuration including:
- `BACKEND_PORT=8000`
- `FRONTEND_URL=http://localhost:5173`

No additional configuration needed for the backend.

### 5. Run the Server

**Activate virtual environment first:**
```bash
source .venv/bin/activate
```

**Then run:**

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## Verify Installation

✅ **Verified Working** - The setup has been tested and confirmed working:
- Virtual environment created with uv (Python 3.13.5)
- All dependencies installed successfully (19 packages)
- Server starts on port 8000
- Health check endpoint returns: `{"status":"ok","message":"Flooding Islands API is running","version":"1.0.0"}`

Once the server is running, visit:
- Health check: http://localhost:8000
- API docs: http://localhost:8000/docs
- Interactive API docs: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py              # FastAPI app entry point
├── requirements.txt     # Python dependencies
├── game/               # Game logic modules
│   └── __init__.py
├── models/             # Pydantic data models
│   └── __init__.py
└── routers/            # API routes and WebSocket handlers
    └── __init__.py
```

**Note:** Environment variables are configured in the root `../.env` file (shared with frontend).

## Dependencies

- **FastAPI** (>=0.104.0): Web framework
- **Uvicorn** (>=0.24.0): ASGI server
- **python-dotenv** (>=1.0.0): Environment variable management
- **websockets** (>=12.0): WebSocket support

