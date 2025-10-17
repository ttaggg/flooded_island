/**
 * Home Page Component for Flooded Island
 * Landing page with Create New Game and Join Game functionality
 */

import { useState } from 'react';
import { generateRoomId, isValidRoomId, formatRoomId } from '../utils/roomId';

function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  /**
   * Handle Create New Game button click
   * Generates a new room ID and navigates to it
   */
  const handleCreateGame = () => {
    const newRoomId = generateRoomId();
    console.log(`🎮 Creating new game with room: ${newRoomId}`);
    window.location.href = `/?room=${newRoomId}`;
  };

  /**
   * Handle Join Game button click
   * Validates room code and navigates to the room
   */
  const handleJoinGame = () => {
    const formattedCode = formatRoomId(roomCode);

    if (!formattedCode) {
      setJoinError('Please enter a room code');
      return;
    }

    if (!isValidRoomId(formattedCode)) {
      setJoinError('Invalid room code format');
      return;
    }

    setJoinError(null);
    console.log(`🎮 Joining game with room: ${formattedCode}`);
    window.location.href = `/?room=${formattedCode}`;
  };

  /**
   * Handle room code input change
   * Format input and clear errors
   */
  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomId(e.target.value);
    setRoomCode(formatted);

    // Clear error when user starts typing
    if (joinError) {
      setJoinError(null);
    }
  };

  /**
   * Handle Enter key press in room code input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoinGame();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Flooded Island</h1>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            A strategic 2-player game where the Journeyman tries to survive 365 days while the
            Weather tries to trap them with floods.
          </p>
        </div>

        {/* Main Content Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Game Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-4">Create New Game</h2>
              <p className="text-white/80 mb-6">
                Start a new game and invite a friend to join with the room code.
              </p>
              <button
                onClick={handleCreateGame}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create Game
              </button>
            </div>
          </div>

          {/* Join Game Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🚪</div>
              <h2 className="text-2xl font-bold text-white mb-4">Join Game</h2>
              <p className="text-white/80 mb-6">Enter a room code to join an existing game.</p>

              {/* Room Code Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleRoomCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter room code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-center text-lg font-mono tracking-widest"
                />
                {joinError && <p className="text-red-300 text-sm mt-2">{joinError}</p>}
              </div>

              <button
                onClick={handleJoinGame}
                disabled={!roomCode}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Share the room code with your opponent to play together
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
