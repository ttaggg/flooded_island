#!/bin/bash

# Flooded Island - Production Deployment Script
# Deploys application to /var/www/flooded-island with nginx and systemd

set -e

echo "🌊 Deploying Flooded Island to Production..."
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run with sudo"
    echo "Usage: sudo ./deploy.sh"
    exit 1
fi

# Get the actual user (not root) who invoked sudo
ACTUAL_USER="${SUDO_USER:-$USER}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
DEPLOY_DIR="/var/www/flooded-island"
SERVICE_NAME="flooded-island-backend"
NGINX_AVAILABLE="/etc/nginx/sites-available/flooded-island.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/flooded-island.conf"
SYSTEMD_SERVICE="/etc/systemd/system/${SERVICE_NAME}.service"
LOG_DIR="/var/log/flooded-island"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found!"
    echo "   Please create .env.production with production configuration"
    echo "   You can use the following template:"
    echo ""
    cat << 'EOF'
BACKEND_PORT=8000
HOST=0.0.0.0
FRONTEND_URL=https://island.olegmagn.es
VITE_BACKEND_URL=https://island.olegmagn.es
VITE_WS_URL=wss://island.olegmagn.es
DOMAIN=island.olegmagn.es
PYTHONUNBUFFERED=1
EOF
    echo ""
    exit 1
fi

# Create deploy directory if it doesn't exist
echo "📁 Setting up deployment directory..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$LOG_DIR"

# Copy application files
echo "📦 Copying application files..."
rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='.pids' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='.env.local' \
    . "$DEPLOY_DIR/"

# Copy .env.production
cp .env.production "$DEPLOY_DIR/.env.production"

# Load environment variables for build
cd "$DEPLOY_DIR"
export $(cat .env.production | grep -v '^#' | xargs)

# Build frontend
echo ""
echo "🏗️  Building frontend..."
cd frontend
sudo -u "$ACTUAL_USER" npm install
sudo -u "$ACTUAL_USER" npm run build

if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

# Setup backend
echo ""
echo "🐍 Setting up backend..."
cd ../backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    sudo -u "$ACTUAL_USER" python3 -m venv .venv
fi

# Install dependencies
echo "   Installing dependencies..."
sudo -u "$ACTUAL_USER" .venv/bin/pip install -r requirements.txt

# Set ownership
echo ""
echo "🔒 Setting permissions..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Install nginx configuration
echo ""
echo "🔧 Installing nginx configuration..."
cp "$DEPLOY_DIR/deploy/nginx/flooded-island.conf" "$NGINX_AVAILABLE"

# Enable nginx site
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
fi

# Test nginx configuration
echo "   Testing nginx configuration..."
nginx -t

# Install systemd service
echo ""
echo "🔧 Installing systemd service..."
cp "$DEPLOY_DIR/deploy/systemd/${SERVICE_NAME}.service" "$SYSTEMD_SERVICE"

# Reload systemd
echo "   Reloading systemd daemon..."
systemctl daemon-reload

# Enable and start service
echo "   Enabling ${SERVICE_NAME} service..."
systemctl enable "$SERVICE_NAME"

echo "   Restarting ${SERVICE_NAME} service..."
systemctl restart "$SERVICE_NAME"

# Reload nginx
echo "   Reloading nginx..."
systemctl reload nginx

# Wait a moment for services to start
sleep 2

# Check service status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
systemctl status "$SERVICE_NAME" --no-pager -l || true

echo ""
echo "🌐 Application URLs:"
echo "   Production: https://island.olegmagn.es"
echo "   API Health: https://island.olegmagn.es/api/health"
echo ""
echo "📝 Logs:"
echo "   Backend: journalctl -u ${SERVICE_NAME} -f"
echo "   Backend files: tail -f ${LOG_DIR}/backend.log"
echo "   Nginx: tail -f /var/log/nginx/access.log"
echo ""
echo "🔧 Service Management:"
echo "   Status:  sudo systemctl status ${SERVICE_NAME}"
echo "   Restart: sudo systemctl restart ${SERVICE_NAME}"
echo "   Stop:    sudo systemctl stop ${SERVICE_NAME}"
echo "   Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""

# Check if SSL is configured
if [ ! -f "/etc/letsencrypt/live/island.olegmagn.es/fullchain.pem" ]; then
    echo "⚠️  SSL Certificate not found!"
    echo ""
    echo "To configure SSL with Let's Encrypt, run:"
    echo "   sudo certbot --nginx -d island.olegmagn.es"
    echo ""
fi
