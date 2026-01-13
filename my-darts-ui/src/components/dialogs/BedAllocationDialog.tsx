import React, { useState } from 'react';
import { useTheme } from '../../hooks/useThemeContext';

interface BedAllocationDialogProps {
  bedNumber: number;
  throws: { segment: string, multiplier: number }[];
  onConfirm: (allocation: 'Number' | 'Beds' | 'Custom', customAllocations?: Record<number, string>) => void;
  onCancel: () => void;
}

export const BedAllocationDialog: React.FC<BedAllocationDialogProps> = ({
  bedNumber,
  throws,
  onConfirm,
  onCancel
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetAllocation, setPresetAllocation] = useState<'Number' | 'Beds'>('Number');
  
  // Custom allocations - keyed by multiplier
  const [customAllocations, setCustomAllocations] = useState<Record<number, string>>({
    1: 'Number',
    2: 'Number',
    3: 'Number'
  });

  // Detect which multipliers were actually thrown
  const hasSingle = throws.some(t => t.multiplier === 1);
  const hasDouble = throws.some(t => t.multiplier === 2);
  const hasTriple = throws.some(t => t.multiplier === 3);

  const setAllocation = (multiplier: number, value: string) => {
    setCustomAllocations(prev => ({ ...prev, [multiplier]: value }));
  };

  const handleConfirm = () => {
    if (mode === 'preset') {
      onConfirm(presetAllocation);
    } else {
      onConfirm('Custom', customAllocations);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
         style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="rounded-xl p-8 max-w-2xl w-full border-4"
           style={{
             background: `linear-gradient(to bottom right, ${theme.backgrounds.card.split(' ').map((c: string) => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
             borderColor: theme.categoryColors.beds.color
           }}>
        <h2 className="text-3xl font-bold mb-4 text-center"
            style={{
              color: theme.categoryColors.beds.color,
              fontFamily: theme.fonts.display,
              textShadow: `0 0 20px ${theme.categoryColors.beds.glow}`
            }}>
          🎯 BED DETECTED! 🎯
        </h2>
        
        <div className="mb-6">
          <p className="text-xl mb-2 text-center" style={{ color: theme.text.primary }}>
            All 3 darts hit <span className="font-bold" style={{ color: theme.stateColors.active.color }}>{bedNumber}</span>!
          </p>
        </div>

        {/* Mode selection */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setMode('preset')}
            className="flex-1 py-3 px-6 rounded-lg font-bold transition border-2"
            style={{
              background: mode === 'preset'
                ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
              borderColor: mode === 'preset' ? theme.stateColors.active.border : 'transparent',
              color: theme.text.primary,
              boxShadow: mode === 'preset' ? `0 0 20px ${theme.stateColors.active.glow}` : 'none'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'preset') {
                e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'preset') {
                e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
              }
            }}
          >
            Quick Allocation
          </button>
          <button
            onClick={() => setMode('custom')}
            className="flex-1 py-3 px-6 rounded-lg font-bold transition border-2"
            style={{
              background: mode === 'custom'
                ? `linear-gradient(to right, ${theme.stateColors.info.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
              borderColor: mode === 'custom' ? theme.stateColors.info.border : 'transparent',
              color: theme.text.primary,
              boxShadow: mode === 'custom' ? `0 0 20px ${theme.stateColors.info.border}44` : 'none'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'custom') {
                e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'custom') {
                e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
              }
            }}
          >
            Custom Allocation
          </button>
        </div>

        {mode === 'preset' ? (
          <>
            <p className="text-sm text-center mb-4" style={{ color: theme.text.muted }}>
              Choose allocation:
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPresetAllocation('Number')}
                className="w-full py-4 px-6 rounded-lg font-bold text-lg transition border-2"
                style={{
                  background: presetAllocation === 'Number'
                    ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                    : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                  borderColor: presetAllocation === 'Number' ? theme.stateColors.active.border : 'transparent',
                  color: theme.text.primary,
                  boxShadow: presetAllocation === 'Number' ? `0 0 20px ${theme.stateColors.active.glow}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (presetAllocation !== 'Number') {
                    e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (presetAllocation !== 'Number') {
                    e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
                  }
                }}
              >
                Mark on {bedNumber}
              </button>
              
              <button
                onClick={() => setPresetAllocation('Beds')}
                className="w-full py-4 px-6 rounded-lg font-bold text-lg transition border-2"
                style={{
                  background: presetAllocation === 'Beds'
                    ? theme.categoryColors.beds.color
                    : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                  borderColor: presetAllocation === 'Beds' ? theme.categoryColors.beds.color : 'transparent',
                  color: theme.text.primary,
                  boxShadow: presetAllocation === 'Beds' ? `0 0 20px ${theme.categoryColors.beds.glow}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (presetAllocation !== 'Beds') {
                    e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (presetAllocation !== 'Beds') {
                    e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
                  }
                }}
              >
                Mark 1 on Beds Category
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-center mb-4" style={{ color: theme.text.muted }}>
              Allocate each dart:
            </p>

            {/* Single allocation - only if thrown */}
            {hasSingle && (
              <div className="mb-4">
                <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Single {bedNumber}:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllocation(1, 'Number')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[1] === 'Number'
                        ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[1] === 'Number' ? theme.stateColors.active.border : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    {bedNumber}
                  </button>
                  <button
                    onClick={() => setAllocation(1, 'Skip')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[1] === 'Skip'
                        ? theme.borders.secondary
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[1] === 'Skip' ? theme.borders.secondary : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Double allocation - only if thrown */}
            {hasDouble && (
              <div className="mb-4">
                <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Double {bedNumber}:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllocation(2, 'Number')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[2] === 'Number'
                        ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[2] === 'Number' ? theme.stateColors.active.border : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    {bedNumber}
                  </button>
                  <button
                    onClick={() => setAllocation(2, 'Doubles')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[2] === 'Doubles'
                        ? theme.categoryColors.doubles.color
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[2] === 'Doubles' ? theme.categoryColors.doubles.color : 'transparent',
                      color: theme.text.primary,
                      boxShadow: customAllocations[2] === 'Doubles' ? `0 0 20px ${theme.categoryColors.doubles.glow}` : 'none'
                    }}
                  >
                    Doubles
                  </button>
                  <button
                    onClick={() => setAllocation(2, 'Skip')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[2] === 'Skip'
                        ? theme.borders.secondary
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[2] === 'Skip' ? theme.borders.secondary : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Triple allocation - only if thrown */}
            {hasTriple && (
              <div className="mb-6">
                <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Triple {bedNumber}:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllocation(3, 'Number')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[3] === 'Number'
                        ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[3] === 'Number' ? theme.stateColors.active.border : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    {bedNumber}
                  </button>
                  <button
                    onClick={() => setAllocation(3, 'Triples')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[3] === 'Triples'
                        ? theme.categoryColors.triples.color
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[3] === 'Triples' ? theme.categoryColors.triples.color : 'transparent',
                      color: theme.text.primary,
                      boxShadow: customAllocations[3] === 'Triples' ? `0 0 20px ${theme.categoryColors.triples.glow}` : 'none'
                    }}
                  >
                    Triples
                  </button>
                  <button
                    onClick={() => setAllocation(3, 'Skip')}
                    className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                    style={{
                      background: customAllocations[3] === 'Skip'
                        ? theme.borders.secondary
                        : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                      borderColor: customAllocations[3] === 'Skip' ? theme.borders.secondary : 'transparent',
                      color: theme.text.primary
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </>
        )}

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