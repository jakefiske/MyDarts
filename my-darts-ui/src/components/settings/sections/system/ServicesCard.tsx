import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface ServiceStatuses {
  autodarts: boolean;
  dartsCaller: boolean;
}

interface ServicesCardProps {
  serviceStatuses: ServiceStatuses;
  loading: boolean;
  onServiceAction: (service: string, action: string) => void;
}

export const ServicesCard: React.FC<ServicesCardProps> = ({ 
  serviceStatuses, 
  loading, 
  onServiceAction 
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Services</h3>
      
      {/* MyDarts API */}
      <div className="mb-4 p-3 rounded" style={{ background: theme.backgrounds.baseHex }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold" style={{ color: theme.text.primary }}>MyDarts API</span>
            <span className="ml-2 text-xs" style={{ color: theme.text.muted }}>Port 5025</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#22C55E' }}>● Running</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onServiceAction('mydarts', 'restart')}
            disabled={loading}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
          >
            🔄 Restart
          </button>
          <button
            onClick={() => onServiceAction('mydarts', 'logs')}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
          >
            📋 Logs
          </button>
        </div>
      </div>

      {/* Autodarts */}
      <div className="mb-4 p-3 rounded" style={{ background: theme.backgrounds.baseHex }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold" style={{ color: theme.text.primary }}>Autodarts</span>
            <span className="ml-2 text-xs" style={{ color: theme.text.muted }}>Board Service</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: serviceStatuses.autodarts ? '#22C55E' : '#EF4444' }}>
              {serviceStatuses.autodarts ? '● Running' : '● Stopped'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onServiceAction('autodarts', 'start')}
            disabled={loading || serviceStatuses.autodarts}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ 
              background: theme.backgrounds.cardHex, 
              color: theme.text.primary,
              opacity: (loading || serviceStatuses.autodarts) ? 0.5 : 1
            }}
          >
            ▶️ Start
          </button>
          <button
            onClick={() => onServiceAction('autodarts', 'stop')}
            disabled={loading || !serviceStatuses.autodarts}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ 
              background: theme.backgrounds.cardHex, 
              color: theme.text.primary,
              opacity: (loading || !serviceStatuses.autodarts) ? 0.5 : 1
            }}
          >
            ⏹️ Stop
          </button>
          <button
            onClick={() => onServiceAction('autodarts', 'restart')}
            disabled={loading}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
          >
            🔄 Restart
          </button>
        </div>
      </div>

      {/* Darts-caller */}
      <div className="p-3 rounded" style={{ background: theme.backgrounds.baseHex }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold" style={{ color: theme.text.primary }}>Darts-caller</span>
            <span className="ml-2 text-xs" style={{ color: theme.text.muted }}>Port 8079</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: serviceStatuses.dartsCaller ? '#22C55E' : '#EF4444' }}>
              {serviceStatuses.dartsCaller ? '● Running' : '● Stopped'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onServiceAction('darts-caller', 'start')}
            disabled={loading || serviceStatuses.dartsCaller}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ 
              background: theme.backgrounds.cardHex, 
              color: theme.text.primary,
              opacity: (loading || serviceStatuses.dartsCaller) ? 0.5 : 1
            }}
          >
            ▶️ Start
          </button>
          <button
            onClick={() => onServiceAction('darts-caller', 'stop')}
            disabled={loading || !serviceStatuses.dartsCaller}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ 
              background: theme.backgrounds.cardHex, 
              color: theme.text.primary,
              opacity: (loading || !serviceStatuses.dartsCaller) ? 0.5 : 1
            }}
          >
            ⏹️ Stop
          </button>
          <button
            onClick={() => onServiceAction('darts-caller', 'restart')}
            disabled={loading}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
          >
            🔄 Restart
          </button>
        </div>
      </div>
    </div>
  );
};