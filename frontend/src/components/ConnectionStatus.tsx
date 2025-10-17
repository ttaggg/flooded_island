/**
 * Connection Status Component
 * Displays real-time connection information, opponent status, and notifications
 */

import { useEffect, useState } from 'react';
import { GameState, PlayerRole, GameStatus } from '../types';
import { ConnectionState } from '../hooks/useWebSocket';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  gameState: GameState | null;
  myRole: PlayerRole | null;
  lastError: string | null;
  onClearError: () => void;
  opponentDisconnected: boolean;
}

interface NotificationState {
  type: 'opponent_disconnected' | 'opponent_reconnected' | 'error';
  message: string;
  timestamp: number;
}

/**
 * ConnectionStatus component that shows connection state, opponent status, and notifications
 */
export function ConnectionStatus({
  connectionState,
  gameState,
  myRole,
  lastError,
  onClearError,
  opponentDisconnected: hookOpponentDisconnected,
}: ConnectionStatusProps) {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  // Track opponent connection status from hook
  useEffect(() => {
    if (hookOpponentDisconnected && !opponentDisconnected) {
      // Opponent just disconnected
      setOpponentDisconnected(true);
      addNotification({
        type: 'opponent_disconnected',
        message: '⚠️ Opponent disconnected - waiting for reconnection...',
        timestamp: Date.now(),
      });
    } else if (!hookOpponentDisconnected && opponentDisconnected) {
      // Opponent reconnected
      setOpponentDisconnected(false);
      addNotification({
        type: 'opponent_reconnected',
        message: '✅ Opponent reconnected',
        timestamp: Date.now(),
      });
    }
  }, [hookOpponentDisconnected, opponentDisconnected]);

  // Handle error messages
  useEffect(() => {
    if (lastError) {
      addNotification({
        type: 'error',
        message: lastError,
        timestamp: Date.now(),
      });
    }
  }, [lastError]);

  /**
   * Add a new notification to the list
   */
  const addNotification = (notification: NotificationState) => {
    setNotifications((prev) => [...prev, notification]);
  };

  /**
   * Remove a notification by timestamp
   */
  const removeNotification = (timestamp: number) => {
    setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  };

  /**
   * Auto-dismiss notifications after 5 seconds (except errors)
   */
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.type !== 'error') {
        const timer = setTimeout(() => {
          removeNotification(notification.timestamp);
        }, 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications]);

  /**
   * Handle manual dismiss of error notifications
   */
  const handleDismissError = (timestamp: number) => {
    removeNotification(timestamp);
    onClearError();
  };

  /**
   * Get connection status display info
   */
  const getConnectionInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          dotColor: 'bg-green-400',
          text: 'Connected',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-100',
        };
      case 'connecting':
        return {
          dotColor: 'bg-yellow-400 animate-pulse',
          text: 'Connecting...',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-100',
        };
      case 'disconnected':
      case 'error':
        return {
          dotColor: 'bg-red-400',
          text: 'Reconnecting...',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-100',
        };
      default:
        return {
          dotColor: 'bg-gray-400',
          text: 'Unknown',
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-100',
        };
    }
  };

  /**
   * Get opponent status message
   */
  const getOpponentStatus = () => {
    if (!gameState) return null;

    // If opponent is disconnected (from hook), show waiting message
    if (hookOpponentDisconnected) {
      return 'Waiting for opponent to reconnect...';
    }

    if (gameState.gameStatus === GameStatus.WAITING) {
      const waitingForRole =
        (myRole === PlayerRole.JOURNEYMAN && !gameState.players.weather) ||
        (myRole === PlayerRole.WEATHER && !gameState.players.journeyman);

      if (waitingForRole) {
        return 'Waiting for opponent...';
      }
    }

    if (
      gameState.gameStatus === GameStatus.CONFIGURING ||
      gameState.gameStatus === GameStatus.ACTIVE
    ) {
      return 'Opponent connected';
    }

    return null;
  };

  const connectionInfo = getConnectionInfo();
  const opponentStatus = getOpponentStatus();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Connection Status Badge */}
      <div
        className={`${connectionInfo.bgColor} backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionInfo.dotColor}`}></div>
          <span className={`text-sm font-medium ${connectionInfo.textColor}`}>
            {connectionInfo.text}
          </span>
        </div>
      </div>

      {/* Opponent Status */}
      {opponentStatus && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
          <span className="text-white/80 text-sm font-medium">{opponentStatus}</span>
        </div>
      )}

      {/* Notifications */}
      {notifications.map((notification) => (
        <div
          key={notification.timestamp}
          className={`backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-white/20 animate-slide-in ${
            notification.type === 'error'
              ? 'bg-red-500/20 border-red-400/30'
              : notification.type === 'opponent_reconnected'
                ? 'bg-green-500/20 border-green-400/30'
                : 'bg-yellow-500/20 border-yellow-400/30'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-medium ${
                notification.type === 'error'
                  ? 'text-red-100'
                  : notification.type === 'opponent_reconnected'
                    ? 'text-green-100'
                    : 'text-yellow-100'
              }`}
            >
              {notification.message}
            </span>
            {notification.type === 'error' && (
              <button
                onClick={() => handleDismissError(notification.timestamp)}
                className="text-red-200 hover:text-red-100 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
