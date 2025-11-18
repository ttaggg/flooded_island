# Flooded Island - Backend

## Project Structure

```
backend
├── game
│   ├── board.py
│   ├── room_manager.py
│   ├── validator.py
│   └── win_checker.py
├── main.py
├── models
│   ├── game.py
│   └── messages.py
├── pyproject.toml
├── README.md
└── routers
    └── websocket.py
```

**Note:** Environment variables are configured in the root `../.env.{dev,prod}` file (shared with frontend).

## Dependencies

Dependencies are managed through `pyproject.toml` and installed using `uv`:

- **FastAPI** (>=0.104.0): Web framework
- **Uvicorn** (>=0.24.0): ASGI server
- **python-dotenv** (>=1.0.0): Environment variable management
- **websockets** (>=12.0): WebSocket support
- **pydantic** (>=2.0.0): Data validation
- **httpx** (>=0.25.0): HTTP client
- **ruff** (>=0.7.0): Linting and formatting
- **pre-commit** (>=3.8.0): Git hooks

To install dependencies:
```bash
uv sync
```
