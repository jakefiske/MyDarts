import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

interface HealthStatus {
  database: boolean;
  autodartsConfigured: boolean;
  autodartsConnected: boolean;
  spotifyConfigured: boolean;
  spotifyAuthenticated: boolean;
  dartsCallerConnected: boolean;
  servicesRunning: {
    mydarts: boolean;
    autodarts: boolean;
    dartsCaller: boolean;
  };
}

export const HealthCheckSection: React.FC = () => {
  const { theme } = useTheme();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/system/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = (status: boolean) => status ? '#22C55E' : '#EF4444';
  const getStatusIcon = (status: boolean) => status ? '✓' : '✗';

  const HealthItem: React.FC<{ label: string; status: boolean; description?: string }> = ({ label, status, description }) => (
    <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: theme.backgrounds.baseHex }}>
      <div className="flex-1">
        <div className="font-bold" style={{ color: theme.text.primary }}>{label}</div>
        {description && <div className="text-xs mt-1" style={{ color: theme.text.muted }}>{description}</div>}
      </div>
      <div 
        className="text-2xl font-bold px-3"
        style={{ color: getStatusColor(status) }}
      >
        {getStatusIcon(status)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>System Health</h2>
        <div className="p-4 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex, color: theme.text.muted }}>
          Loading health status...
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>System Health</h2>
        <div className="p-4 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex, color: '#EF4444' }}>
          Failed to load health status
        </div>
      </div>
    );
  }

  const allHealthy = health.database && 
    health.autodartsConfigured && 
    health.spotifyConfigured && 
    health.servicesRunning.mydarts &&
    health.servicesRunning.autodarts &&
    health.servicesRunning.dartsCaller;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>System Health</h2>
      
      {/* Overall Status */}
      <div 
        className="p-4 rounded-lg text-center"
        style={{ 
          background: theme.backgrounds.cardHex,
          borderLeft: `4px solid ${allHealthy ? '#22C55E' : '#F59E0B'}`
        }}
      >
        <div className="text-4xl mb-2">{allHealthy ? '✓' : '⚠️'}</div>
        <div className="text-xl font-bold" style={{ color: theme.text.primary }}>
          {allHealthy ? 'All Systems Operational' : 'Some Issues Detected'}
        </div>
        <div className="text-sm mt-1" style={{ color: theme.text.muted }}>
          Last checked: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Core Services */}
      <div className="p-4 rounded-lg space-y-2" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Core Services</h3>
        <HealthItem 
          label="Database" 
          status={health.database}
          description="SQLite database connection"
        />
        <HealthItem 
          label="MyDarts API" 
          status={health.servicesRunning.mydarts}
          description="Main application service"
        />
      </div>

      {/* Autodarts Integration */}
      <div className="p-4 rounded-lg space-y-2" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Autodarts Integration</h3>
        <HealthItem 
          label="Credentials Configured" 
          status={health.autodartsConfigured}
          description="Board ID and API Key saved"
        />
        <HealthItem 
          label="Autodarts Service" 
          status={health.servicesRunning.autodarts}
          description="Board service running"
        />
        <HealthItem 
          label="Darts-caller Service" 
          status={health.servicesRunning.dartsCaller}
          description="Throw detection bridge"
        />
        <HealthItem 
          label="Connection Active" 
          status={health.dartsCallerConnected}
          description="Receiving throw data"
        />
      </div>

      {/* Spotify Integration */}
      <div className="p-4 rounded-lg space-y-2" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Spotify Integration</h3>
        <HealthItem 
          label="API Configured" 
          status={health.spotifyConfigured}
          description="Client ID and Secret saved"
        />
        <HealthItem 
          label="Account Connected" 
          status={health.spotifyAuthenticated}
          description="Logged in to Spotify"
        />
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchHealth}
        className="w-full py-3 rounded-lg font-bold"
        style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
      >
        🔄 Refresh Status
      </button>
    </div>
  );
};