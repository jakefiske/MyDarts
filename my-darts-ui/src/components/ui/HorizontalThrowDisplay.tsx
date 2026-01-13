import DartboardSVG from './../game/controls/DartboardSVG';
import { useTheme } from '../../hooks/useThemeContext';

interface ThrowInfo {
  throwNumber: number;
  segment: string;
  value: number;
  multiplier: number;
}

interface HorizontalThrowDisplayProps {
  throws: ThrowInfo[];
  onUndo?: () => void;
  canUndo?: boolean;
  selectedIndex?: number | null;
  onSelectThrow?: (index: number | null) => void;
}

const HorizontalThrowDisplay: React.FC<HorizontalThrowDisplayProps> = ({ 
  throws, 
  onUndo, 
  canUndo,
  selectedIndex,
  onSelectThrow
}) => {
  const { theme } = useTheme();

  const handleThrowClick = (index: number) => {
    if (!onSelectThrow) return;
    
    // Toggle selection
    if (selectedIndex === index) {
      onSelectThrow(null);
    } else {
      onSelectThrow(index);
    }
  };

  // Calculate total score
  const totalScore = throws.reduce((sum, t) => sum + (t.value * t.multiplier), 0);

  return (
    <div className="rounded-xl p-3 border-2"
         style={{
           background: theme.backgrounds.cardHex,
           borderColor: theme.borders.primary
         }}>
      
      {/* Throw slots with mini dartboards */}
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {[0, 1, 2].map((idx) => {
          const throw_ = throws[idx];
          const isSelected = selectedIndex === idx;
          const isEmpty = !throw_;

          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer"
              style={{
                background: isSelected 
                  ? theme.stateColors.winner.gradient
                  : isEmpty 
                    ? 'transparent'
                    : theme.backgrounds.baseHex,
                borderColor: isSelected 
                  ? theme.stateColors.winner.border 
                  : isEmpty
                    ? theme.borders.secondary
                    : theme.borders.primary,
                boxShadow: isSelected 
                  ? `0 0 20px ${theme.stateColors.winner.border}44` 
                  : 'none',
                opacity: isEmpty ? 0.3 : 1,
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                minWidth: '90px'
              }}
              onClick={() => throw_ && handleThrowClick(idx)}
            >
              {/* Mini dartboard preview */}
              {throw_ && (
                <div className="rounded p-0.5" style={{ background: theme.backgrounds.baseHex }}>
                  <DartboardSVG
                    size={45}
                    highlightSegment={throw_.segment}
                    showClickable={false}
                    showNumbers={false}
                  />
                </div>
              )}
              
              {/* Throw info */}
              <div className="text-center">
                {throw_ ? (
                  <>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xs opacity-70" style={{ color: theme.text.muted }}>#{idx + 1}</span>
                      <span className="text-lg font-bold" style={{ color: theme.text.primary }}>
                        {throw_.segment}
                      </span>
                      {isSelected && (
                        <span className="text-sm" style={{ color: theme.stateColors.winner.border }}>✎</span>
                      )}
                    </div>
                    <div className="text-xs opacity-70" style={{ color: theme.text.muted }}>
                      {throw_.value * throw_.multiplier} pts
                    </div>
                  </>
                ) : (
                  <div className="text-2xl opacity-30" style={{ color: theme.text.muted }}>-</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Total score */}
        {throws.length > 0 && (
          <div className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg border-2"
               style={{
                 background: theme.stateColors.active.gradient,
                 borderColor: theme.stateColors.active.border,
                 color: theme.text.primary
               }}>
            <span className="text-xs font-bold opacity-70">Total</span>
            <span className="text-2xl font-black">{totalScore}</span>
          </div>
        )}
      </div>

      {/* Edit hint - shows when throw is selected */}
      {selectedIndex !== null && selectedIndex !== undefined && (
        <div className="mt-2 text-center text-xs font-bold animate-pulse"
             style={{ color: theme.stateColors.winner.border }}>
          ✎ Click dartboard to change Dart {selectedIndex + 1}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        {/* Undo button - only when NOT editing */}
        {canUndo && onUndo && selectedIndex === null && (
          <button
            onClick={onUndo}
            className="flex-1 px-3 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-90 border-2"
            style={{
              background: theme.stateColors.bust.gradient,
              borderColor: theme.stateColors.bust.border,
              color: theme.text.primary
            }}
          >
            ↩ Undo Last Throw
          </button>
        )}

        {/* Cancel edit button - only when editing */}
        {selectedIndex !== null && selectedIndex !== undefined && (
          <button
            onClick={() => onSelectThrow?.(null)}
            className="flex-1 px-3 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-90 border-2"
            style={{
              background: theme.backgrounds.baseHex,
              borderColor: theme.borders.secondary,
              color: theme.text.primary
            }}
          >
            ✕ Cancel Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default HorizontalThrowDisplay;