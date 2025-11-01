#!/bin/bash

# Flooded Island - Build Script
# Builds both backend dependencies and frontend with proper environment variables

set -e

echo "🔨 Building Flooded Island..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Function to get the server's IP address
get_server_ip() {
    # Try to get the primary non-localhost IP address
    # macOS/Linux compatible
    if command -v ip >/dev/null 2>&1; then
        # Linux
        ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1
    elif command -v ifconfig >/dev/null 2>&1; then
        # macOS
        ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1
    else
        # Fallback: use hostname -I or hostname
        hostname -I 2>/dev/null | awk '{print $1}' || hostname
    fi
}

# Determine backend URL
# Priority: VITE_BACKEND_URL from .env > Auto-detect IP > Default to localhost
if [ -n "$VITE_BACKEND_URL" ]; then
    BACKEND_URL="$VITE_BACKEND_URL"
    echo "✅ Using VITE_BACKEND_URL from .env: $BACKEND_URL"
elif [ -n "$SERVER_IP" ]; then
    # Use SERVER_IP if explicitly set
    BACKEND_URL="http://${SERVER_IP}:8000"
    echo "✅ Using SERVER_IP from environment: $BACKEND_URL"
else
    # Auto-detect server IP
    SERVER_IP=$(get_server_ip)
    if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "127.0.0.1" ]; then
        BACKEND_URL="http://${SERVER_IP}:8000"
        echo "✅ Auto-detected server IP: $SERVER_IP"
        echo "✅ Using backend URL: $BACKEND_URL"
    else
        # Fallback to localhost
        BACKEND_URL="http://localhost:8000"
        echo "⚠️  Could not detect server IP, using localhost: $BACKEND_URL"
        echo "   To set manually, create .env with: VITE_BACKEND_URL=http://YOUR_IP:8000"
    fi
fi

# Export for Vite build
export VITE_BACKEND_URL="$BACKEND_URL"

echo ""
echo "📦 Installing backend dependencies..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment with uv..."
    uv venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies using uv
echo "   Installing dependencies with uv..."
uv pip install -r requirements.txt

cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo ""
echo "🏗️  Building frontend with VITE_BACKEND_URL=$VITE_BACKEND_URL..."
npm run build

cd ..

echo ""
echo "✅ Build complete!"
echo "   Backend URL configured: $BACKEND_URL"
echo "   Frontend built in: frontend/dist"
echo ""
echo "🚀 To start the server, run your start command"
