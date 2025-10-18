# Current Active Task

## Task
Task: Configurable Flood Count Setting

## Status
Completed ✅

## Description
Added a configurable setting for the maximum number of fields Weather can flood per turn (1-3 range, default 2), integrated into the game configuration screen alongside grid dimensions.

## Problem Solved
- **Issue**: Weather player was limited to flooding exactly 2 fields per turn, with no flexibility for different difficulty levels
- **Root Cause**: Hardcoded validation limit of 2 fields in backend validation logic
- **Impact**: Limited strategic depth and inability to adjust game difficulty

## Solution Implemented
- **Backend Models**: Added `max_flood_count` field to `GameRoom` model with 1-3 range validation
- **Backend Messages**: Updated `ConfigureGridMessage` to include `max_flood_count` parameter
- **Backend Validation**: Updated `validate_weather_flood()` to use dynamic max flood count
- **Backend Handlers**: Updated WebSocket handlers to process and store max flood count
- **Frontend Types**: Added `maxFloodCount` to `GameState` and `ConfigureGridMessage` interfaces
- **Frontend UI**: Added flood count selector to GameConfiguration component with quick selection buttons
- **Frontend Logic**: Updated TurnControls and GameBoard to use dynamic maxFloodCount
- **Frontend Hook**: Updated useGameState to handle maxFloodCount parameter

## Requirements Met
- ✅ Configurable flood count range (1-3 fields per turn)
- ✅ Default value of 2 maintains existing gameplay balance
- ✅ Integrated into game configuration screen alongside grid dimensions
- ✅ Journeyman player has authority to configure all game settings
- ✅ Frontend UI shows current selection and preview
- ✅ Backend validation enforces configured limits
- ✅ Dynamic UI updates based on configured maximum
- ✅ All linting checks pass
- ✅ TypeScript compilation with no errors
- ✅ Backward compatibility maintained

## Implementation Details

### Backend Changes
- **GameRoom Model**: Added `max_flood_count: int` field with `ge=1, le=3` constraints and default value 2
- **ConfigureGridMessage**: Added `max_flood_count: int` field with validation
- **Validator**: Updated `validate_weather_flood()` to accept and use dynamic max flood count parameter
- **WebSocket Handlers**: Updated `handle_configure_grid()` and `handle_flood()` to process max flood count
- **Serialization**: Added `maxFloodCount` to serialized room state

### Frontend Changes
- **GameConfiguration Component**: Added flood count selector with quick selection buttons (1, 2, 3)
- **TurnControls Component**: Updated to show dynamic selection counter and helper text
- **GameBoard Component**: Updated field selection logic to respect configured maximum
- **useGameState Hook**: Updated `configureGrid()` function to accept maxFloodCount parameter
- **Type Definitions**: Added `maxFloodCount` to `GameState` and `ConfigureGridMessage` interfaces

### UI Features
- **Quick Selection**: Buttons for 1, 2, and 3 fields with visual feedback
- **Number Input**: Manual input field with validation and clamping
- **Visual Preview**: Shows selected flood count in configuration preview
- **Dynamic Display**: Turn controls show current selection vs configured maximum
- **Role-Specific**: Journeyman sees active controls, Weather sees read-only preview

## Benefits
- **Strategic Depth**: More gameplay variety with different difficulty levels
- **Player Control**: Journeyman can adjust game difficulty before starting
- **Balanced Defaults**: Default value of 2 maintains existing gameplay balance
- **Clear UI**: Intuitive interface for configuring flood count
- **Consistent Design**: Matches existing configuration screen styling
- **Type Safety**: Full TypeScript support with proper validation

## Next Steps
Ready for the next task in the implementation plan.

## Notes
- Configurable flood count feature completed successfully
- All backend and frontend components updated to support dynamic limits
- Game configuration screen now includes flood count setting
- Backend validation properly enforces configured limits
- Frontend UI dynamically updates based on configuration
- All existing features and functionality preserved
