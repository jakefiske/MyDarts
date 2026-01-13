import React, { useState } from 'react';
import { useTheme } from '../../hooks/useThemeContext';

interface AllocationDialogProps {
  throwSegment: string;  // e.g., "D14"
  throwValue: number;    // 14
  throwMultiplier: number; // 2
  gameType: number;
  includeDoubles: boolean;
  includeTriples: boolean;
  includeBeds: boolean;
  onConfirm: (segment: string, multiplier: number, value: number, allocation: string) => void;
  onCancel: () => void;
}

export const AllocationDialog: React.FC<AllocationDialogProps> = ({
  throwSegment,
  throwValue,
  throwMultiplier,
  includeDoubles,
  includeTriples,
  includeBeds,
  onConfirm,
  onCancel
}) => {
  const { theme } = useTheme();
  const [allocation, setAllocation] = useState<string>('Number');

  // Determine available allocations
  const availableAllocations: string[] = ['Number'];
  
  if (throwMultiplier === 2 && includeDoubles) {
    availableAllocations.push('Doubles');
  }
  if (throwMultiplier === 3 && includeTriples) {
    availableAllocations.push('Triples');
  }
  // Beds would need special detection (all 3 in same wedge)
  
  const handleConfirm = () => {
    onConfirm(throwSegment, throwMultiplier, throwValue, allocation);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
         style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="rounded-xl p-8 max-w-md w-full border-4"
           style={{
             background: `linear-gradient(to bottom right, ${theme.backgrounds.card.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
             borderColor: theme.stateColors.info.border
           }}>
        <h2 className="text-2xl font-bold mb-4"
            style={{ 
              color: theme.stateColors.info.border,
              fontFamily: theme.fonts.display
            }}>
          Choose Allocation
        </h2>
        
        <div className="mb-6">
          <p className="text-xl mb-2" style={{ color: theme.text.primary }}>
            Throw: <span className="font-bold" style={{ color: theme.stateColors.active.color }}>{throwSegment}</span>
          </p>
          <p className="text-sm" style={{ color: theme.text.muted }}>
            Choose how to allocate this throw:
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {availableAllocations.map(option => (
            <button
              key={option}
              onClick={() => setAllocation(option)}
              className="w-full py-4 px-6 rounded-lg font-bold text-lg transition border-2"
              style={{
                background: allocation === option
                  ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                  : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                borderColor: allocation === option
                  ? theme.stateColors.active.border
                  : 'transparent',
                color: theme.text.primary,
                boxShadow: allocation === option
                  ? `0 0 20px ${theme.stateColors.active.glow}`
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (allocation !== option) {
                  e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
                }
              }}
              onMouseLeave={(e) => {
                if (allocation !== option) {
                  e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
                }
              }}
            >
              {option === 'Number' ? `Mark on ${throwValue}` : `Mark on ${option}`}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-bold transition border-2"
            style={{
              background: `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
              borderColor: theme.borders.secondary,
              color: theme.text.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`}
            onMouseLeave={(e) => e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-lg font-bold transition border-2"
            style={{
              background: `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`,
              borderColor: theme.stateColors.active.border,
              color: theme.text.primary,
              boxShadow: `0 0 20px ${theme.stateColors.active.glow}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};