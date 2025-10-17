# Flooded Island - Frontend

React + TypeScript + Vite frontend for the Flooded Island game.

## Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Environment variables are configured in the **root `.env` file** (shared with backend).
   The root `.env` file contains:
   - `VITE_BACKEND_URL=http://localhost:8000`
   - `VITE_WS_URL=ws://localhost:8000`

   No additional configuration needed for the frontend.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with indigo theme
- **ESLint** - Code linting

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Static assets
└── index.html         # HTML template
```

## Environment Variables

Environment variables are configured in the **root `../.env` file** (shared with backend):

- `VITE_BACKEND_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_WS_URL` - WebSocket server URL (default: ws://localhost:8000)
