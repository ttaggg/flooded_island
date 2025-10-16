# Technical Specification

## Room & Session Management

### Room Creation
- **Room IDs**: Auto-generated unique codes (e.g., 6-character alphanumeric)
- **Room URL**: Players join via URL like `/game/{room_id}`
- **Creation**: First player to visit a unique room URL creates it

### Role Assignment
- **System**: First-come-first-served
- **Flow**:
  1. Two vacant roles initially: "Journeyman" and "Weather"
  2. First player clicks a role → that role becomes taken
  3. Second player sees one role taken, one available
  4. Second player takes remaining role
- **Reconnection**: If a player disconnects, their role becomes available again and they can reconnect to reclaim it

### Disconnection Handling
- **On Disconnect**: Game pauses immediately
- **Waiting**: Game waits indefinitely for player to reconnect
- **Reconnection**: Player can rejoin same room and resume their role
- **No Timeout**: No automatic forfeit (game waits until reconnect)

### Room Persistence
- **Active Game**: Room persists as long as game is active
- **After Game End**: Room persists for 5 minutes after game completion
- **Cleanup**: Rooms automatically removed 5 minutes after game ends
- **Abandoned Rooms**: If both players disconnect, room persists but can be reclaimed

## Game Rules Details

### Journeyman Movement
- **Required Action**: Must move every turn (cannot stay in place)
- **Movement Options**: Any adjacent dry field (8 directions)
- **Drying**: Happens automatically after move to new position

### Field State Rules
- **Weather Flooding Restrictions**: 
  - Can only flood dry fields
  - **Cannot** flood the field where journeyman currently stands
  - Can flood 0, 1, or 2 fields per turn

### Grid Configuration
- **Size Range**: Minimum 3x3, Maximum 10x10
- **Who Configures**: Journeyman sets the grid size
- **When**: Before game starts, after both roles are filled
- **Validation**: Enforce min/max limits

### Win Conditions
- **Journeyman Victory**: Completes their move on day 365 → immediate win (weather doesn't get turn 365)
- **Weather Victory**: Journeyman has no valid dry adjacent fields to move to

## UI Specifications

### Journeyman Representation
- **Icon**: Male player icon/avatar
- **Background**: Same yellow color as dry fields
- **Visibility**: Clearly distinguishable on the field

### Field Highlighting
- **Movable Fields**: Show outline/border on adjacent dry fields where journeyman can move
- **Drying Preview**: On hover over a movable field, show which 4 fields (N/S/E/W) will be dried
- **Weather Selection**: Highlight selected fields (up to 2)

### Error Messages
- **Connection Lost**: Display when WebSocket disconnects
- **Invalid Move**: (Optional) If player attempts invalid action
- **Waiting**: "Waiting for opponent..." when other player is disconnected

## Development Configuration

### Ports
- **Backend (FastAPI)**: Port 8000 (default uvicorn)
- **Frontend (Vite)**: Port 5173 (default Vite)

### CORS Settings
- **Development**: Allow `http://localhost:5173` origin
- **Production**: Restrict to production frontend domain

### Environment Variables (.env)
```
# Backend
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Room Settings
ROOM_CLEANUP_MINUTES=5
```

## Game State Management

### Room Storage
- **Structure**: In-memory dictionary with `room_id` as key
- **Room Object Contains**:
  - `room_id`: string
  - `grid_size`: int (3-10)
  - `grid`: 2D array of field states
  - `journeyman_position`: {x, y}
  - `current_turn`: int (1-365)
  - `current_role`: "journeyman" | "weather"
  - `players`: {journeyman: WebSocket, weather: WebSocket}
  - `game_status`: "waiting" | "configuring" | "active" | "ended"
  - `winner`: null | "journeyman" | "weather"
  - `created_at`: timestamp
  - `ended_at`: timestamp | null

### Cleanup Strategy
- Background task runs every minute
- Removes rooms where `ended_at` is older than 5 minutes
- Closes any remaining WebSocket connections

## Game Flow Sequence

### Initial Room Join
1. Player 1 navigates to `/game/{room_id}`
2. Backend creates room if doesn't exist
3. Player 1 sees role selection screen with both roles available
4. Player 1 selects role (e.g., "Journeyman")
5. Screen shows "Waiting for opponent..."

### Second Player Join
1. Player 2 navigates to same `/game/{room_id}`
2. Player 2 sees role selection with one role taken, one available
3. Player 2 selects remaining role
4. Both players proceed to configuration

### Configuration Phase
1. Both players see configuration screen
2. Journeyman sees grid size selector (3-10)
3. Weather sees "Waiting for journeyman to configure..."
4. Journeyman selects grid size and clicks "Start Game"
5. Game initializes with journeyman on top-left corner

### Game Phase
1. Journeyman's turn (Day 1):
   - Sees movable fields highlighted
   - Hovers to see drying preview
   - Clicks destination field
   - Clicks "End Turn"
   - Move executes, fields dry
2. Weather's turn (Night 1):
   - Can click any dry field (except journeyman's position)
   - Can select 0-2 fields
   - Clicks "End Turn"
   - Selected fields flood
3. Repeat until win/loss condition

### Game End
1. Win condition detected by backend
2. Both players see "Game Over" screen with winner
3. Display final stats (days survived, etc.)
4. Option to start new game (new room)
5. Room remains for 5 minutes then auto-deleted

## WebSocket Message Protocol

### Client → Server Messages
```typescript
{
  type: "select_role",
  role: "journeyman" | "weather"
}

{
  type: "configure_grid",
  size: number  // 3-10
}

{
  type: "move",
  position: { x: number, y: number }
}

{
  type: "flood",
  positions: [{ x: number, y: number }]  // 0-2 positions
}

{
  type: "end_turn"
}
```

### Server → Client Messages
```typescript
{
  type: "room_state",
  state: {
    players: { journeyman: boolean, weather: boolean },
    game_status: string,
    grid_size: number | null,
    grid: any[][] | null,
    current_turn: number,
    current_role: string,
    journeyman_position: { x: number, y: number } | null
  }
}

{
  type: "game_update",
  // ... state changes
}

{
  type: "game_over",
  winner: "journeyman" | "weather",
  stats: { ... }
}

{
  type: "error",
  message: string
}

{
  type: "player_disconnected",
  role: "journeyman" | "weather"
}

{
  type: "player_reconnected",
  role: "journeyman" | "weather"
}
```

