# Refactoring Plan - Configuration & Build System

**Created**: 2025-11-09  
**Status**: Ready for Implementation  
**Priority**: HIGH (Critical bug blocking production)

---

## Overview

This document breaks down the refactoring work into discrete, actionable issues that can be tackled one-by-one. Each issue includes:
- Clear description
- Acceptance criteria
- Testing steps
- Dependencies (if any)

---

## Issue #1: [CRITICAL] Fix WebSocket Localhost Connection Bug

**Priority**: CRITICAL  
**Estimated Time**: 15 minutes  
**Dependencies**: None

### Problem
Frontend tries to connect to `localhost` instead of production domain after deployment.

### Root Cause
The production bundle inherited `VITE_BACKEND_URL=http://localhost:8000` from the legacy `.env`. When the site is served from `island.olegmagn.es`, the frontend obeys that override and connects back to localhost instead of the public domain.

### Changes Required
1. Provide environment templates (`.env.dev`, `.env_prod.example`) while keeping the active configuration in `.env` after copying the appropriate template.
2. Update `frontend/src/utils/websocket.ts` to trust the configured `VITE_BACKEND_URL` when present.
3. Rebuild frontend
4. Redeploy to production

### Acceptance Criteria
- [ ] Environment templates exist, and the workflow documents copying the desired file to `.env` before running scripts.
- [ ] `getBackendUrl()` uses `VITE_BACKEND_URL` when defined
- [ ] Frontend builds without errors
- [ ] Production site connects to `wss://island.olegmagn.es/ws/...` (not localhost)
- [ ] "Create Game" button creates room and connects successfully

### Testing
1. Deploy to production
2. Access `https://island.olegmagn.es`
3. Click "Create Game"
4. Open browser DevTools Network tab
5. Verify WebSocket connection URL contains `island.olegmagn.es` (not `localhost`)

---

## Issue #2: Add Backend Health Check Endpoint

**Priority**: HIGH  
**Estimated Time**: 20 minutes  
**Dependencies**: None

### Problem
No way to programmatically check if backend is running correctly.

### Changes Required
1. Add `/health` endpoint to `backend/main.py`
2. Return JSON with status and timestamp
3. Test endpoint locally and in production

### Implementation
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "flooded-island-backend"
    }
```

### Acceptance Criteria
- [ ] `/health` endpoint responds with 200 status
- [ ] Response includes `status`, `timestamp`, and `service` fields
- [ ] Endpoint works without authentication
- [ ] Endpoint accessible in both dev and prod

### Testing
- Dev: `curl http://localhost:8000/health`
- Prod: `curl https://island.olegmagn.es/health`

---

## Issue #3: Update .gitignore for Build Artifacts

**Priority**: HIGH  
**Estimated Time**: 10 minutes  
**Dependencies**: None

### Problem
- `frontend/dist/` is tracked in git (build artifact)
- Root `node_modules/` is tracked in git
- `.env.production` should be protected but `.env.development` should be tracked

### Changes Required
1. Update `.gitignore` to ignore build artifacts
2. Remove tracked files from git
3. Commit updated `.gitignore`

### .gitignore Updates
```
# Environment files (production only)
.env.production
.env.production.local
.env.local
.env.*.local

# Keep development template
# .env.development - tracked as template

# Build artifacts
frontend/dist/
frontend/node_modules/
backend/__pycache__/
backend/**/__pycache__/
backend/.venv/
backend/venv/

# Root node_modules (if any)
node_modules/

# Cache
.cache/
.npm/
.vite/
*.pyc
__pycache__/
```

### Acceptance Criteria
- [ ] `.gitignore` updated with all necessary entries
- [ ] `frontend/dist/` removed from git tracking
- [ ] Root `node_modules/` removed from git tracking
- [ ] `.env.production` protected (not tracked)
- [ ] `.env.development` still tracked (template)
- [ ] Changes committed

### Commands
```bash
# Remove from git but keep locally
git rm -r --cached frontend/dist
git rm -r --cached node_modules
git add .gitignore
git commit -m "chore: update .gitignore for build artifacts"
```

---

## Issue #4: Create Environment Configuration Files

**Priority**: HIGH  
**Estimated Time**: 30 minutes  
**Dependencies**: Issue #3 (gitignore)

### Problem
Configuration is hardcoded in multiple places instead of centralized in env files.

### Changes Required
1. Create `.env.development` with development defaults
2. Create `.env.production` with production configuration
3. Create `.env.production.example` as template
4. Verify `.gitignore` protects `.env.production`

### File: `.env.development`
```bash
# Development Environment Configuration
NODE_ENV=development

# Backend Configuration
BACKEND_PORT=8000
HOST=localhost
PYTHONUNBUFFERED=1

# Frontend Configuration (used by Vite during build)
VITE_BACKEND_URL=http://localhost:8000
VITE_APP_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### File: `.env.production`
```bash
# Production Environment Configuration
NODE_ENV=production

# Domain Configuration - SINGLE SOURCE OF TRUTH
DOMAIN=island.olegmagn.es
PROTOCOL=https

# Backend Configuration
BACKEND_PORT=8000
HOST=0.0.0.0
PYTHONUNBUFFERED=1

# Frontend Configuration (used by Vite during build)
VITE_BACKEND_URL=https://island.olegmagn.es
VITE_APP_ENV=production

# CORS Configuration
FRONTEND_URL=https://island.olegmagn.es

# Deployment Configuration
DEPLOY_DIR=/var/www/flooded-island
SERVICE_NAME=flooded-island-backend
LOG_DIR=/var/log/flooded-island
```

### File: `.env.production.example`
```bash
# Production Environment Configuration Template
# Copy this to .env.production and fill in your values
NODE_ENV=production

# Domain Configuration - SINGLE SOURCE OF TRUTH
DOMAIN=your-domain.com
PROTOCOL=https

# Backend Configuration
BACKEND_PORT=8000
HOST=0.0.0.0
PYTHONUNBUFFERED=1

# Frontend Configuration (used by Vite during build)
VITE_BACKEND_URL=https://your-domain.com
VITE_APP_ENV=production

# CORS Configuration
FRONTEND_URL=https://your-domain.com

# Deployment Configuration
DEPLOY_DIR=/var/www/flooded-island
SERVICE_NAME=flooded-island-backend
LOG_DIR=/var/log/flooded-island
```

### Acceptance Criteria
- [ ] `.env.development` created and committed to git
- [ ] `.env.production` created locally (NOT committed)
- [ ] `.env.production.example` created and committed to git
- [ ] `.env.production` exists on server at `/var/www/flooded-island/.env.production`
- [ ] All required variables defined in each file
- [ ] Git status shows `.env.production` not tracked

---

## Issue #5: Create build_dev.sh Script

**Priority**: MEDIUM  
**Estimated Time**: 45 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Need dedicated development build script that uses `.env.development`.

### Changes Required
1. Create `build_dev.sh` in repo root
2. Load environment from `.env.development`
3. Set up backend virtual environment
4. Install backend dependencies
5. Install frontend dependencies
6. Build frontend
7. Clear caches before building

### Implementation: `build_dev.sh`
```bash
#!/bin/bash
# Development build script - uses .env.development

set -euo pipefail

echo "🔨 Building for DEVELOPMENT..."

# Check .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ .env.development not found!"
    exit 1
fi

# Load environment variables
export $(cat .env.development | grep -v '^#' | xargs)

echo "📋 Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   Backend URL: $VITE_BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo ""

# Backend setup
echo "🐍 Setting up backend..."
cd backend

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
echo "   Installing dependencies..."
pip install -q -r requirements.txt

cd ..
echo "✅ Backend ready"
echo ""

# Frontend setup
echo "⚛️  Setting up frontend..."
cd frontend

# Clear npm cache
echo "   Clearing cache..."
rm -rf node_modules/.vite
rm -rf dist

# Install dependencies
echo "   Installing dependencies..."
npm install

# Build
echo "   Building frontend..."
npm run build

cd ..
echo "✅ Frontend built"
echo ""

echo "🎉 Development build complete!"
echo ""
echo "Next steps:"
echo "   ./start_dev.sh    # Start development servers"
```

### Acceptance Criteria
- [ ] Script created and executable (`chmod +x build_dev.sh`)
- [ ] Script loads `.env.development`
- [ ] Script clears Python cache (`__pycache__`, `*.pyc`)
- [ ] Script clears npm cache (`node_modules/.vite`)
- [ ] Script clears dist directory
- [ ] Script sets up backend venv
- [ ] Script installs backend dependencies
- [ ] Script installs frontend dependencies
- [ ] Script builds frontend
- [ ] Script displays configuration summary
- [ ] Script exits with error code if `.env.development` missing

### Testing
```bash
./build_dev.sh
# Should complete without errors
# Check frontend/dist/ exists
# Check backend/venv/ exists
```

---

## Issue #6: Create build_prod.sh Script

**Priority**: MEDIUM  
**Estimated Time**: 45 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Need dedicated production build script that uses `.env.production`.

### Changes Required
1. Create `build_prod.sh` in repo root
2. Load environment from `.env.production`
3. Set up backend virtual environment
4. Install backend dependencies
5. Install frontend dependencies
6. Build frontend with production env vars
7. Clear caches before building

### Implementation: `build_prod.sh`
```bash
#!/bin/bash
# Production build script - uses .env.production

set -euo pipefail

echo "🔨 Building for PRODUCTION..."

# Check .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "   Create it from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   Domain: $DOMAIN"
echo "   Backend URL: $VITE_BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo ""

# Backend setup
echo "🐍 Setting up backend..."
cd backend

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
echo "   Installing dependencies..."
pip install -q -r requirements.txt

cd ..
echo "✅ Backend ready"
echo ""

# Frontend setup
echo "⚛️  Setting up frontend..."
cd frontend

# Clear npm cache and dist
echo "   Clearing cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# Install dependencies
echo "   Installing dependencies..."
npm install

# Build with production env
echo "   Building frontend..."
npm run build

cd ..
echo "✅ Frontend built"
echo ""

echo "🎉 Production build complete!"
echo "   Backend URL: $VITE_BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo ""
```

### Acceptance Criteria
- [ ] Script created and executable (`chmod +x build_prod.sh`)
- [ ] Script loads `.env.production`
- [ ] Script clears Python cache
- [ ] Script clears npm cache and `.cache` directory
- [ ] Script clears dist directory
- [ ] Script sets up backend venv
- [ ] Script installs backend dependencies
- [ ] Script installs frontend dependencies
- [ ] Script builds frontend with production env vars
- [ ] Script displays configuration summary
- [ ] Script exits with error code if `.env.production` missing

### Testing
```bash
./build_prod.sh
# Should complete without errors
# Check frontend/dist/ contains production build
# Verify dist/index.html references production URLs
```

---

## Issue #7: Rename and Update Development Scripts

**Priority**: MEDIUM  
**Estimated Time**: 30 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Current scripts (`start.sh`, `stop.sh`) don't follow naming convention and don't load env files.

### Changes Required
1. Rename `start.sh` → `start_dev.sh`
2. Rename `stop.sh` → `stop_dev.sh`
3. Update `start_dev.sh` to load `.env.development`
4. Update scripts to use env variables for ports/hosts

### Update `start_dev.sh`
Add at the beginning (after shebang and before any other commands):
```bash
# Load development environment
if [ -f .env.development ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
    echo "📋 Loaded .env.development"
    echo "   Backend: http://${HOST}:${BACKEND_PORT}"
    echo "   Frontend: ${FRONTEND_URL}"
    echo ""
else
    echo "⚠️  .env.development not found, using defaults"
fi
```

### Update `stop_dev.sh`
- No changes needed, just rename

### Acceptance Criteria
- [ ] `start.sh` renamed to `start_dev.sh`
- [ ] `stop.sh` renamed to `stop_dev.sh`
- [ ] `start_dev.sh` loads `.env.development`
- [ ] `start_dev.sh` displays configuration
- [ ] Scripts use env variables (`$BACKEND_PORT`, `$HOST`, etc.)
- [ ] Scripts remain executable

### Testing
```bash
./start_dev.sh
# Should start both servers with correct ports
# Should display configuration from .env.development

./stop_dev.sh
# Should stop both servers
```

---

## Issue #8: Create Nginx Configuration Template

**Priority**: MEDIUM  
**Estimated Time**: 45 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Nginx config has hardcoded domain references. Need template with variables.

### Changes Required
1. Create `deploy/nginx/flooded-island.conf.template`
2. Replace hardcoded domain with `${DOMAIN}` variable
3. Keep existing config structure

### Implementation: `deploy/nginx/flooded-island.conf.template`
```nginx
# Flooded Island - Nginx Configuration Template
# Generated from template using .env.production

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # ACME challenge for SSL certificate
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Frontend - Serve static files
    location / {
        root /var/www/flooded-island/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Proxy to FastAPI
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/flooded-island-access.log;
    error_log /var/log/nginx/flooded-island-error.log;
}
```

### Acceptance Criteria
- [ ] Template file created at `deploy/nginx/flooded-island.conf.template`
- [ ] All instances of hardcoded domain replaced with `${DOMAIN}`
- [ ] `/health` endpoint configured
- [ ] WebSocket configuration preserved
- [ ] SSL configuration preserved
- [ ] Static file caching preserved
- [ ] Security headers preserved

### Testing
Test template generation:
```bash
export DOMAIN=island.olegmagn.es
envsubst '${DOMAIN}' < deploy/nginx/flooded-island.conf.template
# Should output valid nginx config with actual domain
```

---

## Issue #9: Create Systemd Service Template

**Priority**: MEDIUM  
**Estimated Time**: 30 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Systemd service has hardcoded paths. Need template with variables.

### Changes Required
1. Create `deploy/systemd/flooded-island-backend.service.template`
2. Replace hardcoded paths with variables
3. Add EnvironmentFile directive

### Implementation: `deploy/systemd/flooded-island-backend.service.template`
```ini
[Unit]
Description=Flooded Island Backend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${DEPLOY_DIR}/backend

# Load environment variables from .env.production
EnvironmentFile=${DEPLOY_DIR}/.env.production

# Use virtual environment Python
ExecStart=${DEPLOY_DIR}/backend/venv/bin/python main.py

# Restart policy
Restart=always
RestartSec=10

# Logging
StandardOutput=append:${LOG_DIR}/backend.log
StandardError=append:${LOG_DIR}/backend-error.log

[Install]
WantedBy=multi-user.target
```

### Acceptance Criteria
- [ ] Template file created at `deploy/systemd/flooded-island-backend.service.template`
- [ ] Hardcoded paths replaced with `${DEPLOY_DIR}` and `${LOG_DIR}`
- [ ] `EnvironmentFile` directive points to `.env.production`
- [ ] Service uses venv Python
- [ ] Logging configured
- [ ] Restart policy configured

### Testing
Test template generation:
```bash
export DEPLOY_DIR=/var/www/flooded-island
export LOG_DIR=/var/log/flooded-island
envsubst '${DEPLOY_DIR},${LOG_DIR}' < deploy/systemd/flooded-island-backend.service.template
# Should output valid systemd service file
```

---

## Issue #10: Update Backend Configuration Loading

**Priority**: HIGH  
**Estimated Time**: 30 minutes  
**Dependencies**: Issue #4 (env files)

### Problem
Backend doesn't load configuration from environment files properly.

### Changes Required
1. Update `backend/main.py` to detect and load correct env file
2. Update CORS configuration to use env variables
3. Update port/host configuration to use env variables
4. Ensure backend works in both dev and prod

### Implementation Changes to `backend/main.py`

Add after imports:
```python
from pathlib import Path
from dotenv import load_dotenv
import os
from datetime import datetime

# Determine which environment file to load
# Priority: .env.production → .env.development → none
env_file = None
project_root = Path(__file__).parent.parent

prod_env = project_root / ".env.production"
dev_env = project_root / ".env.development"

if prod_env.exists():
    env_file = prod_env
    print(f"Loading production environment from {prod_env}")
elif dev_env.exists():
    env_file = dev_env
    print(f"Loading development environment from {dev_env}")
else:
    print("No environment file found, using defaults")

if env_file:
    load_dotenv(env_file)

# Get configuration from environment
NODE_ENV = os.getenv("NODE_ENV", "development")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
backend_port = int(os.getenv("BACKEND_PORT", 8000))
backend_host = os.getenv("HOST", "0.0.0.0")

print(f"Configuration:")
print(f"  Environment: {NODE_ENV}")
print(f"  Backend: http://{backend_host}:{backend_port}")
print(f"  Frontend: {frontend_url}")
```

Update CORS configuration:
```python
# Configure CORS - allow configured frontend URL
allowed_origins = [frontend_url]

# In development, also allow localhost variations
if NODE_ENV == "development":
    allowed_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])
    print(f"  CORS: Development mode - allowing multiple origins")
else:
    print(f"  CORS: Production mode - allowing only {frontend_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Update uvicorn configuration (at end of file):
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=backend_host,
        port=backend_port,
    )
```

Add health check endpoint (after app creation):
```python
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "flooded-island-backend",
        "environment": NODE_ENV,
    }
```

### Acceptance Criteria
- [ ] Backend loads `.env.production` if it exists
- [ ] Backend falls back to `.env.development` if `.env.production` doesn't exist
- [ ] Backend prints configuration on startup
- [ ] CORS allows only configured origins in production
- [ ] CORS allows multiple localhost origins in development
- [ ] Port and host read from environment variables
- [ ] `/health` endpoint implemented and functional
- [ ] Backend works in both dev and prod environments

### Testing
Development:
```bash
cd backend
source venv/bin/activate
python main.py
# Should load .env.development
# Should allow CORS from localhost:5173
# curl http://localhost:8000/health should work
```

Production (on server):
```bash
# Should load .env.production
# Should allow CORS only from island.olegmagn.es
# curl https://island.olegmagn.es/health should work
```

---

## Issue #11: Create deploy_prod.sh Script

**Priority**: HIGH  
**Estimated Time**: 2 hours  
**Dependencies**: Issues #4, #8, #9, #10

### Problem
Need comprehensive production deployment script that uses templates and env files.

### Changes Required
1. Create `deploy_prod.sh` (or update existing `deploy.sh`)
2. Load all configuration from `.env.production`
3. Generate nginx config from template
4. Generate systemd service from template
5. Build application on server
6. Install configurations
7. Restart services
8. Run smoke tests

### Implementation: `deploy_prod.sh`
```bash
#!/bin/bash
# Production Deployment Script
# Deploys to server using configuration from .env.production

set -e

echo "🚀 Flooded Island - Production Deployment"
echo "=========================================="
echo ""

# Check we're running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# Check .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "   Create it from .env.production.example"
    exit 1
fi

# Load environment variables
echo "📋 Loading configuration from .env.production..."
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required variables
required_vars=("DOMAIN" "DEPLOY_DIR" "SERVICE_NAME" "LOG_DIR")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required variable $var is not set in .env.production"
        exit 1
    fi
done

echo "   Domain: $DOMAIN"
echo "   Deploy directory: $DEPLOY_DIR"
echo "   Service name: $SERVICE_NAME"
echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$LOG_DIR"
chown -R www-data:www-data "$LOG_DIR"

# Sync application files
echo "📦 Syncing application files..."
rsync -av --delete \
    --exclude='.git/' \
    --exclude='backend/venv/' \
    --exclude='backend/__pycache__/' \
    --exclude='frontend/node_modules/' \
    --exclude='frontend/dist/' \
    --exclude='.env.development' \
    --exclude='node_modules/' \
    ./ "$DEPLOY_DIR/"

# Copy .env.production to deployment directory
echo "🔐 Copying .env.production..."
cp .env.production "$DEPLOY_DIR/.env.production"
chown www-data:www-data "$DEPLOY_DIR/.env.production"
chmod 600 "$DEPLOY_DIR/.env.production"

# Build application
echo "🔨 Building application..."
cd "$DEPLOY_DIR"

# Build using build_prod.sh
if [ -f build_prod.sh ]; then
    chmod +x build_prod.sh
    ./build_prod.sh
else
    echo "❌ build_prod.sh not found!"
    exit 1
fi

# Generate nginx configuration from template
echo "🌐 Generating nginx configuration..."
NGINX_AVAILABLE="/etc/nginx/sites-available/flooded-island"
NGINX_ENABLED="/etc/nginx/sites-enabled/flooded-island"

if [ -f "$DEPLOY_DIR/deploy/nginx/flooded-island.conf.template" ]; then
    envsubst '${DOMAIN}' < "$DEPLOY_DIR/deploy/nginx/flooded-island.conf.template" > "$NGINX_AVAILABLE"
    echo "   Generated: $NGINX_AVAILABLE"
else
    echo "❌ Nginx template not found!"
    exit 1
fi

# Test nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Enable nginx site
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    echo "   Enabled nginx site"
fi

# Generate systemd service from template
echo "⚙️  Generating systemd service..."
SYSTEMD_SERVICE="/etc/systemd/system/$SERVICE_NAME.service"

if [ -f "$DEPLOY_DIR/deploy/systemd/flooded-island-backend.service.template" ]; then
    envsubst '${DEPLOY_DIR},${LOG_DIR}' < "$DEPLOY_DIR/deploy/systemd/flooded-island-backend.service.template" > "$SYSTEMD_SERVICE"
    echo "   Generated: $SYSTEMD_SERVICE"
else
    echo "❌ Systemd service template not found!"
    exit 1
fi

# Set correct ownership
echo "🔒 Setting permissions..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Reload systemd
echo "♻️  Reloading systemd..."
systemctl daemon-reload

# Enable and restart backend service
echo "🔄 Restarting backend service..."
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# Give service a moment to start
sleep 2

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "   ✅ Backend service is running"
else
    echo "   ❌ Backend service failed to start!"
    echo "   Logs:"
    systemctl status "$SERVICE_NAME" --no-pager -l
    exit 1
fi

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx failed!"
    systemctl status nginx --no-pager -l
    exit 1
fi

# Run smoke tests
echo ""
echo "🧪 Running smoke tests..."

# Test 1: Backend health check
echo "   Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend health check passed"
else
    echo "   ❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Test 2: Frontend accessible
echo "   Testing frontend (HTTP)..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend HTTP accessible (redirect or OK)"
else
    echo "   ⚠️  Frontend HTTP returned $HTTP_RESPONSE"
fi

# Test 3: HTTPS accessible
echo "   Testing frontend (HTTPS)..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend HTTPS accessible"
else
    echo "   ⚠️  Frontend HTTPS returned $HTTPS_RESPONSE"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -n 5
echo ""
echo "🔗 URLs:"
echo "   Frontend: https://$DOMAIN"
echo "   Health:   https://$DOMAIN/health"
echo ""
echo "📝 Logs:"
echo "   Backend:       $LOG_DIR/backend.log"
echo "   Backend Error: $LOG_DIR/backend-error.log"
echo "   Nginx Access:  /var/log/nginx/flooded-island-access.log"
echo "   Nginx Error:   /var/log/nginx/flooded-island-error.log"
echo ""
echo "🛠️  Management:"
echo "   Status:  systemctl status $SERVICE_NAME"
echo "   Restart: systemctl restart $SERVICE_NAME"
echo "   Logs:    journalctl -u $SERVICE_NAME -f"
echo ""
```

### Acceptance Criteria
- [ ] Script requires root/sudo
- [ ] Script validates `.env.production` exists
- [ ] Script validates required environment variables
- [ ] Script creates necessary directories
- [ ] Script syncs files with proper exclusions
- [ ] Script copies `.env.production` to deployment directory
- [ ] Script builds application using `build_prod.sh`
- [ ] Script generates nginx config from template
- [ ] Script tests nginx configuration
- [ ] Script generates systemd service from template
- [ ] Script sets correct permissions
- [ ] Script reloads systemd
- [ ] Script restarts backend service
- [ ] Script reloads nginx
- [ ] Script runs smoke tests (health check, HTTP, HTTPS)
- [ ] Script displays service status
- [ ] Script displays helpful URLs and commands
- [ ] Script exits with error if any critical step fails

### Testing
```bash
# On server
sudo ./deploy_prod.sh

# Should complete without errors
# Should display all green checkmarks for smoke tests
# Should show service running
# Visit https://island.olegmagn.es
# Click "Create Game" - should connect via WebSocket
```

---

## Issue #12: Remove Old Build Script

**Priority**: LOW  
**Estimated Time**: 5 minutes  
**Dependencies**: Issues #5, #6, #11 (after new scripts proven)

### Problem
Old `build.sh` is obsolete, replaced by `build_dev.sh` and `build_prod.sh`.

### Changes Required
1. Verify new build scripts work
2. Delete `build.sh`
3. Update any documentation referencing `build.sh`

### Acceptance Criteria
- [ ] `build_dev.sh` tested and working
- [ ] `build_prod.sh` tested and working
- [ ] `build.sh` deleted
- [ ] No broken references in documentation

### Testing
```bash
# Verify new scripts work
./build_dev.sh
./build_prod.sh

# Delete old script
rm build.sh

# Check for references
grep -r "build.sh" docs/ README.md || echo "No references found"
```

---

## Issue #13: Remove/Rename Old Deploy Script

**Priority**: LOW  
**Estimated Time**: 5 minutes  
**Dependencies**: Issue #11 (after new script proven)

### Problem
Old `deploy.sh` is obsolete, replaced by `deploy_prod.sh`.

### Changes Required
1. Verify `deploy_prod.sh` works
2. Either delete `deploy.sh` or rename it to `deploy_prod.sh`
3. Update any documentation referencing `deploy.sh`

### Acceptance Criteria
- [ ] `deploy_prod.sh` tested and working in production
- [ ] Old `deploy.sh` removed
- [ ] No broken references in documentation

### Testing
```bash
# After successful production deployment with deploy_prod.sh
rm deploy.sh

# Check for references
grep -r "deploy.sh" docs/ README.md || echo "No references found"
```

---

## Issue #14: Update Documentation

**Priority**: MEDIUM  
**Estimated Time**: 1 hour  
**Dependencies**: All previous issues

### Problem
Documentation needs to reflect new build/deployment system.

### Changes Required
1. Update `README.md` with new script names
2. Update `deploy/README.md` with new deployment process
3. Update `docs/current_task.md` to reflect completion
4. Update `docs/progress.md` with refactoring work

### Files to Update

#### `README.md`
- Update "Development" section with `build_dev.sh` and `deploy_dev.sh`
- Update "Deployment" section with `build_prod.sh` and `deploy_prod.sh`
- Add "Configuration" section explaining env files
- Update script references

#### `deploy/README.md`
- Update deployment steps
- Document `.env.production` setup
- Document template system
- Document smoke tests

#### `docs/current_task.md`
- Update to reflect refactoring completion
- List any remaining tasks

#### `docs/progress.md`
- Add entry for refactoring work
- Document changes made
- Note bug fixes

### Acceptance Criteria
- [ ] All script references updated
- [ ] Configuration system documented
- [ ] Deployment process documented
- [ ] Environment files explained
- [ ] No references to old scripts
- [ ] Examples updated


---

## Testing Checklist (After All Issues Complete)

### Development Workflow
- [ ] Clone fresh repo
- [ ] Create `.env.development` (or use committed one)
- [ ] Run `./build_dev.sh` - completes without errors
- [ ] Run `./start_dev.sh` - both servers start
- [ ] Visit `http://localhost:5173` - app loads
- [ ] Create game - WebSocket connects to localhost:8000
- [ ] Play game - works correctly
- [ ] Run `./stop_dev.sh` - servers stop

### Production Build Workflow
- [ ] Create `.env.production` from example
- [ ] Run `./build_prod.sh` - completes without errors
- [ ] Check `frontend/dist/` exists
- [ ] Check `backend/venv/` exists
- [ ] Verify dist files reference production URLs

### Production Deployment Workflow
- [ ] SSH to server
- [ ] Clone/pull latest code
- [ ] Create `.env.production` on server
- [ ] Run `sudo ./deploy_prod.sh` - completes without errors
- [ ] All smoke tests pass (green checkmarks)
- [ ] Visit `https://island.olegmagn.es` - app loads
- [ ] Create game - WebSocket connects to `wss://island.olegmagn.es`
- [ ] Play game - works correctly
- [ ] Check `/health` endpoint - returns 200
- [ ] Check logs - no errors

### Domain Change Test
- [ ] Update `DOMAIN` in `.env.production`
- [ ] Run `sudo ./deploy_prod.sh`
- [ ] Nginx config has new domain
- [ ] SSL paths have new domain
- [ ] Frontend connects to new domain

### Configuration Test
- [ ] No hardcoded domains in scripts
- [ ] No hardcoded domains in configs (only templates)
- [ ] No hardcoded URLs in code
- [ ] All config comes from env files

---

## Summary

**Total Issues**: 15  
**Critical**: 2 (Issues #1, #10)  
**High**: 3 (Issues #2, #3, #4, #11)  
**Medium**: 7 (Issues #5, #6, #7, #8, #9, #14, #15)  
**Low**: 3 (Issues #12, #13, #15)

**Estimated Total Time**: 10-12 hours

**Recommended Order**:
1. Issue #1 (Critical WebSocket bug) - IMMEDIATE
2. Issue #2 (Health check) - Quick win
3. Issue #3 (Gitignore) - Foundation
4. Issue #4 (Env files) - Foundation
5. Issue #10 (Backend config) - Core functionality
6. Issue #5 (build_dev.sh) - Dev workflow
7. Issue #6 (build_prod.sh) - Prod workflow
8. Issue #7 (Rename scripts) - Dev workflow
9. Issue #8 (Nginx template) - Prod deployment
10. Issue #9 (Systemd template) - Prod deployment
11. Issue #11 (deploy_prod.sh) - Prod deployment
12. Test deployment thoroughly
13. Issues #12, #13 (Cleanup) - After verification
14. Issue #14 (Documentation) - Before finishing

---

**Last Updated**: 2025-11-09
