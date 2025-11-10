#!/bin/bash

# Flooded Island - Development Deploy Script
# Starts backend and frontend development servers using .env.dev

set -e

echo "🚀 Starting Flooded Island development stack..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/.env.dev"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    echo "   Create it from your development template (e.g., .env.dev.example)."
    exit 1
fi

echo "📝 Loading environment from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

BACKEND_HOST=${BACKEND_HOST:-localhost}
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_HOST=${FRONTEND_HOST:-localhost}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

PID_DIR="$REPO_ROOT/.pids"
mkdir -p "$PID_DIR"

cleanup() {
    echo ""
    echo "⚠️  Interrupted. Cleaning up..."
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$PID_DIR/backend.pid")
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/backend.pid" "$PID_DIR/frontend.pid"
    exit 1
}

trap cleanup INT TERM

if [ -f "$PID_DIR/backend.pid" ] || [ -f "$PID_DIR/frontend.pid" ]; then
    echo "⚠️  Servers may already be running. Run ./scripts/stop_dev.sh first."
    exit 1
fi

echo "🐍 Starting backend server..."
cd "$REPO_ROOT/backend"

if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    uv venv || python3 -m venv .venv
fi

source .venv/bin/activate

if [ ! -f ".venv/.installed" ]; then
    echo "   Installing dependencies..."
    if command -v uv >/dev/null 2>&1; then
        uv pip install -r requirements.txt || pip install -r requirements.txt
    else
        pip install -r requirements.txt
    fi
    touch .venv/.installed
fi

PYTHON_EXEC="$(pwd)/.venv/bin/python"

nohup "$PYTHON_EXEC" main.py > "$PID_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PID_DIR/backend.pid"
echo "   ✅ Backend started (PID: $BACKEND_PID)"
echo "   📡 API: http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "   📚 Docs: http://${BACKEND_HOST}:${BACKEND_PORT}/docs"

deactivate
cd ..

echo ""
echo "⚛️  Starting frontend server..."
cd "$REPO_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

nohup npm run dev > "$PID_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
echo "   🌐 App: http://${FRONTEND_HOST}:${FRONTEND_PORT}"

cd ..

echo ""
echo "⏳ Waiting for servers to initialize..."
sleep 3

if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check .pids/backend.log"
    cleanup
fi

if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "❌ Frontend failed to start. Check .pids/frontend.log"
    cleanup
fi

echo ""
echo "✅ Both servers are running!"
echo ""
echo "🎮 Open http://${FRONTEND_HOST}:${FRONTEND_PORT} in your browser to play"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f .pids/backend.log"
echo "   Frontend: tail -f .pids/frontend.log"
echo ""
echo "🛑 To stop servers: ./scripts/stop_dev.sh"
echo ""
