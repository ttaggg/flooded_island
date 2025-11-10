#!/bin/bash

# Flooded Island - Production Deployment Script
# Deploys application to /var/www/flooded-island with nginx and systemd

set -e

echo "🌊 Deploying Flooded Island to Production..."
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run with sudo"
    echo "Usage: sudo ./scripts/deploy_prod.sh"
    exit 1
fi

# Get the actual user (not root) who invoked sudo
ACTUAL_USER="${SUDO_USER:-$USER}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

# Configuration
DEPLOY_DIR="/var/www/flooded-island"
SERVICE_NAME="flooded-island-backend"
NGINX_AVAILABLE="/etc/nginx/sites-available/flooded-island.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/flooded-island.conf"
SYSTEMD_SERVICE="/etc/systemd/system/${SERVICE_NAME}.service"
LOG_DIR="/var/log/flooded-island"

# Ensure .env.prod exists (should contain production configuration)
ENV_FILE="$REPO_ROOT/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE not found!"
    echo "   Please create .env.prod (copy from your secure template)."
    exit 1
fi

# Stop existing service before replacing files
if systemctl list-units --type=service | grep -q "$SERVICE_NAME"; then
    echo "🛑 Stopping existing $SERVICE_NAME service..."
    systemctl stop "$SERVICE_NAME" || true
fi

# Create deploy directory if it doesn't exist
echo "📁 Setting up deployment directory..."
if [ -d "$DEPLOY_DIR" ]; then
    echo "   Removing previous deployment at $DEPLOY_DIR"
    rm -rf "$DEPLOY_DIR"
fi
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
    --exclude='.env.dev' \
    --exclude='.env.prod' \
    --exclude='.env.local' \
    "$REPO_ROOT/" "$DEPLOY_DIR/"

# Copy env file
cp "$ENV_FILE" "$DEPLOY_DIR/.env.prod"

# Load environment variables for build
cd "$DEPLOY_DIR"
set -a
# shellcheck disable=SC1091
source .env.prod
set +a

echo ""
echo "🔍 Verifying production build artifacts..."
if [ ! -d "$DEPLOY_DIR/frontend/dist" ] || [ ! -f "$DEPLOY_DIR/frontend/dist/index.html" ]; then
    echo "❌ Production assets not found (missing frontend/dist)."
    echo "   Run ./scripts/build_prod.sh before deploying."
    exit 1
fi

# Setup backend
echo ""
echo "🐍 Setting up backend..."
cd "$DEPLOY_DIR/backend"

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
echo "   Production: ${FRONTEND_URL:-https://island.olegmagn.es}"
echo "   API Health: ${FRONTEND_URL:-https://island.olegmagn.es}/health"
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
if [ -n "${DOMAIN:-}" ] && [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "⚠️  SSL Certificate not found!"
    echo ""
    echo "To configure SSL with Let's Encrypt, run:"
    echo "   sudo certbot --nginx -d ${DOMAIN:-your-domain.com}"
    echo ""
fi
