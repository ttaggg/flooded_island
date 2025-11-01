# Implementation Plan - Flooded Island

## General Idea
Build a 2-player online turn-based strategy game where:
- **Adventurer** tries to survive 365 days by moving on dry fields and drying adjacent fields
- **Weather** tries to trap the adventurer by flooding up to 2 fields per turn
- Real-time WebSocket communication synchronizes game state
- In-memory state management (no database for MVP)
- Indigo-themed UI with smooth animations

## Current Progress
✅ Documentation complete (game rules, technical spec, UI design)
⏸️ Starting implementation - Phase 1: Project Scaffolding

---

## Task Breakdown

### **Phase 1: Project Scaffolding (Foundation)**

#### **Task 1.1: Backend Project Setup**
- Create `backend/` directory structure
- Initialize Python virtual environment
- Create `requirements.txt` with dependencies (FastAPI, uvicorn, python-dotenv, websockets)
- Create basic `main.py` with FastAPI app and health check endpoint
- Set up folder structure: `game/`, `models/`, `routers/`
- Create `.env.example` file with template variables

#### **Task 1.2: Frontend Project Setup**
- Create `frontend/` directory
- Initialize Vite + React + TypeScript project
- Install base dependencies (React, TypeScript, Tailwind CSS)
- Set up folder structure: `components/`, `hooks/`, `utils/`, `types/`
- Configure Tailwind with indigo palette
- Create basic App component

#### **Task 1.3: Root Configuration**
- Create root `.gitignore` (Python + Node patterns)
- Create root `README.md` with setup instructions
- Create `.env` file for local development
- Test both servers can run simultaneously
- Create scripts to deploy and to switch off

---

### **Phase 2: Core Backend Logic**

#### **Task 2.1: Data Models**
- Define Pydantic models for:
  - Field state (dry/flooded)
  - Position coordinates
  - Game room state
  - Player roles
  - WebSocket message types (client→server, server→client)

#### **Task 2.2: Game Logic - Board Management**
- Create `game/board.py`:
  - Initialize grid with configurable size (3-10)
  - Get/set field states
  - Check if position is valid
  - Get adjacent positions (8 directions for movement, 4 for drying)

#### **Task 2.3: Game Logic - Move Validation**
- Create `game/validator.py`:
  - Validate adventurer movement (adjacent dry fields only)
  - Validate weather flooding (dry fields, not adventurer's position, max 2)
  - Check if adventurer is trapped (no valid moves)
  - Validate grid size configuration

#### **Task 2.4: Game Logic - Win Conditions**
- Create `game/win_checker.py`:
  - Check adventurer victory (365 turns completed)
  - Check weather victory (adventurer trapped)
  - Calculate game statistics

#### **Task 2.5: Room Management**
- Create `game/room_manager.py`:
  - In-memory room storage (dictionary)
  - Create room with unique ID generation
  - Get/update room state
  - Room cleanup logic (5 minutes after game end)
  - Background cleanup task

---

### **Phase 3: WebSocket Communication**

#### **Task 3.1: WebSocket Connection Handler**
- Create `routers/websocket.py`:
  - WebSocket endpoint `/ws/{room_id}`
  - Connection acceptance and room joining
  - Disconnection handling
  - Broadcast messages to room players

#### **Task 3.2: Message Handlers - Role Selection**
- Handle `select_role` message:
  - Assign role to player
  - Update room state
  - Broadcast role updates to both players
  - Transition to configuration phase when both roles filled

#### **Task 3.3: Message Handlers - Game Configuration**
- Handle `configure_grid` message:
  - Validate grid size (3-10)
  - Initialize game board
  - Place adventurer at top-left
  - Broadcast game start to both players

#### **Task 3.4: Message Handlers - Gameplay**
- Handle `move` message (adventurer):
  - Validate move
  - Update adventurer position
  - Dry adjacent fields (4 directions)
  - Check win condition
  - Switch turn to weather
  - Broadcast update
- Handle `flood` message (weather):
  - Validate flood positions (0-2)
  - Update field states
  - Check win condition (adventurer trapped)
  - Increment turn counter
  - Switch turn to adventurer
  - Broadcast update

#### **Task 3.5: Reconnection Logic**
- Handle reconnection scenario:
  - Identify returning player
  - Restore their role
  - Send current game state
  - Notify other player of reconnection

---

### **Phase 4: Frontend - UI Components**

#### **Task 4.1: TypeScript Types**
- Create `types/game.ts`:
  - Define interfaces for game state, positions, messages
  - Field state enum
  - Role types
  - Game status enum

#### **Task 4.2: WebSocket Hook**
- Create `hooks/useWebSocket.ts`:
  - Connect to WebSocket
  - Send/receive messages
  - Handle connection states
  - Auto-reconnection logic
  - Message queue for offline messages

#### **Task 4.3: Game State Hook**
- Create `hooks/useGameState.ts`:
  - Manage local game state
  - Sync with WebSocket messages
  - Expose game actions (selectRole, move, flood, etc.)

#### **Task 4.4: Role Selection Screen**
- Create `components/RoleSelection.tsx`:
  - Display available roles
  - Show which roles are taken
  - Handle role selection
  - Waiting state for second player
  - Indigo gradient background

#### **Task 4.5: Game Configuration Screen**
- Create `components/GameConfiguration.tsx`:
  - Grid size selector (adventurer only)
  - Visual preview of grid
  - Start game button
  - Waiting state for weather player

#### **Task 4.6: Game Board Component**
- Create `components/GameBoard.tsx`:
  - Render NxN grid
  - Display field states (dry/flooded)
  - Show adventurer position
  - Responsive sizing
  - Grid layout

#### **Task 4.7: Field Component**
- Create `components/Field.tsx`:
  - Render individual field with state (dry/flooded)
  - Click handlers for selection
  - Hover states
  - Highlight selectable fields
  - Show adventurer icon if positioned there

#### **Task 4.8: Field Animations**
- Add CSS animations to `Field.tsx`:
  - 3D flip effect for state changes (dry↔flooded)
  - Rotation animation (300-500ms)
  - Selection glow/border effect
  - Hover effects

#### **Task 4.9: Turn Controls Component**
- Create `components/TurnControls.tsx`:
  - Display current turn and day counter
  - Show whose turn it is
  - "End Turn" button (enabled when valid action selected)
  - Selection counter for weather (0/2, 1/2, 2/2)

#### **Task 4.10: Drying Preview**
- Add hover preview to adventurer movement:
  - Highlight 4 fields (N/S/E/W) that will be dried
  - Visual indicator on hover
  - Clear distinction from movement highlighting

#### **Task 4.11: Game Over Screen**
- Create `components/GameOver.tsx`:
  - Winner announcement
  - Final statistics (days survived, fields flooded)
  - "Play Again" button (generates new room)
  - Indigo gradient styling

#### **Task 4.12: Connection Status Component**
- Create `components/ConnectionStatus.tsx`:
  - Show connection state
  - "Waiting for opponent..." message
  - Player disconnected/reconnected notifications
  - Error messages

---

### **Phase 5: Integration & Game Flow**

#### **Task 5.1: Main App Routing**
- Set up basic routing (if needed):
  - Home page (create/join room)
  - Game page (`/game/{room_id}`)
- Integrate all screens into main App flow

#### **Task 5.2: Room ID Generation UI**
- Create home page or entry point:
  - "Create New Game" button (generates room ID)
  - "Join Game" input (enter room ID)
  - Navigate to `/game/{room_id}`

#### **Task 5.3: Complete Game Flow Testing**
- Test full sequence:
  - Room creation
  - Role selection
  - Grid configuration
  - Multiple turns
  - Win conditions
  - Reconnection

#### **Task 5.4: Turn Transition Polish**
- Smooth transitions between turns:
  - Visual feedback when turn switches
  - Disable controls when not player's turn
  - Clear indication of current turn

---

### **Phase 6: Documentation & Deployment Prep**

#### **Task 6.1: Code Documentation**
- Add docstrings to Python functions
- TypeScript JSDoc comments

#### **Task 6.2: README Updates**
- Complete setup instructions
- Development workflow
- Environment variables guide
- Game rules summary

---

### **Phase 7: Future**

#### **Task 7.1: Performance Optimization**
- Optimize WebSocket message size
- Reduce re-renders in React
- Efficient grid rendering for 10x10
- Memory leak checks

---

## Summary

**Total: ~32 discrete tasks** organized into 7 phases:

1. **Phase 1 (3 tasks)**: Project scaffolding - Backend, Frontend, Root config
2. **Phase 2 (5 tasks)**: Core backend game logic - Models, board, validation, win conditions, rooms
3. **Phase 3 (5 tasks)**: WebSocket communication - Handlers for all game actions
4. **Phase 4 (12 tasks)**: Frontend UI components - All screens and interactions
5. **Phase 5 (4 tasks)**: Integration - Complete game flow end-to-end
6. **Phase 6 (2 tasks)**: Documentation - Code comments, README, testing guide
7. **Phase 7 (1 task)**: Future changes

---

## Execution Order

1. **Phase 1** - Project scaffolding (current)
2. **Phase 2** - Backend game logic foundation
3. **Phase 3** - WebSocket communication layer
4. **Phase 4** - Frontend UI components
5. **Phase 5** - Integration and complete game flow
6. **Phase 6** - Documentation finalization
7. **Phase 7** - Future

Each task is designed to be completed in one focused session with clear deliverables and dependencies.
