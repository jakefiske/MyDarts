import DartboardSVG from '../game/controls/DartboardSVG';
import { useTheme } from '../../hooks/useThemeContext';

interface ThrowInfo {
  throwNumber: number;
  segment: string;
  value: number;
  multiplier: number;
}

interface ThrowDisplayProps {
  throws: ThrowInfo[];
  onUndo?: () => void;
  canUndo?: boolean;
  selectedIndex?: number | null;
  onSelectThrow?: (index: number | null) => void;
}

const ThrowDisplay: React.FC<ThrowDisplayProps> = ({ 
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

  return (
    <div className="rounded-2xl p-4 w-56 border-2"
         style={{
           background: `linear-gradient(to bottom right, ${theme.backgrounds.base.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
           borderColor: theme.borders.primary
         }}>
      <h3 className="text-lg font-semibold mb-4 text-center"
          style={{ color: theme.text.muted }}>
        This Turn {throws.length > 0 && `(${throws.length})`}
      </h3>
      
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {throws.length === 0 ? (
          <div className="text-center py-4" style={{ color: theme.text.muted }}>
            No throws yet
          </div>
        ) : (
          throws.map((throwInfo, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-2 rounded-lg transition cursor-pointer border-2"
              style={{
                background: selectedIndex === index 
                  ? `linear-gradient(to right, ${theme.stateColors.winner.gradient.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})` 
                  : `${theme.backgrounds.card}44`,
                borderColor: selectedIndex === index 
                  ? theme.stateColors.winner.border 
                  : 'transparent',
                boxShadow: selectedIndex === index 
                  ? `0 0 20px ${theme.stateColors.winner.border}44` 
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.background = `${theme.backgrounds.card}88`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.background = `${theme.backgrounds.card}44`;
                }
              }}
              onClick={() => handleThrowClick(index)}
            >
              <div className="rounded-xl p-1" style={{ background: theme.backgrounds.base }}>
                <DartboardSVG
                  size={50}
                  highlightSegment={throwInfo.segment}
                  showClickable={false}
                  showNumbers={false}
                />
              </div>
              <div className="flex-grow">
                {throwInfo.segment === 'MISS' ? (
                  <>
                    <div className="text-xl font-bold" style={{ color: theme.stateColors.bust.border }}>MISS</div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>0 pts</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: theme.text.muted }}>#{index + 1}</span>
                      <span className="text-lg font-bold" style={{ color: theme.stateColors.active.color }}>{throwInfo.segment}</span>
                    </div>
                    <div className="text-sm" style={{ color: theme.text.muted }}>
                      {throwInfo.multiplier * throwInfo.value} pts
                    </div>
                  </>
                )}
              </div>
              {selectedIndex === index && (
                <div className="text-sm" style={{ color: theme.stateColors.winner.border }}>✎</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit hint */}
      {selectedIndex !== null && selectedIndex !== undefined && (
        <div className="mt-3 text-center text-sm"
             style={{ color: theme.stateColors.winner.border }}>
          Click dartboard to change Dart {selectedIndex + 1}
        </div>
      )}

      {/* Undo button */}
      {canUndo && selectedIndex === null && (
        <button
          onClick={onUndo}
          className="w-full mt-4 px-4 py-2 rounded-lg font-semibold transition border-2"
          style={{
            background: `linear-gradient(to right, ${theme.stateColors.bust.gradient.split(' ').map(c => c.replace('from-', '').replace('to-', '')).join(', ')})`,
            borderColor: theme.stateColors.bust.border,
            color: theme.text.primary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          ↩ Undo Last Throw
        </button>
      )}

      {/* Cancel edit button */}
      {selectedIndex !== null && selectedIndex !== undefined && (
        <button
          onClick={() => onSelectThrow?.(null)}
          className="w-full mt-4 px-4 py-2 rounded-lg font-semibold transition border-2"
          style={{
            background: `${theme.backgrounds.card}88`,
            borderColor: theme.borders.secondary,
            color: theme.text.primary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${theme.backgrounds.card}bb`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${theme.backgrounds.card}88`;
          }}
        >
          ✕ Cancel Edit
        </button>
      )}
    </div>
  );
};

export default ThrowDisplay;