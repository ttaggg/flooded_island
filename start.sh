#!/bin/bash

# Flooding Islands - Start Script
# Starts both backend and frontend development servers

set -e

echo "🌊 Starting Flooding Islands..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create PID file directory if it doesn't exist
mkdir -p .pids

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "⚠️  Interrupted. Cleaning up..."
    if [ -f .pids/backend.pid ]; then
        BACKEND_PID=$(cat .pids/backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -f .pids/frontend.pid ]; then
        FRONTEND_PID=$(cat .pids/frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f .pids/backend.pid .pids/frontend.pid
    exit 1
}

trap cleanup INT TERM

# Check if servers are already running
if [ -f .pids/backend.pid ] || [ -f .pids/frontend.pid ]; then
    echo "⚠️  Servers may already be running. Run ./stop.sh first."
    exit 1
fi

# Start Backend
echo "🐍 Starting Backend Server..."
cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    uv venv
fi

# Activate virtual environment and start server
source .venv/bin/activate

# Install dependencies if needed
if [ ! -f ".venv/.installed" ]; then
    echo "   Installing dependencies..."
    uv pip install -r requirements.txt
    touch .venv/.installed
fi

# Start backend in background
nohup python main.py > ../.pids/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.pids/backend.pid
echo "   ✅ Backend started (PID: $BACKEND_PID)"
echo "   📡 API: http://localhost:${BACKEND_PORT:-8000}"
echo "   📚 Docs: http://localhost:${BACKEND_PORT:-8000}/docs"

cd ..

# Start Frontend
echo ""
echo "⚛️  Starting Frontend Server..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

# Start frontend in background
nohup npm run dev > ../.pids/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.pids/frontend.pid
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
echo "   🌐 App: http://localhost:5173"

cd ..

# Wait a moment for servers to start
echo ""
echo "⏳ Waiting for servers to initialize..."
sleep 3

# Check if processes are still running
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
echo "🎮 Open http://localhost:5173 in your browser to play"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f .pids/backend.log"
echo "   Frontend: tail -f .pids/frontend.log"
echo ""
echo "🛑 To stop servers: ./stop.sh"
echo ""

