#!/bin/bash

# Flooded Island - Production Deployment Script
# Deploys application to /var/www/flooded-island with nginx and systemd

set -euo pipefail

log() {
    printf '%s\n' "$1"
}

log_section() {
    printf '\n%s\n\n' "$1"
}

log "🌊 Deploying Flooded Island to Production..."

if [ "$EUID" -ne 0 ]; then
    log "❌ This script must be run with sudo"
    log "Usage: sudo ./scripts/deploy_prod.sh"
    exit 1
fi

ACTUAL_USER="${SUDO_USER:-$USER}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

DEPLOY_DIR="/var/www/flooded-island"
SERVICE_NAME="flooded-island-backend"
NGINX_AVAILABLE="/etc/nginx/sites-available/flooded-island.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/flooded-island.conf"
SYSTEMD_SERVICE="/etc/systemd/system/${SERVICE_NAME}.service"
LOG_DIR="/var/log/flooded-island"

ENV_FILE="$REPO_ROOT/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
    log "⚠️  $ENV_FILE not found!"
    log "   Please create .env.prod (copy from your secure template)."
    exit 1
fi

build_source_artifacts() {
    log_section "🔨 Building Flooded Island source tree before deployment..."
    sudo -u "$ACTUAL_USER" REPO_ROOT="$REPO_ROOT" ENV_FILE="$ENV_FILE" bash <<'USER_BUILD'
set -euo pipefail
log() { printf '%s\n' "$1"; }

ensure_uv_installed() {
    if ! command -v uv >/dev/null 2>&1; then
        log "   Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        # Add uv to PATH for current session (try both common install locations)
        export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
        if ! command -v uv >/dev/null 2>&1; then
            log "❌ Failed to install uv. Please install it manually: https://github.com/astral-sh/uv"
            exit 1
        fi
    fi
}

prepare_python_project() {
    local dir="$1"
    local label="${2:-backend}"
    (
        cd "$dir"
        log "🐍 Preparing $label..."
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name "*.pyc" -delete 2>/dev/null || true
        ensure_uv_installed
        # Clean up old venv to prevent python version mismatch issues
        rm -rf .venv
        log "   Syncing dependencies with uv..."
        # Use frozen lockfile but allow system python if needed, though uv prefers its own managed python
        uv sync --frozen
    )
    log "✅ $label ready"
}

prepare_node_project() {
    local dir="$1"
    local label="${2:-frontend}"
    local run_build="${3:-false}"
    (
        cd "$dir"
        log "⚛️  Preparing $label..."
        rm -rf node_modules/.vite node_modules/.cache dist
        log "   Installing dependencies..."
        npm ci
        if [ "$run_build" = "true" ]; then
            log "   Building $label..."
            npm run build
        fi
    )
    log "✅ $label built"
}

cd "$REPO_ROOT"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

prepare_python_project "$REPO_ROOT/backend" "backend"
prepare_node_project "$REPO_ROOT/frontend" "frontend" "true"
log "🎉 Build phase complete!"
USER_BUILD
}

stop_existing_service() {
    if systemctl list-units --type=service | grep -q "$SERVICE_NAME"; then
        log "🛑 Stopping existing $SERVICE_NAME service..."
        systemctl stop "$SERVICE_NAME" || true
    fi
}

sync_source_tree() {
    log_section "📁 Setting up deployment directory..."
    if [ -d "$DEPLOY_DIR" ]; then
        log "   Removing previous deployment at $DEPLOY_DIR"
        rm -rf "$DEPLOY_DIR"
    fi
    mkdir -p "$DEPLOY_DIR" "$LOG_DIR"

    log "📦 Copying application files..."
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

    cp "$ENV_FILE" "$DEPLOY_DIR/.env"
}

load_prod_env() {
    cd "$DEPLOY_DIR"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
}

verify_frontend_artifacts() {
    log_section "🔍 Verifying production build artifacts..."
    if [ ! -d "$DEPLOY_DIR/frontend/dist" ] || [ ! -f "$DEPLOY_DIR/frontend/dist/index.html" ]; then
        log "❌ Production assets not found (missing frontend/dist)."
        log "   Ensure the frontend build completed successfully."
        exit 1
    fi
}

ensure_uv_installed_prod() {
    if ! command -v uv >/dev/null 2>&1; then
        log "   Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        # Add uv to PATH for current session (try both common install locations)
        export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
        if ! command -v uv >/dev/null 2>&1; then
            log "❌ Failed to install uv. Please install it manually: https://github.com/astral-sh/uv"
            exit 1
        fi
    fi
}

setup_backend_virtualenv() {
    log_section "🐍 Setting up backend virtual environment..."
    local backend_dir="$DEPLOY_DIR/backend"

    ensure_uv_installed_prod

    # Configure uv to install python in a shared location readable by www-data
    export UV_PYTHON_INSTALL_DIR="/opt/uv-python"
    mkdir -p "$UV_PYTHON_INSTALL_DIR"

    cd "$backend_dir"
    local venv_path="$backend_dir/.venv"
    if [ -d "$venv_path" ]; then
        log "   Removing previous virtual environment..."
        rm -rf "$venv_path"
    fi

    log "   Syncing backend dependencies with uv..."
    # Use exact same sync command as build phase to ensure consistency
    # This will reuse the cached environment or recreate it identically
    uv sync --frozen --no-cache
    cd "$DEPLOY_DIR"
}

set_permissions() {
    log_section "🔒 Setting permissions..."
    chown -R www-data:www-data "$DEPLOY_DIR"
    chmod -R 755 "$DEPLOY_DIR"
    # Ensure log directory is writable by www-data
    chown -R www-data:www-data "$LOG_DIR"
    chmod -R 755 "$LOG_DIR"
    # Ensure uv python install directory is readable by www-data
    if [ -d "/opt/uv-python" ]; then
        chown -R root:root "/opt/uv-python"
        chmod -R 755 "/opt/uv-python"
    fi
}

configure_nginx() {
    log_section "🔧 Installing nginx configuration..."
    cp "$DEPLOY_DIR/deploy/nginx/flooded-island.conf" "$NGINX_AVAILABLE"
    if [ ! -L "$NGINX_ENABLED" ]; then
        ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    fi
    log "   Testing nginx configuration..."
    nginx -t
}

configure_systemd() {
    log_section "🔧 Installing systemd service..."
    cp "$DEPLOY_DIR/deploy/systemd/${SERVICE_NAME}.service" "$SYSTEMD_SERVICE"
    log "   Reloading systemd daemon..."
    systemctl daemon-reload
    log "   Enabling ${SERVICE_NAME} service..."
    systemctl enable "$SERVICE_NAME"
    log "   Restarting ${SERVICE_NAME} service..."
    systemctl restart "$SERVICE_NAME"
    log "   Reloading nginx..."
    systemctl reload nginx
}

print_summary() {
    sleep 2
    log_section "✅ Deployment complete!"
    log "📊 Service Status:"
    systemctl status "$SERVICE_NAME" --no-pager -l || true
    log ""
    log "🌐 Application URLs:"
    log "   Production: ${FRONTEND_URL:-https://island.olegmagn.es}"
    log "   API Health: ${FRONTEND_URL:-https://island.olegmagn.es}/health"
    log ""
    log "📝 Logs:"
    log "   Backend: journalctl -u ${SERVICE_NAME} -f"
    log "   Backend files: tail -f ${LOG_DIR}/backend.log"
    log "   Nginx: tail -f /var/log/nginx/access.log"
    log ""
    log "🔧 Service Management:"
    log "   Status:  sudo systemctl status ${SERVICE_NAME}"
    log "   Restart: sudo systemctl restart ${SERVICE_NAME}"
    log "   Stop:    sudo systemctl stop ${SERVICE_NAME}"
    log "   Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
    log ""

    if [ -n "${DOMAIN:-}" ] && [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        log "⚠️  SSL Certificate not found!"
        log "   To configure SSL with Let's Encrypt, run:"
        log "   sudo certbot --nginx -d ${DOMAIN}"
        log ""
    fi
}

build_source_artifacts
stop_existing_service
sync_source_tree
load_prod_env
verify_frontend_artifacts
setup_backend_virtualenv
set_permissions
configure_nginx
configure_systemd
print_summary
