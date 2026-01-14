import React from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { AutodartsBridge } from '../../AutodartsBridge';

export const CamerasSection: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Camera Integration</h2>
      
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
          Configure your Autodarts camera system to automatically detect throws.
        </p>
        <AutodartsBridge />
      </div>

      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>How It Works</h3>
        <ul className="text-sm space-y-1" style={{ color: theme.text.muted }}>
          <li>• Configure your darts-caller URL above</li>
          <li>• Toggle the bridge on during games</li>
          <li>• Throws are automatically detected</li>
        </ul>
      </div>
    </div>
  );
};