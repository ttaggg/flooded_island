/**
 * Main App Component for Flooding Islands
 * Manages routing and game state
 */

import { useGameState } from './hooks/useGameState';
import { RoleSelection } from './components/RoleSelection';
import { GameConfiguration } from './components/GameConfiguration';
import { GameBoard } from './components/GameBoard';
import { GameStatus } from './types';

function App() {
  // For MVP, we'll use a hardcoded room ID
  // In future, this would come from routing or room creation
  const roomId = 'demo-room';

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
  } = useGameState({
    roomId,
    onError: (message) => {
      console.error('Game error:', message);
      // TODO: Show error toast/notification in UI
    },
  });

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
      />
    );
  }

  // Active Game Screen (ACTIVE status)
  if (gameState.gameStatus === GameStatus.ACTIVE) {
    return <GameBoard gameState={gameState} myRole={myRole} />;
  }

  // TODO: Game Over Screen (ENDED status)
  if (gameState.gameStatus === GameStatus.ENDED) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">Game Over</h1>
          <p className="text-white/80 mb-4">Winner: {gameState.winner || 'Unknown'}</p>
          <p className="text-white/60 text-sm">Game over screen (coming soon...)</p>
        </div>
      </div>
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
