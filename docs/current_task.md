# Current Active Task

## Task
Project Scaffolding & Initial Setup

## Status
Not started

## Description
Set up the basic project structure including backend (FastAPI) and frontend (React + TypeScript + Vite) with proper dependencies, configuration files, and initial folder structure. This provides the foundation for implementing the game logic and UI.

## Requirements
- Backend: FastAPI application with WebSocket support
- Frontend: React + TypeScript using Vite
- Environment configuration (.env file)
- Basic project structure as outlined in tech_context.md
- Development tooling (linters, formatters)
- README with setup instructions

## Implementation Plan

### Backend Setup
1. Create `backend/` directory
2. Initialize Python virtual environment
3. Create `requirements.txt` with:
   - fastapi
   - uvicorn[standard]
   - python-dotenv
   - websockets (if needed separately)
4. Create basic `main.py` with FastAPI app and hello world endpoint
5. Set up project structure:
   - `backend/game/` - Game logic modules
   - `backend/models/` - Data models
   - `backend/routers/` - API routes and WebSocket handlers
6. Create `.env.example` file
7. Add `.gitignore` for Python

### Frontend Setup
1. Create `frontend/` directory
2. Initialize Vite + React + TypeScript project
3. Install dependencies:
   - react, react-dom
   - typescript
   - Consider: tailwindcss or styling solution
4. Set up project structure:
   - `src/components/` - React components
   - `src/hooks/` - Custom hooks
   - `src/utils/` - Utilities
   - `src/types/` - TypeScript types
5. Configure TypeScript (tsconfig.json)
6. Add basic App component
7. Add `.gitignore` for Node

### Root Level
1. Create root `.gitignore` (combine frontend + backend)
2. Create main `README.md` with:
   - Project description
   - Setup instructions for both backend and frontend
   - How to run development servers
3. Create `.env` file (gitignored) for local development

## Current Progress
- [ ] Backend directory structure
- [ ] Python virtual environment
- [ ] requirements.txt
- [ ] Basic FastAPI app
- [ ] Frontend Vite project
- [ ] TypeScript configuration
- [ ] Root .gitignore
- [ ] Root README.md
- [ ] .env setup

## Blockers/Notes
- No blockers currently
- Once scaffolding is complete, next tasks will be:
  1. Implement core game logic (board, moves, win conditions)
  2. WebSocket communication layer
  3. Frontend game board UI
  4. Role selection and room management

