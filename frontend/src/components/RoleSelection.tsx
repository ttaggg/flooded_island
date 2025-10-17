/**
 * Role Selection Screen Component
 * Allows players to choose between Journeyman and Weather roles.
 */

import { GameState, PlayerRole } from '../types';
import { ConnectionStatus } from './ConnectionStatus';

interface RoleSelectionProps {
  gameState: GameState | null;
  myRole: PlayerRole | null;
  availableRoles: PlayerRole[];
  canSelectRole: boolean;
  onSelectRole: (role: PlayerRole) => void;
  // Connection status props
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
  onClearError: () => void;
  opponentDisconnected: boolean;
}

interface RoleCardProps {
  title: string;
  icon: string;
  goal: string;
  actions: string;
  accentColor: string;
  isAvailable: boolean;
  isTaken: boolean;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: () => void;
}

/**
 * Individual role card component
 */
function RoleCard({
  title,
  icon,
  goal,
  actions,
  accentColor,
  isAvailable,
  isTaken,
  isSelected,
  canSelect,
  onSelect,
}: RoleCardProps) {
  const baseCardClasses =
    'relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl transition-all duration-300';

  // Determine card state classes
  let cardClasses = baseCardClasses;
  let buttonClasses = 'w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ';

  if (isSelected) {
    cardClasses += ` ring-4 ${accentColor === 'yellow' ? 'ring-yellow-400' : 'ring-blue-400'} scale-105`;
    buttonClasses += `${accentColor === 'yellow' ? 'bg-yellow-400' : 'bg-blue-500'} text-white`;
  } else if (isTaken) {
    cardClasses += ' opacity-60';
    buttonClasses += 'bg-gray-500 text-gray-300 cursor-not-allowed';
  } else if (isAvailable && canSelect) {
    cardClasses += ' hover:scale-105 hover:bg-white/15';
    buttonClasses += `${accentColor === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`;
  } else {
    buttonClasses += 'bg-gray-600 text-gray-400 cursor-not-allowed';
  }

  return (
    <div className={cardClasses}>
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
          <span className="text-2xl">✓</span>
        </div>
      )}

      {/* Icon */}
      <div className="text-6xl mb-4 text-center">{icon}</div>

      {/* Title */}
      <h3 className="text-3xl font-bold text-white mb-4 text-center">{title}</h3>

      {/* Goal */}
      <div className="mb-4">
        <p className="text-sm text-white/70 mb-1">Goal:</p>
        <p className="text-white font-semibold">{goal}</p>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <p className="text-sm text-white/70 mb-1">Actions:</p>
        <p className="text-white font-semibold">{actions}</p>
      </div>

      {/* Status Badge */}
      <div className="mb-4 text-center">
        {isSelected && (
          <span className="inline-block px-4 py-1 bg-green-500 text-white text-sm rounded-full">
            Your Role
          </span>
        )}
        {isTaken && !isSelected && (
          <span className="inline-block px-4 py-1 bg-gray-600 text-gray-300 text-sm rounded-full">
            Taken
          </span>
        )}
        {isAvailable && !isSelected && (
          <span className="inline-block px-4 py-1 bg-indigo-500 text-white text-sm rounded-full">
            Available
          </span>
        )}
      </div>

      {/* Select Button */}
      <button
        onClick={onSelect}
        disabled={!isAvailable || !canSelect || isSelected}
        className={buttonClasses}
      >
        {isSelected ? 'Selected' : isTaken ? 'Unavailable' : `Select ${title}`}
      </button>
    </div>
  );
}

/**
 * Main Role Selection component
 */
export function RoleSelection({
  gameState,
  myRole,
  availableRoles,
  canSelectRole,
  onSelectRole,
  connectionState,
  lastError,
  onClearError,
  opponentDisconnected,
}: RoleSelectionProps) {
  // Determine role states
  const journeymanTaken = gameState?.players.journeyman || false;
  const weatherTaken = gameState?.players.weather || false;

  const journeymanSelected = myRole === PlayerRole.JOURNEYMAN;
  const weatherSelected = myRole === PlayerRole.WEATHER;

  const journeymanAvailable = availableRoles.includes(PlayerRole.JOURNEYMAN);
  const weatherAvailable = availableRoles.includes(PlayerRole.WEATHER);

  // Status message
  const getStatusMessage = () => {
    if (myRole) {
      return (
        <div className="text-center animate-pulse">
          <p className="text-white text-xl">Waiting for opponent to join...</p>
          <div className="mt-3 flex justify-center gap-2">
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
      );
    }
    return <p className="text-white/80 text-lg text-center">Select a role to begin the game</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4 py-8">
      {/* Connection Status Component */}
      <ConnectionStatus
        connectionState={connectionState}
        gameState={gameState}
        myRole={myRole}
        lastError={lastError}
        onClearError={onClearError}
        opponentDisconnected={opponentDisconnected}
      />

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Flooding Islands</h1>
          <h2 className="text-3xl font-semibold text-white/90 mb-3">Choose Your Role</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Two players, two roles. The Journeyman must survive 365 days while the Weather tries to
            trap them.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-5xl mx-auto">
          {/* Journeyman Card */}
          <RoleCard
            title="Journeyman"
            icon="🚶"
            goal="Survive 365 days"
            actions="Move & Dry adjacent fields"
            accentColor="yellow"
            isAvailable={journeymanAvailable}
            isTaken={journeymanTaken}
            isSelected={journeymanSelected}
            canSelect={canSelectRole}
            onSelect={() => onSelectRole(PlayerRole.JOURNEYMAN)}
          />

          {/* Weather Card */}
          <RoleCard
            title="Weather"
            icon="🌧️"
            goal="Trap the Journeyman"
            actions="Flood up to 2 fields per turn"
            accentColor="blue"
            isAvailable={weatherAvailable}
            isTaken={weatherTaken}
            isSelected={weatherSelected}
            canSelect={canSelectRole}
            onSelect={() => onSelectRole(PlayerRole.WEATHER)}
          />
        </div>

        {/* Status Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
          {getStatusMessage()}
        </div>
      </div>
    </div>
  );
}
