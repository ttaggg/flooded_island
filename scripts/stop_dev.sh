#!/bin/bash

# Flooded Island - Development Stop Script

set -euo pipefail

log() {
    printf '%s\n' "$1"
}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

PID_DIR="$REPO_ROOT/.pids"
SERVICES=("backend" "frontend")

service_pid_file() {
    printf '%s/%s.pid' "$PID_DIR" "$1"
}

service_log_file() {
    printf '%s/%s.log' "$PID_DIR" "$1"
}

stop_service() {
    local service="$1"
    local pid_file
    pid_file="$(service_pid_file "$service")"

    if [ ! -f "$pid_file" ]; then
        return 0
    fi

    local pid
    pid="$(cat "$pid_file")"

    if ps -p "$pid" > /dev/null 2>&1; then
        log "   Stopping $service (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi

    rm -f "$pid_file"
}

cleanup_logs() {
    for service in "${SERVICES[@]}"; do
        rm -f "$(service_log_file "$service")"
    done

    if [ -d "$PID_DIR" ] && [ -z "$(ls -A "$PID_DIR")" ]; then
        rmdir "$PID_DIR"
    fi
}

check_any_running() {
    for service in "${SERVICES[@]}"; do
        if [ -f "$(service_pid_file "$service")" ]; then
            return 0
        fi
    done
    return 1
}

log "🛑 Stopping Flooded Island development servers..."
log ""

if ! check_any_running; then
    log "ℹ️  No servers appear to be running (no PID files found)"
    exit 0
fi

for service in "${SERVICES[@]}"; do
    stop_service "$service"
done

cleanup_logs

log ""
log "✅ All development servers stopped successfully"
log ""
