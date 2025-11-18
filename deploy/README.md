# Deployment Files

This directory contains all necessary configuration files for deploying Flooded Island to a production server.

## Quick Reference

### Files Overview

```
deploy/
├── nginx/
│   └── flooded-island.conf             # Nginx reverse proxy configuration
├── systemd/
│   └── flooded-island-backend.service  # Systemd service for backend
└── README.md                           # This file
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
- Loads environment from `.env.prod`
- Logs to `/var/log/flooded-island/`

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Python 3.11+
- Node.js 18+
- Nginx
- Certbot (for SSL)

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
