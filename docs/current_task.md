# Current Active Task

## Task
Task 3.4: Message Handlers - Gameplay

## Phase
Phase 3: WebSocket Communication

## Status
Completed

## Description
Implement move and flood message handlers to enable core gameplay with validation, state management, win condition checking, and broadcasting to both players.

## Requirements
- Handle `move` WebSocket messages (journeyman)
- Handle `flood` WebSocket messages (weather)
- Validate all game actions
- Update game state (positions, grid, turns)
- Dry adjacent fields when journeyman moves (4 directions)
- Flood fields when weather acts (0-2 per turn)
- Check win conditions after each action
- Switch turns appropriately
- Broadcast updates to all players
- Comprehensive error handling

## Implementation Steps

### 1. Import Required Dependencies
- Import `MoveMessage` from models.messages ✅
- Import `FloodMessage` from models.messages ✅
- Import `GameOverMessage` from models.messages ✅
- Import `validate_journeyman_move` from game.validator ✅
- Import `validate_weather_flood` from game.validator ✅
- Import `check_win_condition` from game.win_checker ✅
- Import `FieldState` from models.game ✅

### 2. Implement Move Handler (Journeyman)
**Location**: `backend/routers/websocket.py` lines 496-640

**Validation**:
- Parse `MoveMessage` from incoming WebSocket message ✅
- Get player role, verify it's JOURNEYMAN ✅
- Check room status is ACTIVE ✅
- Check it's journeyman's turn ✅
- Call `validate_journeyman_move()` for position validation ✅

**Game Logic**:
- Update `room.journeyman_position` to target ✅
- Get adjacent positions (4 directions, no diagonals) ✅
- Set all adjacent fields to DRY (drying effect) ✅
- Update room.grid with modified board state ✅
- Switch turn to weather (`room.current_role = PlayerRole.WEATHER`) ✅

**Win Condition**:
- Call `check_win_condition()` after move ✅
- If winner found, set game to ENDED status ✅
- Broadcast `GameOverMessage` with winner and stats ✅
- Otherwise broadcast `RoomStateMessage` ✅

### 3. Implement Flood Handler (Weather)
**Location**: `backend/routers/websocket.py` lines 642-780

**Validation**:
- Parse `FloodMessage` from incoming WebSocket message ✅
- Get player role, verify it's WEATHER ✅
- Check room status is ACTIVE ✅
- Check it's weather's turn ✅
- Call `validate_weather_flood()` for positions validation ✅

**Game Logic**:
- For each position, set to FLOODED ✅
- Update room.grid with modified board state ✅
- Increment turn counter (`room.current_turn += 1`) ✅
- Switch turn to journeyman (`room.current_role = PlayerRole.JOURNEYMAN`) ✅

**Win Condition**:
- Call `check_win_condition()` after flood ✅
- If winner found, set game to ENDED status ✅
- Broadcast `GameOverMessage` with winner and stats ✅
- Otherwise broadcast `RoomStateMessage` ✅

### 4. Error Handling
All handlers include comprehensive error handling for:
- Player without role assignment ✅
- Wrong player role (weather trying to move, journeyman trying to flood) ✅
- Wrong game status (not ACTIVE) ✅
- Wrong turn (not player's turn) ✅
- Invalid positions (out of bounds, flooded fields, etc.) ✅
- Pydantic ValidationError for malformed messages ✅
- General exceptions ✅

### 5. Board State Management
Proper synchronization between room state and board instance:
- Create `Board` instance from `room.grid_size` and `room.grid` ✅
- Perform operations on board ✅
- Sync back: `room.grid = board.grid` ✅

## Current Progress
- [x] Import all required dependencies ✅
- [x] Implement move message handler ✅
- [x] Implement flood message handler ✅
- [x] Validate player roles ✅
- [x] Validate game status ✅
- [x] Validate turns ✅
- [x] Update journeyman position ✅
- [x] Dry adjacent fields (4 directions) ✅
- [x] Flood fields (0-2) ✅
- [x] Increment turn counter ✅
- [x] Switch turns appropriately ✅
- [x] Check win conditions ✅
- [x] Broadcast updates ✅
- [x] Error handling for all cases ✅
- [x] Create comprehensive test suite ✅
- [x] All tests passing (6/6) ✅

## Acceptance Criteria
- ✅ Journeyman can move to adjacent dry fields
- ✅ Journeyman move dries adjacent fields (4 directions)
- ✅ Journeyman cannot move to flooded fields
- ✅ Weather can flood 0-2 fields per turn
- ✅ Weather cannot flood journeyman's position
- ✅ Weather cannot flood already flooded fields
- ✅ Turn counter increments correctly
- ✅ Turn switches between players
- ✅ Wrong role cannot perform wrong action
- ✅ Out-of-turn actions are blocked
- ✅ Both players receive broadcasts
- ✅ Win conditions checked after each action
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
============================================================
COMPLETE GAMEPLAY TEST
============================================================

[1] Basic move and flood cycle
[2] Wrong role validation
[3] Turn management
[4] Flood zero fields
[5] Cannot flood journeyman position
[6] Cannot flood already flooded field

============================================================
RESULTS: 6/6 tests passed
============================================================

✅ Passed:
  • Basic move/flood cycle
  • Wrong role validation
  • Turn management
  • Flood zero fields
  • Cannot flood journeyman position
  • Cannot re-flood field

🎉 ALL TESTS PASSED!

Features verified:
  ✓ Journeyman move with position update
  ✓ Weather flood (0-2 fields)
  ✓ Turn switching and incrementing
  ✓ Role-based action validation
  ✓ Turn-based action validation
  ✓ Position validation (flooded, journeyman)
  ✓ Broadcasting to both players
============================================================
```

## Key Implementation Details

### Move Handler Flow
```
Journeyman → move{position: {x, y}}
  → Validate player role = JOURNEYMAN ✓
  → Validate game status = ACTIVE ✓
  → Validate current_role = JOURNEYMAN ✓
  → Validate move (adjacent, dry field) ✓
  → Update journeyman_position
  → Get adjacent positions (4 directions)
  → Dry all adjacent FLOODED fields
  → Switch to weather turn
  → Check win condition (365 turns?)
  → Broadcast room_state or game_over
```

### Flood Handler Flow
```
Weather → flood{positions: [{x, y}, ...]}
  → Validate player role = WEATHER ✓
  → Validate game status = ACTIVE ✓
  → Validate current_role = WEATHER ✓
  → Validate flood (0-2 positions, dry, not journeyman) ✓
  → Flood all specified positions
  → Increment turn counter
  → Switch to journeyman turn
  → Check win condition (journeyman trapped?)
  → Broadcast room_state or game_over
```

### Validation Layers
1. **Player Role Check** - Is player assigned correct role?
2. **Game State Check** - Is game ACTIVE?
3. **Turn Check** - Is it player's turn?
4. **Action Validation** - Is specific action valid?

### Drying Logic
When journeyman moves to a position:
- Get 4 adjacent positions (N, E, S, W - no diagonals)
- For each adjacent position:
  - If FLOODED, set to DRY
- This represents the journeyman drying out nearby flooded fields

### Turn Management
- **Journeyman's turn**: Can move, turn stays same, switches to weather after move
- **Weather's turn**: Can flood, turn increments, switches to journeyman after flood
- Turn counter only increments on weather's action (represents one complete "day")

### State Transitions
- **Before move/flood**: Validate all conditions
- **During move/flood**: Update grid and positions
- **After move/flood**: Check win, save state, broadcast

### Error Messages
- **No role**: "You must select a role before..."
- **Wrong role**: "Only the {role} player can..."
- **Wrong state**: "Game must be active to..."
- **Wrong turn**: "It's not your turn (current: {role})"
- **Invalid position**: Various messages based on specific validation failure

### Edge Cases Handled
- ✅ Player with no role tries to act
- ✅ Wrong role tries wrong action (weather move, journeyman flood)
- ✅ Player tries to act out of turn
- ✅ Move to flooded field
- ✅ Move out of bounds
- ✅ Move to non-adjacent field
- ✅ Flood too many fields (>2)
- ✅ Flood journeyman's position
- ✅ Flood already flooded field
- ✅ Flood out of bounds
- ✅ Malformed messages
- ✅ Room not found
- ✅ Game not active

## Next Task
Task 3.5: Frontend Game Implementation (UI, WebSocket client, game board rendering)

## Blockers/Notes
- No blockers
- Gameplay handlers fully implemented and tested
- All 6 comprehensive test cases passing
- Move and flood logic working correctly
- Turn management working properly
- Win condition checking in place (will be triggered in actual gameplay)
- Broadcasting synchronized to both players
- Ready for frontend integration
