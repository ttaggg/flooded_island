#!/bin/bash

# Flooded Island - Development Stop Script

echo "🛑 Stopping Flooded Island development servers..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

PID_DIR="$REPO_ROOT/.pids"

if [ ! -f "$PID_DIR/backend.pid" ] && [ ! -f "$PID_DIR/frontend.pid" ]; then
    echo "ℹ️  No servers appear to be running (no PID files found)"
    exit 0
fi

if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🐍 Stopping Backend Server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo "   ✅ Backend stopped"
    else
        echo "   ⚠️  Backend process not found (PID: $BACKEND_PID)"
    fi
    rm -f "$PID_DIR/backend.pid"
else
    echo "   ℹ️  Backend PID file not found"
fi

if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⚛️  Stopping Frontend Server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo "   ✅ Frontend stopped"
    else
        echo "   ⚠️  Frontend process not found (PID: $FRONTEND_PID)"
    fi
    rm -f "$PID_DIR/frontend.pid"
else
    echo "   ℹ️  Frontend PID file not found"
fi

if [ -f "$PID_DIR/backend.log" ]; then
    rm -f "$PID_DIR/backend.log"
fi

if [ -f "$PID_DIR/frontend.log" ]; then
    rm -f "$PID_DIR/frontend.log"
fi

if [ -d "$PID_DIR" ] && [ -z "$(ls -A "$PID_DIR")" ]; then
    rmdir "$PID_DIR"
fi

echo ""
echo "✅ All development servers stopped successfully"
echo ""
