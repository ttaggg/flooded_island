# Flooded Island

A turn-based multiplayer strategy game where two players compete on a flooding grid. One player (the Adventurer) tries to survive 365 days by moving strategically and drying adjacent fields, while the other player (the Weather) attempts to trap them by flooding the island.

**Ready to play?** Play at https://island.olegmagn.es!

<p align="center">
  <img src="assets/screenshot_1.jpg" height="300" />
  <img src="assets/screenshot_2.jpg" height="300" />
  <img src="assets/screenshot_3.jpg" height="300" />
</p>

## 🎮 Game Overview

- **Two Asymmetric Roles**: Adventurer (survivor) vs Weather (adversary)
- **Turn-Based Strategy**: Each player makes strategic decisions to win
- **Online Multiplayer**: Real-time WebSocket communication
- **Configurable Grid**: Adjustable grid size (3x3 to 10x10)
- **UI**: Indigo-themed interface with smooth animations

## 🚀 Development

### Prerequisites

- **Python 3.13+** (backend)
- **Node.js 18+** (frontend)
- **[uv](https://github.com/astral-sh/uv)** - Fast Python package installer

### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/ttaggg/flooded_island.git
cd flooded_island
```

2. **Start both servers**

Configure `.env.dev` in the project root and run deploy script.

```bash
chmod +x scripts/deploy_dev.sh scripts/stop_dev.sh
./scripts/deploy_dev.sh
```

This will:
- Set up and start the backend server on http://localhost:8000
- Set up and start the frontend dev server on http://localhost:5173
- Display URLs and status information

4. **Stop both servers**
```bash
./scripts/stop_dev.sh
```

## 📁 Project Structure

```
flooded_island/
├── backend/             # FastAPI backend
│   ├── game/            # Game logic modules
│   ├── models/          # Pydantic data models
│   ├── routers/         # API routes and WebSocket handlers
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   └── package.json     # Node dependencies
├── docs/                # Project documentation
├── scripts/             # Automation scripts (dev/prod)
│   ├── deploy_dev.sh
│   ├── deploy_prod.sh
│   ├── stop_dev.sh
│   └── stop_prod.sh
```

## 🎯 How to Play

1. **Create/Join a Game Room**: One player creates a room, shares the room ID
2. **Select Roles**: Players choose Adventurer or Weather
3. **Configure Grid**: Adventurer selects grid size (3-10)
4. **Play**:
   - **Adventurer's Turn**: Move to an adjacent dry field, automatically dry 4 surrounding fields (N/S/E/W)
   - **Weather's Turn**: Flood 0-2 dry fields
5. **Win Conditions**:
   - **Adventurer wins**: Survive 365 days (turns)
   - **Weather wins**: Trap the adventurer (no valid moves)

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **WebSockets**: Real-time communication
- **python-dotenv**: Environment configuration

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS with indigo theme


### Quick Deployment

1. **On your remote server**, install prerequisites:
   ```bash
   sudo apt update && sudo apt install nginx certbot python3-certbot-nginx python3 python3-venv nodejs npm -y
   ```

2. **Copy project to server** (via git or rsync)

3. **Create `.env.prod`** with your domain configuration

4. **Run deployment script (build + install)**:
   ```bash
   sudo ./scripts/deploy_prod.sh
   ```

5. **Configure SSL**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Deployment Files

- `deploy/nginx/flooded-island.conf` - Nginx reverse proxy configuration
- `deploy/systemd/flooded-island-backend.service` - Systemd service
- `deploy/DEPLOYMENT.md` - Complete deployment guide
- `scripts/deploy_prod.sh` - Automated deployment script

## 📚 Documentation

- [Game Rules](docs/game_rules.md) - Detailed game mechanics
- [Technical Specification](docs/technical_spec.md) - System architecture
- [UI Design](docs/ui_design.md) - Interface design decisions
- [Implementation Plan](docs/implementation_plan.md) - Development roadmap
- [Deployment Guide](deploy/DEPLOYMENT.md) - Production deployment instructions
