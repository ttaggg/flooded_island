#!/bin/bash

# Flooded Island - Production Build Script (uses .env.prod)

set -euo pipefail

echo "🔨 Building Flooded Island for PRODUCTION..."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    echo "   Create it from your production template (e.g., .env.prod.example)."
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "📋 Configuration:"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo "   DOMAIN: ${DOMAIN:-}"
echo "   Backend URL: ${VITE_BACKEND_URL:-}"
echo "   Frontend URL: ${FRONTEND_URL:-}"
echo ""

echo "🐍 Preparing backend..."
cd "$REPO_ROOT/backend"

echo "   Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate
echo "   Installing dependencies..."
pip install -q -r requirements.txt
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

echo "🎉 Production build complete!"
echo "   Backend URL: ${VITE_BACKEND_URL:-}"
echo "   Frontend URL: ${FRONTEND_URL:-}"
echo ""
