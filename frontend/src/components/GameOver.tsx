/**
 * Game Over Screen Component for Flooded Island
 *
 * Displays the end-game screen with winner announcement, final statistics,
 * and a Play Again button. Provides visual feedback for both victory conditions
 * with role-specific styling and comprehensive game statistics.
 *
 * Features:
 * - Winner-specific styling and messaging
 * - Comprehensive statistics display (days survived, fields flooded, etc.)
 * - Play Again functionality with new room generation
 * - Responsive grid layout for statistics
 * - Glass morphism design consistent with app theme
 */

import { PlayerRole } from '../types';

/**
 * Props for the GameOver component
 */
interface GameOverProps {
  /** The winning player role */
  winner: PlayerRole;
  /** Game statistics object from backend */
  stats: Record<string, unknown>;
  /** Function called when Play Again button is clicked */
  onPlayAgain: () => void;
}

/**
 * Props for the StatCard component
 */
interface StatCardProps {
  /** Display label for the statistic */
  label: string;
  /** Value to display (number or string) */
  value: number | string;
  /** Emoji icon for the statistic */
  icon: string;
}

/**
 * Individual stat card component for displaying game statistics
 *
 * Renders a single statistic with icon, value, and label in a
 * glass morphism card design.
 *
 * @param props - Component props
 * @returns JSX element representing a statistic card
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
 *
 * Renders the complete end-game interface with winner announcement,
 * statistics grid, and Play Again functionality. Handles both victory
 * conditions with appropriate styling and messaging.
 *
 * @param props - Component props
 * @returns JSX element representing the game over screen
 */
export function GameOver({ winner, stats, onPlayAgain }: GameOverProps) {
  // Extract statistics with safe defaults
  const daysSurvived = (stats.days_survived as number) ?? 0;
  const fieldsFlooded = (stats.fields_flooded as number) ?? 0;
  const fieldsDry = (stats.fields_dry as number) ?? 0;
  const totalFields = (stats.total_fields as number) ?? 0;

  // Winner-specific styling
  const isAdventurerWinner = winner === PlayerRole.ADVENTURER;
  const winnerColor = isAdventurerWinner ? 'text-yellow-300' : 'text-blue-300';
  const winnerEmoji = isAdventurerWinner ? '🎉' : '🌧️';
  const winnerTitle = isAdventurerWinner ? 'Adventurer Wins!' : 'Weather Wins!';
  const winnerMessage = isAdventurerWinner
    ? 'The Adventurer survived all 365 days!'
    : 'The Adventurer was trapped by the floods!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center px-4 py-8">
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
            <p className="text-white/50 text-sm">Thank you for playing Flooded Island!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
