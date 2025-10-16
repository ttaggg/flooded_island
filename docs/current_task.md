# Current Active Task

## Task
Task 3.2: Message Handlers - Role Selection

## Phase
Phase 3: WebSocket Communication

## Status
Completed

## Description
Implement role selection message handler to assign player roles, validate role availability, update room state, broadcast changes to all players, and transition to configuration phase when both roles are filled.

## Requirements
- Handle `select_role` WebSocket messages
- Validate role availability (prevent duplicates)
- Assign roles to players via ConnectionManager
- Update room state with role assignments
- Support role switching before game starts
- Transition to CONFIGURING when both roles filled
- Broadcast updates to all connected players
- Comprehensive error handling

## Implementation Steps

### 1. Message Parsing and Validation
- Parse `SelectRoleMessage` from incoming WebSocket message
- Use Pydantic validation for role enum
- Catch and report ValidationError exceptions
- Return error for invalid role names

### 2. Role Availability Check
- Get current room state from room_manager
- Check if selected role already taken: `room.players[role.value] == True`
- Return error message if role unavailable
- Continue if role is free

### 3. Role Assignment
- Check if player already has a different role
- Free previous role if switching: `room.players[old_role] = False`
- Assign new role via `ConnectionManager.set_player_role()`
- Update room state: `room.players[new_role] = True`
- Log role assignment activity

### 4. State Transition Check
- Check if both roles now filled
- If `players["journeyman"] AND players["weather"]` both True:
  - Set `room.game_status = GameStatus.CONFIGURING`
  - Log transition event

### 5. Save and Broadcast
- Save updated room using `room_manager.update_room()`
- Serialize room state with `serialize_room_state()`
- Create `RoomStateMessage` with updated state
- Broadcast to all players via `connection_manager.broadcast()`
- All players receive synchronized state

## Current Progress
- [x] Import SelectRoleMessage from models.messages ✅
- [x] Import GameStatus from models.game ✅
- [x] Parse and validate select_role messages ✅
- [x] Check role availability in room state ✅
- [x] Handle role switching (free previous role) ✅
- [x] Assign role via ConnectionManager ✅
- [x] Update room.players dictionary ✅
- [x] Check both roles filled condition ✅
- [x] Transition to CONFIGURING status ✅
- [x] Save room state changes ✅
- [x] Broadcast updates to all players ✅
- [x] Error handling for taken roles ✅
- [x] Error handling for invalid roles ✅
- [x] Add logging for debugging ✅
- [x] Create comprehensive test suite ✅
- [x] All tests passing (5/5) ✅

## Acceptance Criteria
- ✅ Player can select journeyman role
- ✅ Player can select weather role
- ✅ Error returned if role already taken
- ✅ Player can switch roles before game starts
- ✅ Room state updates with role assignments
- ✅ Game transitions to CONFIGURING when both roles filled
- ✅ Broadcast sends updates to all connected players
- ✅ Both players receive synchronized state
- ✅ Invalid role names rejected
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
============================================================
ROLE SELECTION HANDLER TESTS
============================================================

=== Test 1: First Player Selects Journeyman Role ===
✅ PASSED: First player can select journeyman role

=== Test 2: Both Players Select Roles (Transition to CONFIGURING) ===
✅ PASSED: Game transitions to CONFIGURING when both roles filled

=== Test 3: Role Already Taken Error ===
✅ PASSED: Cannot take already-taken role

=== Test 4: Player Switches Roles ===
✅ PASSED: Player can switch roles

=== Test 5: Invalid Role Name ===
✅ PASSED: Invalid role names are rejected

============================================================
TEST SUMMARY: 5/5 tests passed
✅ ALL TESTS PASSED!
============================================================
```

## Key Implementation Details

### Bug Fix
**Critical Issue Discovered**: Missing `GameStatus` import was causing "Internal server error" exceptions during role selection. Fixed by adding `GameStatus` to imports from `models.game`.

### Message Flow
```
Player 1 connects → select_role(journeyman)
  → Role available? Yes
  → Assign to player 1
  → room.players["journeyman"] = True
  → Status: WAITING
  → Broadcast to all players

Player 2 connects → select_role(weather)
  → Role available? Yes
  → Assign to player 2
  → room.players["weather"] = True
  → Both roles filled! ✓
  → Status: CONFIGURING
  → Broadcast to all players
```

### Role Switching
Player can change roles during WAITING phase:
- Previous role automatically freed
- New role assigned
- Room state updated accordingly
- Other players can take freed role

### Edge Cases Handled
- ✅ Role already taken by another player
- ✅ Player switching between roles
- ✅ Invalid role names (Pydantic validation)
- ✅ Malformed messages
- ✅ Multiple simultaneous connections
- ✅ Broadcast synchronization

## Next Task
Task 3.3: Message Handlers - Game Configuration

## Blockers/Notes
- No blockers
- Role selection fully implemented and tested
- Broadcast mechanism working reliably
- State transitions verified (WAITING → CONFIGURING)
- Ready for grid configuration implementation
- All message types for roles working correctly
- Bug fix improved error handling robustness
