# Project Brief

## Project Name
Flooded Island

## Overview
A turn-based web game for two players where one player (journeyman) tries to survive on a flooding island while the other player (weather) attempts to trap them by flooding squares. The game is played on a configurable grid where the journeyman must strategically move and dry adjacent fields while the weather floods up to two fields per turn.

## Goals
- Create an engaging two-player online game with simple but strategic gameplay
- Implement real-time multiplayer using WebSockets
- Provide smooth, animated visual feedback for game actions
- Deliver a polished UI with indigo palette and soft gradients

## Key Features
- **Two Asymmetric Roles**:
  - **Journeyman**: Moves to adjacent dry fields, dries surrounding fields
  - **Weather**: Floods 0-2 dry fields per turn
- **Online Multiplayer**: Two players join via web browser, fill available roles
- **Configurable Grid**: Users can adjust grid size (default 10x10) before game starts
- **Win/Loss Conditions**:
  - Journeyman wins by surviving 365 turns (days)
  - Weather wins by trapping journeyman (no dry adjacent fields to move to)
- **Animated Squares**: Fields flip/rotate when dried or flooded
- **Real-time Updates**: WebSocket communication for instant game state synchronization

## Target Audience
Casual gamers who enjoy:
- Turn-based strategy games
- Quick online multiplayer sessions
- Simple rules with strategic depth
- Playing with friends (no matchmaking, direct room joining)

## Success Criteria
- Two players can join a game room and play a complete match
- All game rules are correctly enforced
- Smooth animations and responsive UI
- No desynchronization between players
- Game state persists during active sessions
- Works reliably in modern web browsers
