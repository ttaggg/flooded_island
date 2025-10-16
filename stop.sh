#!/bin/bash

# Flooding Islands - Stop Script
# Stops both backend and frontend development servers

echo "🛑 Stopping Flooding Islands servers..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if PID files exist
if [ ! -f .pids/backend.pid ] && [ ! -f .pids/frontend.pid ]; then
    echo "ℹ️  No servers appear to be running (no PID files found)"
    exit 0
fi

# Stop Backend
if [ -f .pids/backend.pid ]; then
    BACKEND_PID=$(cat .pids/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🐍 Stopping Backend Server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        # Wait for graceful shutdown
        sleep 1
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo "   ✅ Backend stopped"
    else
        echo "   ⚠️  Backend process not found (PID: $BACKEND_PID)"
    fi
    rm -f .pids/backend.pid
else
    echo "   ℹ️  Backend PID file not found"
fi

# Stop Frontend
if [ -f .pids/frontend.pid ]; then
    FRONTEND_PID=$(cat .pids/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⚛️  Stopping Frontend Server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        # Wait for graceful shutdown
        sleep 1
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo "   ✅ Frontend stopped"
    else
        echo "   ⚠️  Frontend process not found (PID: $FRONTEND_PID)"
    fi
    rm -f .pids/frontend.pid
else
    echo "   ℹ️  Frontend PID file not found"
fi

# Clean up log files
if [ -f .pids/backend.log ]; then
    rm -f .pids/backend.log
fi

if [ -f .pids/frontend.log ]; then
    rm -f .pids/frontend.log
fi

# Remove .pids directory if empty
if [ -d .pids ] && [ -z "$(ls -A .pids)" ]; then
    rmdir .pids
fi

echo ""
echo "✅ All servers stopped successfully"
echo ""

