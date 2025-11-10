# Flooded Island

A turn-based multiplayer strategy game where two players compete on a flooding grid. One player (the Adventurer) tries to survive 365 days by moving strategically and drying adjacent fields, while the other player (the Weather) attempts to trap them by flooding the island.

## 🎮 Game Overview

- **Two Asymmetric Roles**: Adventurer (survivor) vs Weather (adversary)
- **Turn-Based Strategy**: Each player makes strategic decisions to win
- **Online Multiplayer**: Real-time WebSocket communication
- **Configurable Grid**: Adjustable grid size (3x3 to 10x10)
- **Beautiful UI**: Indigo-themed interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+ (3.13+ recommended)** (backend)
- **Node.js 18+** (frontend)
- **[uv](https://github.com/astral-sh/uv)** - Fast Python package installer

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd flooding_islands
```

2. **Configure environment**

Create `.env.dev` in the project root with the variables shown below.

3. **Start both servers** (development stack)
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

### Manual Setup

If you prefer to set up each component individually:

#### Backend Setup

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
python main.py
```

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

See [frontend/README.md](frontend/README.md) for detailed frontend setup instructions.

## 📁 Project Structure

```
flooded_island/
├── backend/              # FastAPI backend
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
│   ├── build_dev.sh
│   ├── build_prod.sh
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

## 🌐 Development

### Environment Variables

Development scripts read from `.env.dev`. A typical local file looks like:
```env
BACKEND_HOST=localhost
BACKEND_PORT=8000
FRONTEND_HOST=localhost
FRONTEND_PORT=5173
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Production automation relies on `.env.prod`, containing your public URLs and any secrets required by the server environment.

### Available Endpoints

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

### Development Workflow

1. Make changes to backend or frontend code
2. Both servers support hot reload (changes apply automatically)
3. Test in browser at http://localhost:5173
4. Use API docs at http://localhost:8000/docs for backend testing

## 🚀 Production Deployment

Deploy to your own server with nginx, Let's Encrypt SSL, and systemd:

### Quick Deployment

1. **On your remote server**, install prerequisites:
   ```bash
   sudo apt update && sudo apt install nginx certbot python3-certbot-nginx python3 python3-venv nodejs npm -y
   ```

2. **Copy project to server** (via git or rsync)

3. **Create `.env.prod`** with your domain configuration

4. **Build production artifacts locally**:
   ```bash
   ./scripts/build_prod.sh
   ```

5. **Run deployment script**:
   ```bash
   sudo ./scripts/deploy_prod.sh
   ```

6. **Configure SSL**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

For complete deployment instructions, see **[deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)**

> ℹ️ `scripts/deploy_prod.sh` assumes `scripts/build_prod.sh` has already produced the `frontend/dist` bundle. The deploy step stops the running service, replaces `/var/www/flooded-island`, and restarts the stack.

### Deployment Files

- `deploy/nginx/flooded-island.conf` - Nginx reverse proxy configuration
- `deploy/systemd/flooded-island-backend.service` - Systemd service
- `deploy/DEPLOYMENT.md` - Complete deployment guide
- `deploy_prod.sh` - Automated deployment script

## 📚 Documentation

- [Game Rules](docs/game_rules.md) - Detailed game mechanics
- [Technical Specification](docs/technical_spec.md) - System architecture
- [UI Design](docs/ui_design.md) - Interface design decisions
- [Implementation Plan](docs/implementation_plan.md) - Development roadmap
- [Deployment Guide](deploy/DEPLOYMENT.md) - Production deployment instructions

## 🎨 Features

- ✅ Real-time multiplayer via WebSockets
- ✅ Indigo-themed beautiful UI
- ✅ Smooth 3D flip animations for field state changes
- ✅ Responsive design
- ✅ In-memory game state management
- ✅ Room-based matchmaking
- ✅ Reconnection support

---

**Ready to play?** Run `./scripts/deploy_dev.sh` and open http://localhost:5173 in your browser!
