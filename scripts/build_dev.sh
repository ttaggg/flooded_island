#!/bin/bash

# Flooded Island - Development Build Script (uses .env.dev)

set -euo pipefail

echo "🔨 Building Flooded Island for DEVELOPMENT..."
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

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "📋 Configuration:"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo "   Backend host: ${BACKEND_HOST:-localhost}"
echo "   Backend port: ${BACKEND_PORT:-8000}"
echo "   Frontend host: ${FRONTEND_HOST:-localhost}"
echo "   Frontend port: ${FRONTEND_PORT:-5173}"
echo ""

echo "🐍 Preparing backend..."
cd "$REPO_ROOT/backend"

echo "   Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    uv venv || python3 -m venv .venv
fi

source .venv/bin/activate
echo "   Installing dependencies..."
if command -v uv >/dev/null 2>&1; then
    uv pip install -r requirements.txt || pip install -r requirements.txt
else
    pip install -r requirements.txt
fi
deactivate

cd ..
echo "✅ Backend ready"
echo ""

echo "⚛️  Preparing frontend..."
cd "$REPO_ROOT/frontend"

echo "   Clearing cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

echo "   Installing dependencies..."
npm install

echo "   Building frontend..."
npm run build

cd ..
echo "✅ Frontend built"
echo ""

echo "🎉 Development build complete!"
echo "   Backend: http://${BACKEND_HOST:-localhost}:${BACKEND_PORT:-8000}"
echo "   Frontend: http://${FRONTEND_HOST:-localhost}:${FRONTEND_PORT:-5173}"
echo ""
