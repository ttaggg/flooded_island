# Current Active Task

## Task
Task 2.5: Room Management

## Phase
Phase 2: Core Backend Logic

## Status
Completed

## Description
Implement in-memory room storage and lifecycle management with automatic cleanup for the Flooding Islands game. This module manages game rooms including creation, retrieval, updates, deletion, and background cleanup of ended games.

## Requirements
- Python 3.13+ installed
- Create `game/room_manager.py` with RoomManager class
- In-memory room storage (dictionary)
- Unique room ID generation (6-character codes)
- Thread-safe room operations (create, get, update, delete)
- Automatic cleanup of rooms 5 minutes after game end
- Background cleanup task integration

## Implementation Steps

### 1. Room Storage & ID Generation
- `RoomManager` class with in-memory dictionary storage
- `_generate_room_id()` method with collision detection
- Character set: uppercase letters + digits (excluding confusing 0/O, 1/I)
- 6-character room IDs (e.g., "A3X9K2")

### 2. Core Room Operations
- `create_room() -> GameRoom`: Creates new room with unique ID
- `get_room(room_id) -> Optional[GameRoom]`: Retrieves room by ID
- `update_room(room_id, room)`: Updates room state
- `delete_room(room_id)`: Removes room from storage
- `room_exists(room_id) -> bool`: Checks if room exists

### 3. Thread Safety
- `asyncio.Lock()` for thread-safe dictionary access
- Lock during create/update/delete operations
- Safe for concurrent WebSocket connections

### 4. Cleanup Logic
- `cleanup_old_rooms() -> int`: Removes rooms ended >5 minutes ago
- Checks `ended_at` timestamp against threshold
- Returns count of deleted rooms

### 5. Background Cleanup Task
- `start_cleanup_task()`: Async background task
- Runs every 60 seconds
- Logs cleanup activity
- Integrated into FastAPI lifespan

## Current Progress
- [x] Create `backend/game/room_manager.py` ✅
- [x] Implement RoomManager class with storage ✅
  - In-memory dictionary: `rooms: dict[str, GameRoom]`
  - asyncio.Lock for thread safety
- [x] Implement room ID generation ✅
  - 6-character alphanumeric codes
  - Character set excludes confusing chars (0/O, 1/I)
  - Collision detection with retry logic
- [x] Implement core room operations ✅
  - create_room: Creates new room with unique ID
  - get_room: Retrieves room by ID
  - update_room: Updates room state with validation
  - delete_room: Removes room from storage
  - room_exists: Checks room existence
- [x] Implement cleanup logic ✅
  - cleanup_old_rooms: Removes rooms ended >5 minutes ago
  - Checks ended_at timestamp against 300-second threshold
  - Returns count of deleted rooms
- [x] Implement background cleanup task ✅
  - start_cleanup_task: Async task running every 60 seconds
  - Logs cleanup activity
  - Handles errors gracefully
- [x] Export RoomManager from `backend/game/__init__.py` ✅
  - Added RoomManager and room_manager to exports
  - Updated module docstring
- [x] Integrate cleanup task into FastAPI ✅
  - Updated main.py lifespan handler
  - Starts cleanup task at startup
  - Cancels cleanup task at shutdown
- [x] Test all functionality ✅
  - Room creation with unique IDs
  - Room retrieval (existing and non-existent)
  - Room updates and deletion
  - Cleanup of old rooms (>5 minutes)
  - Active games not cleaned up
  - Concurrent room access
  - All 7 test suites passed

## Acceptance Criteria
- ✅ Room manager created in `backend/game/room_manager.py`
- ✅ RoomManager class with in-memory storage
- ✅ Unique room ID generation with collision detection
- ✅ Thread-safe room operations (create, get, update, delete, exists)
- ✅ Cleanup logic removes rooms >5 minutes after end
- ✅ Background cleanup task runs every 60 seconds
- ✅ Cleanup task integrated into FastAPI lifespan
- ✅ All functions properly typed and documented
- ✅ Exported from `backend/game/__init__.py`
- ✅ No linter errors
- ✅ Comprehensive test coverage

## Test Results
```
============================================================
TESTING ROOM MANAGER
============================================================

=== Testing Room Creation ===
✓ Created 3 rooms with unique IDs: T5QU4G, CPZC5V, SX6RAK
✓ Room ID format validated (6 chars from allowed set)
✓ Initial room state validated

=== Testing Room Retrieval ===
✓ Successfully retrieved existing room: 92D65C
✓ Non-existent room returns None

=== Testing Room Exists ===
✓ Existing room detected: MW8V67
✓ Non-existent room not detected

=== Testing Room Update ===
✓ Successfully updated room U35VFA
  - Status: active
  - Turn: 10
  - Players: {'journeyman': True, 'weather': True}
✓ Updating non-existent room raises KeyError

=== Testing Room Deletion ===
✓ Room FCC73B created
✓ Room FCC73B successfully deleted
✓ Deleting non-existent room doesn't raise error

=== Testing Room Cleanup ===
Created 3 rooms:
  - WMJVJK: Ended 6 minutes ago
  - WPY3WR: Ended 3 minutes ago
  - 8Y649K: Still active
✓ Cleanup deleted 1 old room(s)
✓ Room WMJVJK (6 min old): DELETED ✓
✓ Room WPY3WR (3 min old): KEPT ✓
✓ Room 8Y649K (active): KEPT ✓

=== Testing Concurrent Access ===
✓ Created 5 rooms concurrently with unique IDs
✓ Updated 5 rooms concurrently
✓ All updates verified

✅ ALL TESTS PASSED!
============================================================
```

## Next Task
Task 3.1: WebSocket Connection Handler

## Blockers/Notes
- No blockers
- Room manager is thread-safe for concurrent WebSocket connections
- Singleton `room_manager` instance provided for easy import
- Background cleanup task automatically manages stale rooms
- Ready for WebSocket integration in Phase 3
- Room IDs are easy to share and type (6 uppercase chars/digits)
