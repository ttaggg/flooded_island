# Current Active Task

## Task
Task 2.4: Game Logic - Win Conditions

## Phase
Phase 2: Core Backend Logic

## Status
Completed

## Description
Implement win condition checking and game statistics for the Flooding Islands game. This module checks both journeyman victory (365 turns survived) and weather victory (journeyman trapped), and calculates game statistics.

## Requirements
- Python 3.13+ installed
- Create `game/win_checker.py` with win condition functions
- Check journeyman victory (365 turns completed)
- Check weather victory (journeyman trapped)
- Calculate game statistics (days survived, fields flooded/dry)
- Main win condition checker that combines all checks

## Implementation Steps

### 1. Journeyman Victory Check
- `check_journeyman_victory(current_turn) -> bool`
- Check if current turn >= 365
- Return boolean result

### 2. Weather Victory Check
- `check_weather_victory(board, journeyman_pos) -> bool`
- Leverage existing `is_journeyman_trapped()` function
- Return True if journeyman has no valid moves

### 3. Statistics Calculation
- `calculate_statistics(board, current_turn) -> dict`
- Count days_survived (current turn)
- Count fields_flooded on board
- Count fields_dry on board
- Calculate total_fields (grid_size * grid_size)
- Return dictionary with all stats

### 4. Combined Win Condition Checker
- `check_win_condition(board, journeyman_pos, current_turn, current_role) -> tuple[Optional[PlayerRole], dict]`
- Check win conditions based on whose turn just completed
- Journeyman victory checked after journeyman's turn
- Weather victory checked after weather's turn
- Return tuple of (winner, statistics)

## Current Progress
- [x] Create `backend/game/win_checker.py` ✅
- [x] Implement `check_journeyman_victory` function ✅
  - Simple turn >= 365 check
  - Returns boolean result
- [x] Implement `check_weather_victory` function ✅
  - Uses existing `is_journeyman_trapped()` validator
  - Returns boolean result
- [x] Implement `calculate_statistics` function ✅
  - Counts flooded and dry fields
  - Includes days survived and total fields
  - Returns comprehensive dictionary
- [x] Implement `check_win_condition` function ✅
  - Checks appropriate win condition based on current role
  - Journeyman victory at turn 365 (after journeyman's turn)
  - Weather victory when trapped (after weather's turn)
  - Returns winner (or None) and statistics
- [x] Update `backend/game/__init__.py` ✅
  - Export all win checker functions
  - Updated __all__ list
- [x] Test all win condition functions ✅
  - Tested journeyman victory at various turns
  - Tested weather victory with trapped scenarios
  - Tested statistics calculation accuracy
  - Tested combined win condition checker
  - All 20 test cases passed

## Acceptance Criteria
- ✅ Win checker module created in `backend/game/win_checker.py`
- ✅ Journeyman victory correctly detects 365 turn completion
- ✅ Weather victory correctly detects trapped journeyman
- ✅ Statistics accurately count all field states and turns
- ✅ Combined checker validates win based on current role
- ✅ All functions return appropriate types
- ✅ Functions exported from `backend/game/__init__.py`
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
============================================================
TESTING WIN CONDITION CHECKER
============================================================

=== Testing Journeyman Victory ===
✓ Turn 364: No victory (correct)
✓ Turn 365: Victory! (correct)
✓ Turn 366: Victory! (correct)
✓ Turn 1: No victory (correct)

=== Testing Weather Victory ===
✓ Journeyman not trapped: all fields dry (correct)
✓ Journeyman trapped: all adjacent fields flooded (correct)
✓ Corner position: has dry adjacent fields (correct)
✓ Corner position trapped: all 3 adjacent fields flooded (correct)

=== Testing Statistics Calculation ===
✓ Fresh 5x5 board: 1 day, 25 dry, 0 flooded (correct)
✓ Board with 3 flooded: 15 days, 22 dry, 3 flooded (correct)
✓ 3x3 board: 100 days, 9 total fields (correct)
✓ 10x10 board with 25 flooded: 200 days, 75 dry, 25 flooded (correct)

=== Testing Combined Win Condition Checker ===
✓ Turn 10 (journeyman's turn): No winner yet (correct)
✓ Turn 365 (journeyman's turn): Journeyman wins! (correct)
✓ Turn 50 (weather's turn): Weather wins by trapping! (correct)
✓ Trapped on journeyman's turn: No winner detected (correct - weather hasn't acted yet)
✓ Turn 365 on weather's turn: No winner detected (correct - turn not complete)
✓ Turn 364 (journeyman's turn): No winner yet (correct)

✅ ALL TESTS PASSED!
============================================================
```

## Next Task
Task 2.5: Room Management

## Blockers/Notes
- No blockers
- All win condition checks work correctly with existing Board class
- Leverages existing `is_journeyman_trapped()` from validator module
- Win conditions properly check based on whose turn just completed
- Statistics provide comprehensive game state information
- Ready for integration into WebSocket game flow
