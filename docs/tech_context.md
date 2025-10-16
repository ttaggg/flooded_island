# Tech Context

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Language**: Python 3.13 (minimum 3.11+)
- **WebSockets**: FastAPI WebSocket support
- **API Style**: RESTful + WebSocket connections
- **Package Manager**: uv (fast Python package installer)

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite (recommended for modern React + TS)
- **State Management**: React Context/hooks (for game state)
- **Styling**: CSS Modules or Tailwind CSS (for indigo palette & gradients)

### Real-time Communication
- **Protocol**: WebSockets
- **Purpose**: Synchronize game state between journeyman and weather players
- **Flow**: Both players connect to same game room, receive real-time updates on moves

### Other Tools & Libraries
- **python-dotenv**: Environment variable management
- **uvicorn**: ASGI server for FastAPI
- **CORS middleware**: Enable frontend-backend communication during development

## Environment Details

### Development Environment
- **OS**: macOS (darwin 25.0.0)
- **Shell**: zsh
- **Project Location**: `/Users/oleg/repos/flooding_islands/`

### Environment Variables
- Secrets managed via `.env` file (gitignored)
- Use `python-dotenv` for loading environment variables in Python

### Setup Instructions
[Add setup instructions as project develops]

## Architecture

### Game State Management
- **Backend**: Maintains authoritative game state for each active room
- **Frontend**: Local state synchronized via WebSocket messages
- **Session Persistence**: In-memory during active game (no database for MVP)

### Communication Flow
1. Players navigate to website
2. Join/create game room (simple room code or URL)
3. Select available role (journeyman or weather)
4. WebSocket connection established
5. Game state updates broadcast to both players in real-time

### Game Logic Location
- **Backend**: All game rule validation, move validation, win/loss detection
- **Frontend**: UI rendering, user input, animations

### Project Structure (Planned)
```
flooding_islands/
├── backend/          # FastAPI application
│   ├── main.py       # Entry point, WebSocket routes
│   ├── game/         # Game logic modules
│   └── models/       # Data models
├── frontend/         # React TypeScript application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utilities
└── docs/            # Project documentation
```

## Dependencies
### Backend (Python)
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `python-dotenv` - Environment management
- `websockets` - WebSocket support

### Frontend (TypeScript/React)
- `react` - UI framework
- `typescript` - Type safety
- `vite` - Build tool
- TBD: Animation library (framer-motion, react-spring, or CSS animations)

