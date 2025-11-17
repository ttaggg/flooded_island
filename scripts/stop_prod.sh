#!/bin/bash

# Flooded Island - Production Stop Script

set -e

log() {
    printf '%s\n' "$1"
}

log "🛑 Stopping Flooded Island production services..."
log ""

if [ "$EUID" -ne 0 ]; then
    log "❌ This script must be run with sudo"
    log "Usage: sudo ./scripts/stop_prod.sh"
    exit 1
fi

SERVICE_NAME="flooded-island-backend"
NGINX_ENABLED="/etc/nginx/sites-enabled/flooded-island.conf"

log "   Stopping ${SERVICE_NAME}..."
systemctl stop "$SERVICE_NAME"

if [ -L "$NGINX_ENABLED" ]; then
    log "   Disabling nginx site..."
    rm "$NGINX_ENABLED"
    log "   Reloading nginx..."
    systemctl reload nginx
else
    log "   ⚠️  Nginx site already disabled"
fi

log ""
log "✅ Production services stopped and site disabled."
log ""
log "📊 Backend status:"
systemctl status "$SERVICE_NAME" --no-pager -l || true
log ""
log "ℹ️  To re-enable the site, run: sudo ./scripts/deploy_prod.sh"
log ""
