# Current Active Task

## Task
Task 3.3: Message Handlers - Game Configuration

## Phase
Phase 3: WebSocket Communication

## Status
Completed

## Description
Implement grid configuration message handler to allow the journeyman player to set grid size, initialize the game board, place the journeyman at top-left (0,0), and transition to ACTIVE game status with broadcast to both players.

## Requirements
- Handle `configure_grid` WebSocket messages
- Validate grid size (3-10)
- Only journeyman player can configure grid
- Initialize game board with all DRY fields
- Place journeyman at position (0,0)
- Transition room state from CONFIGURING → ACTIVE
- Broadcast game start to all connected players
- Comprehensive error handling

## Implementation Steps

### 1. Import Required Dependencies
- Import `ConfigureGridMessage` from models.messages
- Import `Board` class from game.board
- Import `validate_grid_size` function from game.validator
- Import `Position` from models.game
- All imports added at top of file after fastapi/pydantic imports

### 2. Message Parsing and Validation
- Parse `ConfigureGridMessage` from incoming WebSocket message
- Use Pydantic validation for grid size (ge=3, le=10)
- Catch and report ValidationError exceptions
- Return error for invalid grid sizes

### 3. Player Role Verification (First Check)
- Get player's role via `ConnectionManager.get_player_role()`
- Return error if player has no role assigned
- Return error if player is WEATHER (only journeyman can configure)
- Provides specific error messages for role-related issues

### 4. Room State Verification
- Get current room state from room_manager
- Check if room status is CONFIGURING
- Return error if room is in WAITING, ACTIVE, or ENDED state
- Ensures proper game flow

### 5. Grid Size Validation
- Call `validate_grid_size(size)` function
- Validates size is between 3-10 inclusive
- Return validation error message if out of bounds

### 6. Board Initialization
- Create `Board(grid_size)` instance
- Board initializes NxN grid with all fields as DRY
- Extract board.grid for room state

### 7. Room State Update
- Set `room.grid_size` to validated size
- Set `room.grid` to initialized board grid
- Set `room.journeyman_position = Position(x=0, y=0)`
- Set `room.game_status = GameStatus.ACTIVE`
- Set `room.current_role = PlayerRole.JOURNEYMAN` (journeyman moves first)
- Set `room.current_turn = 1`

### 8. Save and Broadcast
- Save updated room using `room_manager.update_room()`
- Serialize room state with `serialize_room_state()`
- Create `RoomStateMessage` with updated state
- Broadcast to all players via `connection_manager.broadcast()`
- Both players receive synchronized game start state

## Current Progress
- [x] Import ConfigureGridMessage from models.messages ✅
- [x] Import Board from game.board ✅
- [x] Import validate_grid_size from game.validator ✅
- [x] Import Position from models.game ✅
- [x] Parse and validate configure_grid messages ✅
- [x] Verify player role (journeyman only) ✅
- [x] Check room status (must be CONFIGURING) ✅
- [x] Validate grid size (3-10) ✅
- [x] Initialize Board with validated size ✅
- [x] Place journeyman at (0,0) ✅
- [x] Update all room state fields ✅
- [x] Transition to ACTIVE status ✅
- [x] Save room state changes ✅
- [x] Broadcast updates to all players ✅
- [x] Error handling for all cases ✅
- [x] Add comprehensive logging ✅
- [x] Create comprehensive test suite ✅
- [x] All tests passing (12/12) ✅

## Acceptance Criteria
- ✅ Journeyman can configure grid size (3, 5, 7, 10 all tested)
- ✅ Weather player cannot configure grid (gets error)
- ✅ Invalid grid sizes rejected (2, 11, -1, 0, 100 all rejected)
- ✅ Room transitions from CONFIGURING to ACTIVE
- ✅ Grid initialized with all DRY fields
- ✅ Journeyman placed at (0, 0)
- ✅ Both players receive broadcast
- ✅ Both players receive synchronized state
- ✅ Cannot configure without role
- ✅ Cannot configure in WAITING state
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
============================================================
GRID CONFIGURATION HANDLER TESTS
============================================================

=== Test 1: Journeyman Configures Grid (Valid Sizes) ===
✅ PASSED: Journeyman configure grid size 3
✅ PASSED: Journeyman configure grid size 5
✅ PASSED: Journeyman configure grid size 7
✅ PASSED: Journeyman configure grid size 10

=== Test 2: Weather Player Cannot Configure Grid ===
✅ PASSED: Weather cannot configure

=== Test 3: Invalid Grid Sizes Rejected ===
✅ PASSED: Reject invalid size 2
✅ PASSED: Reject invalid size 11
✅ PASSED: Reject invalid size -1
✅ PASSED: Reject invalid size 0
✅ PASSED: Reject invalid size 100

=== Test 4: Cannot Configure Without Role ===
✅ PASSED: Cannot configure without role

=== Test 5: Cannot Configure in WAITING State ===
✅ PASSED: Cannot configure in WAITING

============================================================
TEST SUMMARY: 12/12 tests passed
✅ ALL TESTS PASSED!
============================================================
```

## Key Implementation Details

### Validation Order
The validation checks are ordered from most specific to most general:
1. **Player Role Check** - Most specific error (no role or wrong role)
2. **Room State Check** - Game flow validation (must be in CONFIGURING state)
3. **Grid Size Validation** - Input validation (must be 3-10)

This order ensures users get the most relevant error message for their situation.

### Message Flow
```
Player 1 (journeyman) → configure_grid(size=5)
  → Validate message format ✓
  → Check player role = JOURNEYMAN ✓
  → Check room status = CONFIGURING ✓
  → Validate grid size (3-10) ✓
  → Initialize Board(5) with all DRY fields
  → room.grid_size = 5
  → room.grid = [[DRY × 5] × 5]
  → room.journeyman_position = (0, 0)
  → room.game_status = ACTIVE
  → room.current_role = JOURNEYMAN
  → room.current_turn = 1
  → Save room state
  → Broadcast to all players

Player 2 (weather) receives:
  → RoomStateMessage with complete game state
  → Game is now ACTIVE
  → Waiting for journeyman's first move
```

### State Transitions
- **WAITING** → both roles must be filled → **CONFIGURING**
- **CONFIGURING** → journeyman configures grid → **ACTIVE**
- **ACTIVE** → gameplay in progress → **ENDED** (future task)

### Board Initialization
- Creates NxN grid where N = validated grid size
- All fields initialized as `FieldState.DRY`
- Grid is 2D list: `[[FieldState.DRY for _ in range(N)] for _ in range(N)]`
- Position (0,0) is top-left corner
- Position (N-1, N-1) is bottom-right corner

### Error Messages
- **No role**: "You must select a role before configuring the grid"
- **Weather role**: "Only the journeyman player can configure the grid"
- **Wrong state**: "Room must be in configuring state to set grid size (current: {state})"
- **Invalid size**: "Grid size must be between 3 and 10 (inclusive), got {size}"

### Edge Cases Handled
- ✅ Player with no role tries to configure
- ✅ Weather player tries to configure (only journeyman can)
- ✅ Grid configuration attempted in WAITING state
- ✅ Grid configuration attempted when already ACTIVE
- ✅ Invalid grid sizes (too small, too large, negative, zero)
- ✅ Malformed messages (Pydantic validation)
- ✅ Room not found
- ✅ Broadcast synchronization to multiple players

## Next Task
Task 3.4: Message Handlers - Gameplay (move and flood)

## Blockers/Notes
- No blockers
- Grid configuration fully implemented and tested
- All 12 test cases passing
- State machine working correctly (WAITING → CONFIGURING → ACTIVE)
- Ready for gameplay message handlers (journeyman move, weather flood)
- Board class and validator utilities working perfectly
- Message validation robust with Pydantic models
