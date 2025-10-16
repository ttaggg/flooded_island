# Game Rules - Flooding Islands

## Overview
Two-player turn-based strategy game where journeyman tries to survive on an island while weather attempts to flood them.

## Setup
- **Grid**: Configurable NxN grid (default: 10x10)
- **Initial State**: All fields are dry
- **Starting Position**: Journeyman starts on top-left corner
- **Roles**: Two players fill "journeyman" and "weather" roles

## Roles

### Journeyman (Day)
- **Goal**: Survive for 365 days (turns)
- **Movement**: 
  - Moves to any adjacent field (8 directions: vertical, horizontal, diagonal)
  - Can only move to **dry fields**
  - Cannot move to flooded fields
- **Drying Action**:
  - After moving, automatically dries adjacent fields (4 directions: vertical and horizontal only, not diagonal)
- **Turn Order**: Goes first, then alternates with weather
- **Loses When**: No dry adjacent fields available (trapped)

### Weather (Night)
- **Goal**: Trap the journeyman so they cannot move
- **Flooding Action**:
  - Can flood 0, 1, or 2 **dry fields** per turn
  - Cannot flood already-flooded fields
  - Can flood any dry field on the grid
- **Turn Order**: Goes after journeyman

## Turn Dynamics

### Turn Sequence
1. **Journeyman's Turn** (Day):
   - Select destination field (adjacent, dry)
   - Can select/deselect choices
   - Press "End Turn" button to confirm
   - Journeyman moves, adjacent fields (N/S/E/W) are dried
   
2. **Weather's Turn** (Night):
   - Select 0-2 dry fields to flood
   - Can select/deselect choices
   - Press "End Turn" button to confirm
   - Selected fields become flooded

3. Repeat until game ends

## Win/Loss Conditions

### Journeyman Wins
- Survives for **365 days (turns)**

### Weather Wins
- Journeyman has no valid moves (all adjacent fields are flooded)

## Field States
- **Dry**: Yellow, journeyman can move here
- **Flooded**: Blue, journeyman cannot move here
- **Transition Animation**: Square rotates/flips when state changes

## Grid Configuration
- Can be adjusted before game starts
- Any player can modify grid size
- Configuration locked once game begins
- Only grid size is configurable (no other rule changes)

## Movement & Adjacency

### Movement Adjacency (8 directions)
```
■ ■ ■
■ J ■    J = Journeyman can move to any ■
■ ■ ■
```

### Drying Adjacency (4 directions)
```
  ■
■ J ■    Only these 4 fields are dried
  ■
```

## Multiplayer Setup
- Two players navigate to website
- Both roles start available
- First to join picks a role (that role becomes unavailable)
- Second player fills remaining role
- Game starts when both roles are filled
- No matchmaking system - players share link/room code

