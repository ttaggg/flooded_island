/**
 * Main App Component for Flooding Islands
 * Manages routing and game state
 */

import { useGameState } from './hooks/useGameState';
import { RoleSelection } from './components/RoleSelection';
import { GameConfiguration } from './components/GameConfiguration';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { GameStatus } from './types';

function App() {
  /**
   * Get room ID from URL query parameter, or generate a new one if not present.
   * URL format: /?room=ABC123
   */
  const getRoomIdFromUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');

    if (roomFromUrl && roomFromUrl.length > 0) {
      return roomFromUrl;
    }

    // Generate new room ID if not in URL
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const newRoomId = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');

    // Update URL without reloading
    window.history.replaceState(null, '', `/?room=${newRoomId}`);

    return newRoomId;
  };

  const roomId = getRoomIdFromUrl();

  // Connect to game state
  const {
    gameState,
    myRole,
    availableRoles,
    canSelectRole,
    selectRole,
    canConfigureGrid,
    configureGrid,
    connectionState,
    move,
    addFloodPosition,
    removeFloodPosition,
    selectedFloodPositions,
    canMove,
    canFlood,
    isMyTurn,
    submitFlood,
    clearFloodSelection,
    gameStats,
    lastError,
    clearError,
    opponentDisconnected,
  } = useGameState({
    roomId,
    onError: (message) => {
      console.error('Game error:', message);
      // TODO: Show error toast/notification in UI
    },
  });

  /**
   * Handle Play Again button - generate new room ID and navigate to it.
   * This creates a fresh game room.
   */
  const handlePlayAgain = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const newRoomId = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');

    console.log(`🎮 Starting new game with room: ${newRoomId}`);
    window.location.href = `/?room=${newRoomId}`;
  };

  // Show connection status while connecting
  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-white text-2xl mb-4">Connecting to game...</div>
          <div className="flex justify-center gap-2">
            <div
              className="w-3 h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Show disconnected state
  if (connectionState === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-white text-2xl mb-4">Connection Lost</div>
          <p className="text-white/80">Attempting to reconnect...</p>
        </div>
      </div>
    );
  }

  // Render based on game status
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-white text-2xl">Loading game state...</div>
        </div>
      </div>
    );
  }

  // Role Selection Screen (WAITING status)
  if (gameState.gameStatus === GameStatus.WAITING) {
    return (
      <RoleSelection
        gameState={gameState}
        myRole={myRole}
        availableRoles={availableRoles}
        canSelectRole={canSelectRole}
        onSelectRole={selectRole}
        connectionState={connectionState}
        lastError={lastError}
        onClearError={clearError}
        opponentDisconnected={opponentDisconnected}
      />
    );
  }

  // Game Configuration Screen (CONFIGURING status)
  if (gameState.gameStatus === GameStatus.CONFIGURING) {
    return (
      <GameConfiguration
        myRole={myRole}
        canConfigureGrid={canConfigureGrid}
        onConfigureGrid={configureGrid}
        connectionState={connectionState}
        gameState={gameState}
        lastError={lastError}
        onClearError={clearError}
        opponentDisconnected={opponentDisconnected}
      />
    );
  }

  // Active Game Screen (ACTIVE status)
  if (gameState.gameStatus === GameStatus.ACTIVE) {
    return (
      <GameBoard
        gameState={gameState}
        myRole={myRole}
        move={move}
        addFloodPosition={addFloodPosition}
        removeFloodPosition={removeFloodPosition}
        selectedFloodPositions={selectedFloodPositions}
        canMove={canMove}
        canFlood={canFlood}
        isMyTurn={isMyTurn}
        submitFlood={submitFlood}
        clearFloodSelection={clearFloodSelection}
        connectionState={connectionState}
        lastError={lastError}
        onClearError={clearError}
        opponentDisconnected={opponentDisconnected}
      />
    );
  }

  // Game Over Screen (ENDED status)
  if (gameState.gameStatus === GameStatus.ENDED) {
    return (
      <GameOver winner={gameState.winner!} stats={gameStats || {}} onPlayAgain={handlePlayAgain} />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Flooding Islands</h1>
        <p className="text-white/80">Unknown game state</p>
      </div>
    </div>
  );
}

export default App;
