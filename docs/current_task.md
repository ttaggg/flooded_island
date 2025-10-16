# Current Active Task

## Task
Task 2.2: Game Logic - Board Management

## Phase
Phase 2: Core Backend Logic

## Status
Completed

## Description
Implement the core board management logic for the Flooding Islands game. This module handles grid initialization, field state management, position validation, and adjacency calculations for both movement (8 directions) and drying (4 directions).

## Requirements
- Python 3.13+ installed
- Create `game/board.py` with Board class
- Initialize grid with configurable size (3-10)
- Implement field state get/set operations
- Validate position bounds
- Calculate adjacent positions for 8 directions (movement) and 4 directions (drying)
- Use existing Position and FieldState models from `models/game.py`

## Implementation Steps

### 1. Create Board Class
- Initialize with grid_size (3-10)
- Validate grid size in constructor
- Create NxN grid with all fields initially DRY
- Store grid as `list[list[FieldState]]`

### 2. Field State Management
- `get_field_state(position: Position) -> FieldState` - Get state at position
- `set_field_state(position: Position, state: FieldState)` - Update field state
- Validate positions before accessing grid

### 3. Position Validation
- `is_valid_position(position: Position) -> bool` - Check bounds
- Ensure 0 <= x < grid_size and 0 <= y < grid_size

### 4. Adjacency Calculation
- `get_adjacent_positions(position, include_diagonals=True) -> list[Position]`
- 8 directions (N, NE, E, SE, S, SW, W, NW) when include_diagonals=True
- 4 directions (N, E, S, W) when include_diagonals=False
- Filter out positions outside grid bounds
- Handle edge cases (corners, edges with fewer neighbors)

## Current Progress
- [x] Create `backend/game/board.py` ✅
- [x] Implement Board class with grid initialization ✅
  - Grid size validation (3-10)
  - Initialize all fields as DRY
- [x] Implement `get_field_state` method ✅
  - Position validation
  - Return FieldState at position
- [x] Implement `set_field_state` method ✅
  - Position validation
  - Update field state
- [x] Implement `is_valid_position` method ✅
  - Bounds checking (0 <= x,y < grid_size)
- [x] Implement `get_adjacent_positions` method ✅
  - 8-directional support (include_diagonals=True)
  - 4-directional support (include_diagonals=False)
  - Proper bounds checking before creating Position objects
  - Handles corners, edges, and center positions correctly
- [x] Create `backend/game/__init__.py` ✅
  - Export Board class
- [x] Set up virtual environment and install dependencies ✅
  - Installed FastAPI, Pydantic, and other requirements
- [x] Verify implementation ✅
  - All tests passed successfully
  - No linter errors

## Acceptance Criteria
- ✅ Board class created in `backend/game/board.py`
- ✅ Grid initializes correctly with all DRY fields
- ✅ Grid size validation enforces 3-10 range
- ✅ Field states can be get/set properly with position validation
- ✅ Position validation works for valid and invalid positions
- ✅ 8-directional adjacency returns correct neighbors (8 for center, 3 for corner, 5 for edge)
- ✅ 4-directional adjacency returns correct neighbors (4 for center, 2 for corner, 3 for edge)
- ✅ Edge/corner positions return correct number of neighbors
- ✅ No linter errors
- ✅ Proper error handling for out-of-bounds positions
- ✅ Proper handling of Position model validation (x,y >= 0)

## Test Results
```
✓ Grid initialized with size 5
✓ Field at (0,0) is dry
✓ Field at (2,2) changed to flooded
✓ Position (4,4) is valid: True
✓ Position (5,5) is valid: False
✓ 8-directional adjacency from center (2,2): 8 neighbors
✓ 4-directional adjacency from center (2,2): 4 neighbors
✓ 8-directional adjacency from corner (0,0): 3 neighbors
✓ 4-directional adjacency from corner (0,0): 2 neighbors
✓ Grid size validation works
✓ 8-directional adjacency from edge (0,2): 5 neighbors
✓ 4-directional adjacency from edge (0,2): 3 neighbors

✅ All tests passed!
```

## Next Task
Task 2.3: Game Logic - Move Validation

## Blockers/Notes
- No blockers
- Virtual environment created and dependencies installed
- Position model validates x,y >= 0, so adjacency calculation checks bounds before creating Position objects
- Grid coordinates: (0,0) is top-left, (n-1, n-1) is bottom-right
- Implementation ready for use in move validation and other game logic
