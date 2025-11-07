# Deployment Files

This directory contains all necessary configuration files for deploying Flooded Island to a production server.

## Quick Reference

### Files Overview

```
deploy/
├── nginx/
│   └── flooded-island.conf       # Nginx reverse proxy configuration
├── systemd/
│   └── flooded-island-backend.service  # Systemd service for backend
├── DEPLOYMENT.md                 # Complete deployment guide
└── README.md                     # This file
```

### Configuration Files

#### Nginx (`nginx/flooded-island.conf`)
- HTTP to HTTPS redirect (port 80 → 443)
- SSL/TLS configuration for Let's Encrypt
- Static file serving from `frontend/dist/`
- Reverse proxy for backend API (`/api/*`)
- WebSocket proxy (`/ws/*`)
- Security headers and gzip compression

#### Systemd (`systemd/flooded-island-backend.service`)
- Runs backend as `www-data` user
- Auto-restart on failure
- Loads environment from `.env.production`
- Logs to `/var/log/flooded-island/`

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Python 3.11+
- Node.js 18+
- Nginx
- Certbot (for SSL)

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Domain** | island.olegmagn.es |
| **Ports** | 80 (HTTP), 443 (HTTPS) |
| **Backend Port** | 8000 (localhost only) |
| **SSL** | Let's Encrypt |
| **Web Server** | Nginx |
| **Process Manager** | systemd |
| **Deploy Directory** | /var/www/flooded-island |
| **Log Directory** | /var/log/flooded-island |

## 5-Minute Deployment

### 1. Prepare Server

```bash
# Install prerequisites
sudo apt update && sudo apt install -y \
  nginx certbot python3-certbot-nginx \
  python3 python3-venv nodejs npm git

# Verify DNS points to your server
dig island.olegmagn.es +short
```

### 2. Get Code on Server

```bash
# Option A: Clone from git
git clone https://github.com/your-repo/flooded_island.git /tmp/flooded-island
cd /tmp/flooded-island

# Option B: Copy from local machine
rsync -avz /Users/oleg/repos/flooded_island/ user@server:/tmp/flooded-island/
ssh user@server
cd /tmp/flooded-island
```

### 3. Create Environment File

```bash
cat > .env.production << 'EOF'
BACKEND_PORT=8000
HOST=0.0.0.0
FRONTEND_URL=https://island.olegmagn.es
VITE_BACKEND_URL=https://island.olegmagn.es
VITE_WS_URL=wss://island.olegmagn.es
DOMAIN=island.olegmagn.es
PYTHONUNBUFFERED=1
EOF
```

### 4. Deploy

```bash
sudo ./deploy.sh
```

### 5. Setup SSL

```bash
sudo certbot --nginx -d island.olegmagn.es
```

Done! Visit https://island.olegmagn.es 🎉

## Service Management

```bash
# Backend service
sudo systemctl status flooded-island-backend
sudo systemctl restart flooded-island-backend
sudo journalctl -u flooded-island-backend -f

# Nginx
sudo systemctl reload nginx
sudo nginx -t
```

## Architecture

```
Client (Browser)
    ↓ HTTPS/WSS
Nginx (port 443)
    ↓ Static files → Served by nginx
    ↓ /api/* → Proxied to backend
    ↓ /ws/* → WebSocket proxy
Backend (uvicorn:8000)
    ↓ localhost only
FastAPI Application
```
