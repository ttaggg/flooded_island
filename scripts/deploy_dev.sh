#!/bin/bash

# Flooded Island - Development Deploy Script
# Builds the stack and starts backend/frontend development servers using .env.dev

set -euo pipefail

log() {
    printf '%s\n' "$1"
}

log_section() {
    printf '\n%s\n\n' "$1"
}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/.env.dev"
if [ ! -f "$ENV_FILE" ]; then
    log "❌ $ENV_FILE not found!"
    log "   Create it from your development template (e.g., .env.dev.example)."
    exit 1
fi

log "🚀 Starting Flooded Island development stack..."
log "📝 Loading environment from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${BACKEND_HOST:=localhost}"
: "${BACKEND_PORT:=8000}"
: "${FRONTEND_HOST:=localhost}"
: "${FRONTEND_PORT:=5173}"

PID_DIR="$REPO_ROOT/.pids"
mkdir -p "$PID_DIR"
SERVICES=("backend" "frontend")

service_pid_file() {
    printf '%s/%s.pid' "$PID_DIR" "$1"
}

service_log_file() {
    printf '%s/%s.log' "$PID_DIR" "$1"
}

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
    local label="${2:-Python project}"
    (
        cd "$dir"
        log "🐍 Preparing $label..."
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name "*.pyc" -delete 2>/dev/null || true
        ensure_uv_installed
        log "   Syncing dependencies with uv..."
        uv sync
    )
    log "✅ $label ready"
}

prepare_node_project() {
    local dir="$1"
    local label="${2:-Frontend}"
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

start_process() {
    local key="$1"
    local label="$2"
    shift 2
    local log_file pid_file
    log_file="$(service_log_file "$key")"
    pid_file="$(service_pid_file "$key")"
    nohup "$@" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$pid_file"
    echo "$pid"
}

cleanup() {
    log_section "⚠️  Interrupted. Cleaning up..."
    for service in "${SERVICES[@]}"; do
        local pid_file
        pid_file="$(service_pid_file "$service")"
        if [ -f "$pid_file" ]; then
            local pid
            pid="$(cat "$pid_file")"
            kill "$pid" 2>/dev/null || true
            rm -f "$pid_file"
            log "   Stopped $service (PID: $pid)"
        fi
    done
    exit 1
}

trap cleanup INT TERM

ensure_no_existing_pids() {
    for service in "${SERVICES[@]}"; do
        local pid_file
        pid_file="$(service_pid_file "$service")"
        if [ -f "$pid_file" ]; then
            log "⚠️  $service appears to be running. Run ./scripts/stop_dev.sh first."
            exit 1
        fi
    done
}

prepare_artifacts() {
    log_section "🔨 Preparing local build artifacts..."
    prepare_python_project "$REPO_ROOT/backend" "backend"
    prepare_node_project "$REPO_ROOT/frontend" "frontend" "true"
}

start_backend() {
    cd "$REPO_ROOT/backend"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    local python_exec
    python_exec="$(pwd)/.venv/bin/python"
    start_process "backend" "Backend" "$python_exec" main.py
    deactivate
    cd "$REPO_ROOT"
}

start_frontend() {
    cd "$REPO_ROOT/frontend"
    if [ ! -d "node_modules" ]; then
        log "   Installing dependencies..."
        npm install
    fi
    start_process "frontend" "Frontend" npm run dev
    cd "$REPO_ROOT"
}

wait_for_services() {
    local backend_pid="$1"
    local frontend_pid="$2"
    log ""
    log "⏳ Waiting for servers to initialize..."
    sleep 3

    if ! ps -p "$backend_pid" > /dev/null; then
        log "❌ Backend failed to start. Check $(service_log_file backend)"
        cleanup
    fi

    if ! ps -p "$frontend_pid" > /dev/null; then
        log "❌ Frontend failed to start. Check $(service_log_file frontend)"
        cleanup
    fi
}

ensure_no_existing_pids
prepare_artifacts

log_section "🚀 Starting development servers..."
backend_pid="$(start_backend)"
log "   ✅ Backend started (PID: $backend_pid)"
log "   📡 API: http://${BACKEND_HOST}:${BACKEND_PORT}"
log "   📚 Docs: http://${BACKEND_HOST}:${BACKEND_PORT}/docs"
log ""
frontend_pid="$(start_frontend)"
log "   ✅ Frontend started (PID: $frontend_pid)"
log "   🌐 App: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
wait_for_services "$backend_pid" "$frontend_pid"

log_section "✅ Both servers are running!"
log "🎮 Open http://${FRONTEND_HOST}:${FRONTEND_PORT} in your browser to play"
log ""
log "📝 Logs:"
log "   Backend: tail -f $(service_log_file backend)"
log "   Frontend: tail -f $(service_log_file frontend)"
log ""
log "🛑 To stop servers: ./scripts/stop_dev.sh"
log ""
