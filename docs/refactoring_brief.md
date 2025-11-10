# Configuration & Build System Refactoring Brief

## Executive Summary

The project currently has three critical issues preventing proper production deployment:
1. **WebSocket Connection Bug**: Frontend tries to connect to `localhost` instead of production domain
2. **Poor Dev/Prod Separation**: Build and deployment scripts are not cleanly separated by environment
3. **Configuration Duplication**: Domain and URLs are hardcoded in multiple places instead of being centralized in env files

## Problem Analysis

### Issue 1: WebSocket Localhost Connection Bug

**Symptom**: After deployment, clicking "Create Game" shows error:
```
Connection failed.
Trying to connect to: ws://localhost:8000/ws/EFEQ5V
```

**Root Cause**: Bug in `frontend/src/utils/websocket.ts` line 76:
```typescript
const port = window.location.port;
`${protocol}//${hostname}${port ? `:${port}` : ''}`;  // ❌ Missing return statement!
```

**Impact**: Function returns `undefined`, causing fallback to localhost.

**Current Code Location**: `frontend/src/utils/websocket.ts:75-76`

---

### Issue 2: Poor Dev/Prod Separation

**Current State**:
- `build.sh` - Tries to handle both dev and prod (checks for `.env.production`)
- `deploy.sh` - Production deployment only
- `start.sh` - Development server startup
- `stop.sh` - Development server shutdown

**Problems**:
- No clear naming convention
- `build.sh` conflates dev/prod concerns
- Different scripts for different purposes (build vs deploy vs start)
- Hard to understand which script to use for which environment

**Desired State**:
- `scripts/build_dev.sh` - Build for development
- `scripts/build_prod.sh` - Build for production
- `scripts/deploy_dev.sh` - Deploy/start development stack
- `scripts/deploy_prod.sh` - Deploy to production server
- `scripts/stop_dev.sh` - Stop development servers

---

### Issue 3: Configuration Duplication

**Domain Configuration Currently Scattered Across**:

1. **deploy.sh** (lines 42-44, 157, 173, 177):
   ```bash
   FRONTEND_URL=https://island.olegmagn.es
   VITE_BACKEND_URL=https://island.olegmagn.es
   VITE_WS_URL=wss://island.olegmagn.es
   DOMAIN=island.olegmagn.es
   # ... and hardcoded in echo statements
   ```

2. **nginx config** (lines 8, 25, 29, 30):
   ```nginx
   server_name island.olegmagn.es;
   ssl_certificate /etc/letsencrypt/live/island.olegmagn.es/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/island.olegmagn.es/privkey.pem;
   ```

3. **Backend main.py** (line 25):
   ```python
   frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
   ```

**Problems**:
- Domain changes require editing multiple files
- Easy to miss locations during updates
- Different default values in different places
- No single source of truth

**Desired State**:
- All environment-specific configuration in `.env.development` and `.env.production`
- Scripts read from env files
- Nginx config generated from template using env variables
- Backend reads all config from env

---

## Solution: Step-by-Step Implementation Plan

### Phase 1: Fix Critical WebSocket Bug (Immediate)

**Urgency**: HIGH - Blocks production usage

**Steps**:
1. Fix `frontend/src/utils/websocket.ts` line 76:
   ```typescript
   const port = window.location.port;
   return `${protocol}//${hostname}${port ? `:${port}` : ''}`;  // ✅ Add return
   ```

2. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Redeploy to production:
   ```bash
   sudo ./deploy.sh
   ```

**Testing**:
- Access production site: `https://island.olegmagn.es`
- Click "Create Game"
- Verify WebSocket connects to `wss://island.olegmagn.es/ws/...` (not localhost)

---

### Phase 2: Create Environment Configuration Files

**Create `.env.development`**:
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

**Create `.env.production`** (if not exists, or update):
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
# These are derived from DOMAIN
VITE_BACKEND_URL=https://island.olegmagn.es
VITE_APP_ENV=production

# CORS Configuration
FRONTEND_URL=https://island.olegmagn.es

# Deployment Configuration
DEPLOY_DIR=/var/www/flooded-island
SERVICE_NAME=flooded-island-backend
LOG_DIR=/var/log/flooded-island
```

**Update `.gitignore`**:
```
.env
.env.local
.env.development.local
.env.production
.env.production.local
```

**Keep in git** (as templates):
- `.env.development` - Development template (safe defaults)
- `.env.production.example` - Production template (with placeholder values)

---

### Phase 3: Refactor Build Scripts

#### Create `build_dev.sh`:
```bash
#!/bin/bash
# Development build - uses .env.development

set -euo pipefail

echo "🔨 Building for DEVELOPMENT..."
export $(cat .env.development | grep -v '^#' | xargs)

# Backend setup
cd backend
if [ ! -d ".venv" ]; then
    uv venv
fi
source .venv/bin/activate
uv pip install -r requirements.txt
cd ..

# Frontend setup  
cd frontend
npm install
npm run build
cd ..

echo "✅ Development build complete!"
```

#### Create `build_prod.sh`:
```bash
#!/bin/bash
# Production build - uses .env.production

set -euo pipefail

if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

echo "🔨 Building for PRODUCTION..."
export $(cat .env.production | grep -v '^#' | xargs)

# Backend setup
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
cd frontend
npm install
npm run build
cd ..

echo "✅ Production build complete!"
echo "   Backend URL: $VITE_BACKEND_URL"
```

#### Rename existing scripts:
```bash
mv start.sh start_dev.sh
mv stop.sh stop_dev.sh
```

#### Update `start_dev.sh`:
- Add at top: `export $(cat .env.development | grep -v '^#' | xargs)`
- Ensure it uses development configuration

#### Create `deploy_prod.sh` (rename/update current `deploy.sh`):
- Assume the production build (`frontend/dist`) is generated ahead of time via `scripts/build_prod.sh`; the deployment step should simply validate its presence and sync it to `/var/www/flooded-island`.
- Reads all configuration from `.env.production`
- Generates nginx config from template
- No hardcoded values

---

### Phase 4: Create Nginx Configuration Template

**Create `deploy/nginx/flooded-island.conf.template`**:

```nginx
# Flooded Island - Nginx Configuration
# Generated from template using .env.production

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

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

    # ... rest of config (unchanged except for ${DOMAIN} substitutions)
}
```

**Update `deploy_prod.sh` to generate config**:
```bash
# Generate nginx config from template
envsubst '${DOMAIN}' < "$DEPLOY_DIR/deploy/nginx/flooded-island.conf.template" > "$NGINX_AVAILABLE"
```

---

### Phase 5: Update Backend to Use Environment Variables

**Update `backend/main.py`**:
```python
# Load environment variables
env_file = Path(__file__).parent.parent / ".env.production"
if not env_file.exists():
    env_file = Path(__file__).parent.parent / ".env.development"
if not env_file.exists():
    env_file = None

load_dotenv(env_file)

# Get configuration from environment
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
backend_port = int(os.getenv("BACKEND_PORT", 8000))
backend_host = os.getenv("HOST", "0.0.0.0")
```

**Update `backend/main.py` CORS**:
```python
# Configure CORS - allow configured frontend URL
allowed_origins = [frontend_url]

# In development, also allow localhost variations
if os.getenv("NODE_ENV") == "development":
    allowed_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Phase 6: Update Systemd Service

**Update `deploy/systemd/flooded-island-backend.service.template`**:
```ini
[Unit]
Description=Flooded Island Backend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${DEPLOY_DIR}/backend

# Environment variables
EnvironmentFile=${DEPLOY_DIR}/.env.production

# Use virtual environment Python
ExecStart=${DEPLOY_DIR}/backend/.venv/bin/python main.py

# Restart policy
Restart=always
RestartSec=10

# Logging
StandardOutput=append:${LOG_DIR}/backend.log
StandardError=append:${LOG_DIR}/backend-error.log

[Install]
WantedBy=multi-user.target
```

**Generate during deployment**:
```bash
envsubst '${DEPLOY_DIR},${LOG_DIR}' < "$DEPLOY_DIR/deploy/systemd/flooded-island-backend.service.template" > "$SYSTEMD_SERVICE"
```

---

### Phase 7: Create Comprehensive Deployment Script

**Structure of `deploy_prod.sh`**:

```bash
#!/bin/bash
# Production Deployment Script
# Deploys to remote server using configuration from .env.production

set -e

# 1. Validate prerequisites
#    - Check sudo
#    - Check .env.production exists
#    - Load and validate required env vars

# 2. Create directories
#    - Deployment directory
#    - Log directory

# 3. Sync application files
#    - rsync with proper exclusions
#    - Copy .env.production

# 4. Build application
#    - Backend venv and dependencies
#    - Frontend build with production env

# 5. Generate configuration files
#    - Nginx config from template
#    - Systemd service from template

# 6. Install and enable services
#    - Copy configs to system locations
#    - Enable systemd service
#    - Enable nginx site

# 7. Reload and restart services
#    - systemctl daemon-reload
#    - Restart backend service
#    - Reload nginx

# 8. Health checks and status
#    - Check service status
#    - Display logs location
#    - Display management commands
```

---

### Phase 8: Documentation Updates

**Create/Update Documentation**:

1. **`docs/configuration.md`** - Complete guide to configuration system
2. **`docs/deployment.md`** - Updated deployment guide
3. **`README.md`** - Update with new script names
4. **`deploy/README.md`** - Update deployment quick reference

**Key Documentation Topics**:
- Environment variables reference
- Development workflow
- Production deployment workflow
- How to change domain
- How to add new environments (staging, etc.)

---

## Implementation Checklist

### Immediate (Critical Bug Fix)
- [ ] Fix WebSocket return statement in `frontend/src/utils/websocket.ts`
- [ ] Test fix locally
- [ ] Deploy fix to production
- [ ] Verify WebSocket connects correctly

### Phase 1: Environment Configuration
- [ ] Create `.env.development` with development defaults
- [ ] Create/update `.env.production` with production configuration
- [ ] Create `.env.production.example` as template
- [ ] Update `.gitignore` to protect production env

### Phase 2: Build Scripts
- [ ] Create `build_dev.sh` for development builds
- [ ] Create `build_prod.sh` for production builds
- [ ] Rename `start.sh` → `start_dev.sh`
- [ ] Rename `stop.sh` → `stop_dev.sh`
- [ ] Update `start_dev.sh` to use `.env.development`
- [ ] Test development workflow

### Phase 3: Configuration Templates
- [ ] Create `deploy/nginx/flooded-island.conf.template`
- [ ] Create `deploy/systemd/flooded-island-backend.service.template`
- [ ] Install `envsubst` on deployment server (part of `gettext`)

### Phase 4: Deployment Scripts
- [ ] Rename `deploy.sh` → `deploy_prod.sh`
- [ ] Update `deploy_prod.sh` to read all config from env
- [ ] Update `deploy_prod.sh` to generate configs from templates
- [ ] Remove all hardcoded domain references
- [ ] Test deployment process

### Phase 5: Backend Updates
- [ ] Update `backend/main.py` to load correct env file
- [ ] Update CORS configuration to use env vars
- [ ] Update port/host configuration
- [ ] Test backend with new configuration

### Phase 6: Cleanup
- [ ] Remove old `build.sh` (replaced by `build_dev.sh` and `build_prod.sh`)
- [ ] Remove old `deploy.sh` (replaced by `deploy_prod.sh`)
- [ ] Remove hardcoded nginx config (replaced by template)
- [ ] Update all references in documentation

### Phase 7: Documentation
- [ ] Create `docs/configuration.md`
- [ ] Update `docs/deployment.md`
- [ ] Update main `README.md`
- [ ] Update `deploy/README.md`
- [ ] Update `docs/current_task.md`
- [ ] Update `docs/progress.md`

### Phase 8: Testing
- [ ] Test complete development workflow
- [ ] Test production build process
- [ ] Test production deployment process
- [ ] Test domain change process (use different domain)
- [ ] Verify no hardcoded values remain

---

## Benefits After Refactoring

### 1. Clear Separation of Concerns
- **Development**: Use `*_dev.sh` scripts, `.env.development`
- **Production**: Use `*_prod.sh` scripts, `.env.production`
- No ambiguity about which environment you're working with

### 2. Single Source of Truth
- All environment-specific configuration in env files
- No hardcoded domains or URLs
- Easy to maintain and update

### 3. Easy Domain Changes
- Change `DOMAIN` in `.env.production`
- Run `deploy_prod.sh`
- Everything automatically updates

### 4. Scalable Architecture
- Easy to add new environments (staging, QA)
- Just create `.env.staging` and `deploy_staging.sh`
- Template system supports any number of environments

### 5. Better Developer Experience
- Clear naming: know which script to run
- Environment variables documented
- Less confusion, fewer errors

### 6. Production Ready
- No localhost references in production
- Proper CORS configuration
- Secure and maintainable

---

## Migration Path for Existing Deployments

### If Currently Deployed:

1. **Apply critical bug fix first** (Phase 1: Issue 1)
   ```bash
   # Fix websocket.ts, rebuild, redeploy
   sudo ./deploy.sh
   ```

2. **Create env files** (Phase 2)
   ```bash
   # Create .env.production with current values
   # Domain: island.olegmagn.es
   ```

3. **Deploy refactored version** (Phase 4-6)
   ```bash
   # After creating templates and new scripts
   sudo ./scripts/deploy_prod.sh
   ```

4. **Clean up old files** (Phase 6)
   ```bash
   # Remove old scripts after verifying new ones work
   ```

---

## Risk Assessment

### Low Risk Changes
- Creating new env files
- Creating new scripts (doesn't affect existing)
- Documentation updates

### Medium Risk Changes
- Nginx config template (test thoroughly)
- Backend CORS changes (validate allowed origins)
- Systemd service template

### High Risk Changes  
- Removing old scripts (do last, after validation)
- Changing production deployment process

### Mitigation Strategies
- **Test locally first** - Validate all changes in development
- **Incremental deployment** - Deploy phase by phase
- **Backup before changes** - Backup current working deployment
- **Keep old scripts** - Don't delete until new ones proven
- **Rollback plan** - Keep previous version available

---

## Estimated Timeline

- **Critical Bug Fix**: 15 minutes
- **Phase 1 (Env Files)**: 30 minutes
- **Phase 2 (Build Scripts)**: 1 hour
- **Phase 3 (Templates)**: 1 hour
- **Phase 4 (Deploy Scripts)**: 2 hours
- **Phase 5 (Backend Updates)**: 1 hour
- **Phase 6 (Cleanup)**: 30 minutes
- **Phase 7 (Documentation)**: 2 hours
- **Phase 8 (Testing)**: 2 hours

**Total**: ~10 hours (1-2 working days)

---

## Questions to Address

1. **Do we want a staging environment?**
   - If yes, create `.env.staging` and `deploy_staging.sh`

2. **Should we support local production builds?**
   - Current approach assumes production builds happen on server
   - Could support local build + rsync of built artifacts

3. **Do we need development deployment?**
   - Or is `start_dev.sh` sufficient?

4. **SSL certificate management**
   - Keep manual certbot approach?
   - Or automate in deployment script?

5. **Database in future?**
   - Consider how env files will handle DB credentials
   - May need `.env.production.local` (gitignored) for secrets

---

## Success Criteria

✅ **WebSocket connects to correct domain in production**
✅ **No localhost references in production**
✅ **Clear separation between dev and prod scripts**
✅ **Single source of truth for configuration**
✅ **Domain change requires editing only .env.production**
✅ **All scripts properly named with _dev or _prod suffix**
✅ **Complete documentation for configuration and deployment**
✅ **Successful deployment using new scripts**
✅ **No hardcoded values in scripts or configs**

---

## Next Steps

1. Review this brief with team/stakeholders
2. Get approval for approach
3. Start with **immediate critical bug fix**
4. Proceed with refactoring phases
5. Update documentation as you go
6. Test thoroughly at each phase

---

**Created**: 2025-11-09
**Status**: Proposed
**Priority**: HIGH (Critical bug blocking production)
