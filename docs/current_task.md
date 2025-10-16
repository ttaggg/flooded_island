# Current Active Task

## Task
Task 2.3: Game Logic - Move Validation

## Phase
Phase 2: Core Backend Logic

## Status
Completed

## Description
Implement move validation logic for the Flooding Islands game. This module validates journeyman movement, weather flooding actions, detects trap conditions, and validates grid configuration.

## Requirements
- Python 3.13+ installed
- Create `game/validator.py` with validation functions
- Validate journeyman movement (adjacent dry fields only)
- Validate weather flooding (dry fields, not journeyman's position, max 2)
- Check if journeyman is trapped (no valid moves)
- Validate grid size configuration (3-10)

## Implementation Steps

### 1. Journeyman Movement Validation
- `validate_journeyman_move(board, current_pos, target_pos) -> tuple[bool, str]`
- Check target position is adjacent (8 directions)
- Check target position is within grid bounds
- Check target field is DRY
- Return validation result with error message if invalid

### 2. Weather Flooding Validation
- `validate_weather_flood(board, positions, journeyman_pos) -> tuple[bool, str]`
- Check positions count is 0-2
- Validate each position is within grid bounds
- Check fields are currently DRY
- Ensure no position is the journeyman's current position
- Return validation result with error message if invalid

### 3. Trap Detection
- `is_journeyman_trapped(board, journeyman_pos) -> bool`
- Get all adjacent positions (8 directions)
- Check if any adjacent field is DRY
- Return True if trapped, False otherwise

### 4. Grid Size Validation
- `validate_grid_size(size) -> tuple[bool, str]`
- Check size is between 3 and 10 (inclusive)
- Return validation result with error message if invalid

## Current Progress
- [x] Create `backend/game/validator.py` ✅
- [x] Implement `validate_journeyman_move` function ✅
  - Adjacency check using board.get_adjacent_positions()
  - Bounds validation using board.is_valid_position()
  - DRY field state check
  - Comprehensive error messages
- [x] Implement `validate_weather_flood` function ✅
  - Count validation (0-2 positions)
  - Bounds checking for all positions
  - DRY field state validation
  - Journeyman position exclusion
  - Detailed error messages for each case
- [x] Implement `is_journeyman_trapped` function ✅
  - Gets all adjacent positions (8 directions)
  - Checks for any available DRY fields
  - Returns boolean trap status
- [x] Implement `validate_grid_size` function ✅
  - Range validation (3-10 inclusive)
  - Clear error message with received value
- [x] Update `backend/game/__init__.py` ✅
  - Export all validator functions
  - Updated __all__ list
- [x] Test all validation functions ✅
  - Tested valid scenarios for all functions
  - Tested invalid scenarios with proper error detection
  - Tested edge cases (corners, boundaries, etc.)
  - All 36 test cases passed

## Acceptance Criteria
- ✅ Validator module created in `backend/game/validator.py`
- ✅ Journeyman move validation checks adjacency, bounds, and field state
- ✅ Weather flood validation enforces count limits and position rules
- ✅ Trap detection correctly identifies when journeyman has no moves
- ✅ Grid size validation enforces 3-10 range
- ✅ All functions return appropriate error messages
- ✅ Functions exported from `backend/game/__init__.py`
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
=== Testing Journeyman Move Validation ===
✓ Valid move to adjacent dry field (diagonal)
✓ Valid move to adjacent dry field (cardinal)
✓ Invalid move detected: not adjacent
✓ Invalid move detected: flooded field
✓ Invalid move detected: out of bounds
✓ Valid move from corner position
✓ Valid move from edge position

=== Testing Weather Flood Validation ===
✓ Valid flood with 2 positions
✓ Valid flood with 1 position
✓ Valid flood with 0 positions
✓ Invalid flood detected: too many positions
✓ Invalid flood detected: journeyman's position
✓ Invalid flood detected: already flooded
✓ Invalid flood detected: out of bounds
✓ Valid flood near edge with journeyman at corner

=== Testing Trap Detection ===
✓ Not trapped: all adjacent fields dry
✓ Not trapped: one adjacent field dry
✓ Trapped: all adjacent fields flooded
✓ Not trapped: corner position with dry fields
✓ Trapped: corner position with all adjacent fields flooded
✓ Not trapped: edge position with dry fields
✓ Trapped: edge position with all adjacent fields flooded

=== Testing Grid Size Validation ===
✓ Valid grid size: 3, 5, 7, 10
✓ Invalid size detected: too small (2)
✓ Invalid size detected: too large (11)
✓ Valid minimum boundary: 3
✓ Valid maximum boundary: 10
✓ Invalid size detected: zero
✓ Invalid size detected: negative

✅ ALL TESTS PASSED! (36 test cases)
```

## Next Task
Task 2.4: Game Logic - Turn Management

## Blockers/Notes
- No blockers
- All validation functions work correctly with existing Board class
- Functions return tuple[bool, str] for validation results, making error handling easy
- Trap detection is critical for weather win condition
- Validators ready for use in game state management and WebSocket handlers
