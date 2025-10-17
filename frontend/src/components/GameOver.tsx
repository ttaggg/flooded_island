/**
 * Game Over Screen Component
 * Displays winner, final statistics, and Play Again button
 */

import { PlayerRole } from '../types';

interface GameOverProps {
  winner: PlayerRole;
  stats: Record<string, unknown>;
  onPlayAgain: () => void;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
}

/**
 * Individual stat card component
 */
function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

/**
 * Game Over screen component
 */
export function GameOver({ winner, stats, onPlayAgain }: GameOverProps) {
  // Extract statistics with safe defaults
  const daysSurvived = (stats.days_survived as number) ?? 0;
  const fieldsFlooded = (stats.fields_flooded as number) ?? 0;
  const fieldsDry = (stats.fields_dry as number) ?? 0;
  const totalFields = (stats.total_fields as number) ?? 0;

  // Winner-specific styling
  const isJourneymanWinner = winner === PlayerRole.JOURNEYMAN;
  const winnerColor = isJourneymanWinner ? 'text-yellow-300' : 'text-blue-300';
  const winnerEmoji = isJourneymanWinner ? '🎉' : '🌧️';
  const winnerTitle = isJourneymanWinner ? 'Journeyman Wins!' : 'Weather Wins!';
  const winnerMessage = isJourneymanWinner
    ? 'The Journeyman survived all 365 days!'
    : 'The Journeyman was trapped by the floods!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          {/* Winner Announcement */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{winnerEmoji}</div>
            <h1 className={`text-5xl font-bold mb-3 ${winnerColor} drop-shadow-lg`}>
              {winnerTitle}
            </h1>
            <p className="text-xl text-white/80">{winnerMessage}</p>
          </div>

          {/* Statistics Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-4">Final Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Days Survived" value={daysSurvived} icon="📅" />
              <StatCard label="Fields Flooded" value={fieldsFlooded} icon="💧" />
              <StatCard label="Fields Dry" value={fieldsDry} icon="🌤️" />
              <StatCard label="Total Fields" value={totalFields} icon="🗺️" />
            </div>
          </div>

          {/* Play Again Button */}
          <div className="flex justify-center">
            <button
              onClick={onPlayAgain}
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
            >
              🎮 Play Again
            </button>
          </div>

          {/* Footer Message */}
          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">Thank you for playing Flooding Islands!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
