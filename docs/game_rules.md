# Game Rules - Flooded Island

## Overview
Two-player turn-based strategy game where adventurer tries to survive on an island while weather attempts to flood them.

## Setup
- **Grid**: Configurable rectangular grid (default: 10x10)
- **Initial State**: All fields are dry
- **Starting Position**: Adventurer starts on top-left corner
- **Roles**: Two players fill "adventurer" and "weather" roles

## Roles

### Adventurer (Day)
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
- **Goal**: Trap the adventurer so they cannot move
- **Flooding Action**:
  - Can flood 0 to **maxFloodCount** **dry fields** per turn (configurable: 1-3, default: 2)
  - Cannot flood already-flooded fields
  - Can flood any dry field on the grid
- **Turn Order**: Goes after adventurer

## Turn Dynamics

### Turn Sequence
1. **Adventurer's Turn** (Day):
   - Select destination field (adjacent, dry)
   - Can select/deselect choices
   - Press "End Turn" button to confirm
   - Adventurer moves, adjacent fields (N/S/E/W) are dried
   
2. **Weather's Turn** (Night):
   - Select 0 to maxFloodCount dry fields to flood
   - Can select/deselect choices
   - Press "End Turn" button to confirm
   - Selected fields become flooded

3. Repeat until game ends

## Win/Loss Conditions

### Adventurer Wins
- Survives for **365 days (turns)**

### Weather Wins
- Adventurer has no valid moves (all adjacent fields are flooded)

## Field States
- **Dry**: Yellow, adventurer can move here
- **Flooded**: Blue, adventurer cannot move here
- **Transition Animation**: Square rotates/flips when state changes

## Grid Configuration
- Can be adjusted before game starts
- Any player can modify grid size
- Configuration locked once game begins
- Only grid size is configurable (no other rule changes)

## Game Configuration
- **Grid Size**: Configurable rectangular grid (default: 10x10)
- **Max Flood Count**: Configurable maximum fields weather can flood per turn (1-3, default: 2)
- **Authority**: Adventurer player configures all game settings before start
- **Timing**: Set once during game configuration phase, cannot be changed mid-game

## Movement & Adjacency

### Movement Adjacency (8 directions)
```
■ ■ ■
■ A ■    A = Adventurer can move to any ■
■ ■ ■
```

### Drying Adjacency (4 directions)
```
  ■
■ A ■    Only these 4 fields are dried
  ■
```

## Multiplayer Setup
- Two players navigate to website
- Both roles start available
- First to join picks a role (that role becomes unavailable)
- Second player fills remaining role
- Game starts when both roles are filled
- No matchmaking system - players share link/room code
