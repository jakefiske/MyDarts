import React from 'react';
import { useTheme } from './hooks/useThemeContext';

interface DartboardProps {
  onDartHit: (segment: string, multiplier: number, value: number) => void;
}

const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const Dartboard: React.FC<DartboardProps> = ({ onDartHit }) => {
  const { theme } = useTheme();
  
  const handleClick = (value: number, multiplier: number) => {
    const segment = multiplier === 3 ? `T${value}` : multiplier === 2 ? `D${value}` : `S${value}`;
    onDartHit(segment, multiplier, value);
  };

  const handleBullClick = (isDouble: boolean) => {
    const segment = isDouble ? 'D25' : 'S25';
    onDartHit(segment, isDouble ? 2 : 1, 25);
  };

  return (
    <div className="p-6 rounded-2xl border-2"
         style={{
           background: `linear-gradient(to bottom right, ${theme.backgrounds.card.split(' ').map((c: string) => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
           borderColor: theme.borders.primary
         }}>
      <h3 className="text-xl font-bold mb-4"
          style={{ 
            color: theme.stateColors.active.color,
            fontFamily: theme.fonts.display
          }}>
        Virtual Dartboard
      </h3>
      
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {/* Number buttons */}
        {NUMBERS.map((num) => (
          <div key={num} className="flex items-center gap-2">
            <span className="w-12 font-bold text-right"
                  style={{ color: theme.text.primary }}>
              {num}:
            </span>
            <button 
              onClick={() => handleClick(num, 1)}
              className="flex-1 py-2 px-3 rounded-lg font-bold transition border-2"
              style={{
                background: `${theme.backgrounds.baseHex}cc`,
                borderColor: theme.borders.secondary,
                color: theme.text.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${theme.backgrounds.cardHex}dd`;
                e.currentTarget.style.borderColor = theme.stateColors.active.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${theme.backgrounds.baseHex}cc`;
                e.currentTarget.style.borderColor = theme.borders.secondary;
              }}
            >
              S{num}
            </button>
            <button 
              onClick={() => handleClick(num, 2)}
              className="flex-1 py-2 px-3 rounded-lg font-bold transition border-2"
              style={{
                background: theme.categoryColors.doubles.color,
                borderColor: theme.categoryColors.doubles.color,
                color: theme.text.primary,
                boxShadow: `0 0 10px ${theme.categoryColors.doubles.glow}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              D{num}
            </button>
            <button 
              onClick={() => handleClick(num, 3)}
              className="flex-1 py-2 px-3 rounded-lg font-bold transition border-2"
              style={{
                background: theme.categoryColors.triples.color,
                borderColor: theme.categoryColors.triples.color,
                color: theme.text.primary,
                boxShadow: `0 0 10px ${theme.categoryColors.triples.glow}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              T{num}
            </button>
          </div>
        ))}
        
        {/* Bull */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t-2"
             style={{ borderColor: theme.borders.primary }}>
          <span className="w-12 font-bold text-right"
                style={{ color: theme.text.primary }}>
            Bull:
          </span>
          <button 
            onClick={() => handleBullClick(false)}
            className="flex-1 py-3 px-4 rounded-lg font-bold transition border-2"
            style={{
              background: theme.categoryColors.bull.color,
              borderColor: theme.categoryColors.bull.color,
              color: theme.text.primary,
              boxShadow: `0 0 15px ${theme.categoryColors.bull.glow}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            S25
          </button>
          <button 
            onClick={() => handleBullClick(true)}
            className="flex-1 py-3 px-4 rounded-lg font-bold transition border-2"
            style={{
              background: `linear-gradient(to right, ${theme.categoryColors.bull.color}, ${theme.categoryColors.doubles.color})`,
              borderColor: theme.categoryColors.bull.color,
              color: theme.text.primary,
              boxShadow: `0 0 20px ${theme.categoryColors.bull.glow}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            D25
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dartboard;