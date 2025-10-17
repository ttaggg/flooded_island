# Flooded Island

A turn-based multiplayer strategy game where two players compete on a flooding grid. One player (the Journeyman) tries to survive 365 days by moving strategically and drying adjacent fields, while the other player (the Weather) attempts to trap them by flooding the island.

## 🎮 Game Overview

- **Two Asymmetric Roles**: Journeyman (survivor) vs Weather (adversary)
- **Turn-Based Strategy**: Each player makes strategic decisions to win
- **Online Multiplayer**: Real-time WebSocket communication
- **Configurable Grid**: Adjustable grid size (3x3 to 10x10)
- **Beautiful UI**: Indigo-themed interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18+** (frontend)
- **[uv](https://github.com/astral-sh/uv)** - Fast Python package installer

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd flooding_islands
```

2. **Start both servers** (easiest way)
```bash
chmod +x start.sh stop.sh
./start.sh
```

This will:
- Set up and start the backend server on http://localhost:8000
- Set up and start the frontend dev server on http://localhost:5173
- Display URLs and status information

3. **Stop both servers**
```bash
./stop.sh
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
├── .env                 # Environment variables (not committed)
├── start.sh             # Start both servers
└── stop.sh              # Stop both servers
```

## 🎯 How to Play

1. **Create/Join a Game Room**: One player creates a room, shares the room ID
2. **Select Roles**: Players choose Journeyman or Weather
3. **Configure Grid**: Journeyman selects grid size (3-10)
4. **Play**:
   - **Journeyman's Turn**: Move to an adjacent dry field, automatically dry 4 surrounding fields (N/S/E/W)
   - **Weather's Turn**: Flood 0-2 dry fields
5. **Win Conditions**:
   - **Journeyman wins**: Survive 365 days (turns)
   - **Weather wins**: Trap the journeyman (no valid moves)

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

The `.env` file in the root directory contains:
```env
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Available Endpoints

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

### Development Workflow

1. Make changes to backend or frontend code
2. Both servers support hot reload (changes apply automatically)
3. Test in browser at http://localhost:5173
4. Use API docs at http://localhost:8000/docs for backend testing

## 📚 Documentation

- [Game Rules](docs/game_rules.md) - Detailed game mechanics
- [Technical Specification](docs/technical_spec.md) - System architecture
- [UI Design](docs/ui_design.md) - Interface design decisions
- [Implementation Plan](docs/implementation_plan.md) - Development roadmap

## 🎨 Features

- ✅ Real-time multiplayer via WebSockets
- ✅ Indigo-themed beautiful UI
- ✅ Smooth 3D flip animations for field state changes
- ✅ Responsive design
- ✅ In-memory game state management
- ✅ Room-based matchmaking
- ✅ Reconnection support

---

**Ready to play?** Run `./start.sh` and open http://localhost:5173 in your browser!
