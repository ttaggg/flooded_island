#!/bin/bash

# Flooded Island - Production Stop Script

set -e

echo "🛑 Stopping Flooded Island production services..."
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run with sudo"
    echo "Usage: sudo ./scripts/stop_prod.sh"
    exit 1
fi

SERVICE_NAME="flooded-island-backend"

echo "   Stopping ${SERVICE_NAME}..."
systemctl stop "$SERVICE_NAME"

echo "   Reloading nginx..."
systemctl reload nginx || echo "   ⚠️  Failed to reload nginx (check logs)."

echo ""
echo "✅ Production services stopped."
echo ""
echo "📊 Current status:"
systemctl status "$SERVICE_NAME" --no-pager -l || true
echo ""
