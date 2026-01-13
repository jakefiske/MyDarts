import React from 'react';
import { ConnectionState } from '../../hooks/useSignalR';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  connectionState,
  className = '' 
}) => {
  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'bg-green-500';
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'bg-yellow-500';
      case ConnectionState.Disconnected:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'Live';
      case ConnectionState.Connecting:
        return 'Connecting...';
      case ConnectionState.Reconnecting:
        return 'Reconnecting...';
      case ConnectionState.Disconnected:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        {connectionState === ConnectionState.Connected && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
        )}
      </div>
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
};