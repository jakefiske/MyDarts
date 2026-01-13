import React, { useState } from 'react';
import { useTheme } from '../../hooks/useThemeContext';

interface ShanghaiAllocationDialogProps {
  shanghaiNumber: number;
  onConfirm: (singleAllocation: string, doubleAllocation: string, tripleAllocation: string) => void;
  onCancel: () => void;
}

export const ShanghaiAllocationDialog: React.FC<ShanghaiAllocationDialogProps> = ({
  shanghaiNumber,
  onConfirm,
  onCancel
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'individual' | 'bed'>('individual');
  const [singleAlloc, setSingleAlloc] = useState<string>('Number');
  const [doubleAlloc, setDoubleAlloc] = useState<string>('Number');
  const [tripleAlloc, setTripleAlloc] = useState<string>('Number');

  const handleConfirm = () => {
    if (mode === 'bed') {
      onConfirm('Beds', 'Beds', 'Beds');
    } else {
      onConfirm(singleAlloc, doubleAlloc, tripleAlloc);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
         style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="rounded-xl p-8 max-w-2xl w-full border-4"
           style={{
             background: `linear-gradient(to bottom right, ${theme.backgrounds.card.split(' ').map((c: string) => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
             borderColor: theme.stateColors.winner.border
           }}>
        <h2 className="text-4xl font-bold mb-4 text-center"
            style={{
              color: theme.stateColors.winner.border,
              fontFamily: theme.fonts.display,
              textShadow: `0 0 30px ${theme.stateColors.winner.border}aa`
            }}>
          🔥 SHANGHAI! 🔥
        </h2>
        
        <div className="mb-6">
          <p className="text-2xl mb-2 text-center" style={{ color: theme.text.primary }}>
            <span className="font-bold" style={{ color: theme.stateColors.active.color }}>+100 POINTS!</span>
          </p>
          <p className="text-xl mb-4 text-center" style={{ color: theme.text.primary }}>
            S{shanghaiNumber} + D{shanghaiNumber} + T{shanghaiNumber}
          </p>
        </div>

        {/* Mode selection */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setMode('individual')}
            className="flex-1 py-3 px-6 rounded-lg font-bold transition border-2"
            style={{
              background: mode === 'individual'
                ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
              borderColor: mode === 'individual' ? theme.stateColors.active.border : 'transparent',
              color: theme.text.primary,
              boxShadow: mode === 'individual' ? `0 0 20px ${theme.stateColors.active.glow}` : 'none'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'individual') {
                e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'individual') {
                e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
              }
            }}
          >
            Individual Allocation
          </button>
          <button
            onClick={() => setMode('bed')}
            className="flex-1 py-3 px-6 rounded-lg font-bold transition border-2"
            style={{
              background: mode === 'bed'
                ? theme.categoryColors.beds.color
                : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
              borderColor: mode === 'bed' ? theme.categoryColors.beds.color : 'transparent',
              color: theme.text.primary,
              boxShadow: mode === 'bed' ? `0 0 20px ${theme.categoryColors.beds.glow}` : 'none'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'bed') {
                e.currentTarget.style.background = `${theme.backgrounds.card.split(' ')[0].replace('from-', '')}bb`;
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'bed') {
                e.currentTarget.style.background = `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`;
              }
            }}
          >
            🎯 Use as BED
          </button>
        </div>

        {mode === 'individual' ? (
          <>
            <p className="text-sm text-center mb-4" style={{ color: theme.text.muted }}>
              Allocate each dart:
            </p>

            {/* Single allocation */}
            <div className="mb-4">
              <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Single {shanghaiNumber}:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSingleAlloc('Number')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: singleAlloc === 'Number'
                      ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: singleAlloc === 'Number' ? theme.stateColors.active.border : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  {shanghaiNumber}
                </button>
                <button
                  onClick={() => setSingleAlloc('Skip')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: singleAlloc === 'Skip'
                      ? theme.borders.secondary
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: singleAlloc === 'Skip' ? theme.borders.secondary : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Double allocation */}
            <div className="mb-4">
              <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Double {shanghaiNumber}:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDoubleAlloc('Number')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: doubleAlloc === 'Number'
                      ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: doubleAlloc === 'Number' ? theme.stateColors.active.border : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  {shanghaiNumber}
                </button>
                <button
                  onClick={() => setDoubleAlloc('Doubles')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: doubleAlloc === 'Doubles'
                      ? theme.categoryColors.doubles.color
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: doubleAlloc === 'Doubles' ? theme.categoryColors.doubles.color : 'transparent',
                    color: theme.text.primary,
                    boxShadow: doubleAlloc === 'Doubles' ? `0 0 20px ${theme.categoryColors.doubles.glow}` : 'none'
                  }}
                >
                  Doubles
                </button>
                <button
                  onClick={() => setDoubleAlloc('Skip')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: doubleAlloc === 'Skip'
                      ? theme.borders.secondary
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: doubleAlloc === 'Skip' ? theme.borders.secondary : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Triple allocation */}
            <div className="mb-6">
              <p className="font-bold mb-2" style={{ color: theme.text.primary }}>Triple {shanghaiNumber}:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTripleAlloc('Number')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: tripleAlloc === 'Number'
                      ? `linear-gradient(to right, ${theme.stateColors.active.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('to-', '')).join(', ')})`
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: tripleAlloc === 'Number' ? theme.stateColors.active.border : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  {shanghaiNumber}
                </button>
                <button
                  onClick={() => setTripleAlloc('Triples')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: tripleAlloc === 'Triples'
                      ? theme.categoryColors.triples.color
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: tripleAlloc === 'Triples' ? theme.categoryColors.triples.color : 'transparent',
                    color: theme.text.primary,
                    boxShadow: tripleAlloc === 'Triples' ? `0 0 20px ${theme.categoryColors.triples.glow}` : 'none'
                  }}
                >
                  Triples
                </button>
                <button
                  onClick={() => setTripleAlloc('Skip')}
                  className="flex-1 py-2 px-4 rounded-lg font-bold transition border-2"
                  style={{
                    background: tripleAlloc === 'Skip'
                      ? theme.borders.secondary
                      : `${theme.backgrounds.base.split(' ')[0].replace('from-', '')}88`,
                    borderColor: tripleAlloc === 'Skip' ? theme.borders.secondary : 'transparent',
                    color: theme.text.primary
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-xl font-bold mb-2" style={{ color: theme.categoryColors.beds.color }}>
              All 3 darts will count as 1 BED
            </p>
            <p className="text-sm" style={{ color: theme.text.muted }}>
              1 mark on Beds category + 100 points
            </p>
          </div>
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
              background: `linear-gradient(to right, ${theme.stateColors.winner.gradient.split(' ').map((c: string) => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
              borderColor: theme.stateColors.winner.border,
              color: theme.text.primary,
              boxShadow: `0 0 20px ${theme.stateColors.winner.border}44`
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