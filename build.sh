#!/bin/bash

# Flooded Island - Build Script
# Builds both backend dependencies and frontend with proper environment variables

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Load environment variables if .env exists
[ -f .env ] && export $(grep -v '^#' .env | xargs)

# Determine backend URL
if [ -n "${VITE_BACKEND_URL:-}" ]; then
    BACKEND_URL="$VITE_BACKEND_URL"
elif [ -n "${SERVER_IP:-}" ]; then
    BACKEND_URL="http://${SERVER_IP}:8000"
else
    BACKEND_URL="http://localhost:8000"
fi

export VITE_BACKEND_URL="$BACKEND_URL"

echo "🔨 Building Flooded Island..."
echo "   Backend URL: $BACKEND_URL"
echo ""

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend

# Function to test if uv actually works
uv_works() {
    uv --version >/dev/null 2>&1
}

# Function to find uv binary
find_uv() {
    local uv_path=""
    # Check common locations
    for path in "$HOME/.cargo/bin/uv" "$HOME/.local/bin/uv" "/usr/local/bin/uv"; do
        if [ -f "$path" ] && [ -x "$path" ]; then
            uv_path="$path"
            break
        fi
    done
    # Check PATH
    if [ -z "$uv_path" ]; then
        uv_path=$(command -v uv 2>/dev/null || true)
    fi
    echo "$uv_path"
}

# Ensure uv is available and working
UV_CMD=""
if uv_works; then
    UV_CMD="uv"
elif UV_PATH=$(find_uv) && [ -n "$UV_PATH" ]; then
    export PATH="$(dirname "$UV_PATH"):$PATH"
    if uv_works; then
        UV_CMD="uv"
    fi
fi

# Install uv if not available
if [ -z "$UV_CMD" ]; then
    echo "   Installing uv..."
    if command -v curl >/dev/null 2>&1; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.cargo/bin:$PATH"
    elif command -v pip3 >/dev/null 2>&1 || command -v pip >/dev/null 2>&1; then
        $(command -v pip3 2>/dev/null || command -v pip) install uv
    else
        echo "   ❌ Error: Cannot install uv. Need curl or pip."
        exit 1
    fi

    # Verify uv works after installation
    if ! uv_works; then
        echo "   ❌ Error: uv installation failed or uv not in PATH"
        exit 1
    fi
    UV_CMD="uv"
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    $UV_CMD venv || {
        echo "   ⚠️  uv venv failed, falling back to python3 -m venv"
        python3 -m venv .venv
    }
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "   Installing dependencies..."
$UV_CMD pip install -r requirements.txt || {
    echo "   ⚠️  uv pip failed, falling back to pip"
    pip install -r requirements.txt
}

cd ..

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo ""
echo "🏗️  Building frontend..."
npm run build

cd ..

echo ""
echo "✅ Build complete!"
echo "   Frontend built in: frontend/dist"
