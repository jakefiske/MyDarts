import { useTheme } from '../../hooks/useThemeContext';
import { useScoreAnimation } from '../../hooks/useScoreAnimation';

interface PlayerCardProps {
  name: string;
  targetDisplay: string;
  baseThrows: number;
  bonusThrows: number;
  isActive: boolean;
  isWinner: boolean;
  gameType: number;
  checkoutSuggestion?: string | null;
  requiresDoubleIn: boolean;
  playerIndex?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  name, 
  targetDisplay, 
  baseThrows,
  bonusThrows,
  isActive, 
  isWinner,
  gameType,
  checkoutSuggestion,
  requiresDoubleIn,
  playerIndex = 0
}) => {
  const { theme } = useTheme();
  const isX01 = gameType === 1;
  const colorScheme = theme.playerColors[playerIndex % theme.playerColors.length];
  const isScoreAnimating = useScoreAnimation(targetDisplay);
  
  return (
    <div className="relative">
      <style>{`
        @keyframes activeGlow {
          0%, 100% { 
            box-shadow: 0 0 20px ${colorScheme.glow},
                        0 0 35px ${colorScheme.glow};
          }
          50% { 
            box-shadow: 0 0 25px ${colorScheme.glow},
                        0 0 45px ${colorScheme.glow};
          }
        }

        .active-card {
          animation: activeGlow 2.5s ease-in-out infinite;
        }

        @keyframes winnerShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .winner-card {
          background-size: 200% 100%;
          animation: winnerShine 3s ease-in-out infinite;
        }

        @keyframes scorePop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .score-animate {
          animation: scorePop 0.4s ease-out;
        }
      `}</style>

      <div
        className={`
          rounded-2xl p-4 md:p-6 transition-all duration-300
          ${isWinner 
            ? `winner-card border-4` 
            : isActive 
              ? `active-card border-4 transform scale-105` 
              : 'border-2'
          }
        `}
        style={{
          background: isWinner
            ? `linear-gradient(to right, ${theme.stateColors.winner.gradient.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`
            : isActive
              ? `linear-gradient(135deg, ${colorScheme.primary}25, ${colorScheme.secondary}15)`
              : `linear-gradient(135deg, ${colorScheme.primary}10, ${colorScheme.secondary}05)`,
          borderColor: isWinner 
            ? theme.stateColors.winner.border
            : isActive
              ? colorScheme.primary
              : `${colorScheme.primary}40`,
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Player name - BIGGER and clearer hierarchy */}
        <div className="flex items-center justify-between mb-3">
          <h3 
            className="text-3xl md:text-4xl font-black tracking-tight"
            style={{ 
              fontFamily: theme.fonts.display,
              color: isWinner ? theme.text.primary : colorScheme.primary,
            }}
          >
            {name.toUpperCase()}
          </h3>
          {isWinner && <span className="text-4xl animate-bounce">🏆</span>}
          {isActive && !isWinner && <span className="text-4xl">🎯</span>}
        </div>
        
        {/* Score/Target display - MASSIVE for readability from dart line */}
        <div className={`text-7xl md:text-8xl lg:text-9xl font-black text-center my-4 transition-transform ${
               isScoreAnimating ? 'score-animate' : ''
             }`}
             style={{ 
               fontFamily: theme.fonts.score,
               color: isWinner ? theme.text.primary : colorScheme.secondary,
               letterSpacing: '-0.02em',
               textShadow: isActive || isWinner 
                 ? '3px 3px 0 rgba(0,0,0,0.2)' 
                 : '2px 2px 0 rgba(0,0,0,0.15)'
             }}>
          {targetDisplay}
        </div>

        {/* Double-in required indicator */}
        {isX01 && requiresDoubleIn && (
          <div className="mb-3 p-3 rounded-xl text-center border-2"
               style={{
                 background: `linear-gradient(to right, ${theme.stateColors.streak.gradient.split(' ').map(c => c.replace('from-', '').replace('to-', '')).join(', ')})`,
                 borderColor: theme.stateColors.streak.border
               }}>
            <div className="text-sm md:text-base font-bold"
                 style={{ color: theme.text.primary }}>
              🎯 Hit a DOUBLE to start!
            </div>
          </div>
        )}
        
        {/* Throw count - better prominence */}
        <div className="text-lg md:text-xl text-center font-bold mt-4"
             style={{ color: isWinner ? theme.text.secondary : theme.text.muted }}>
          {baseThrows === 0 && bonusThrows === 0 ? (
            <span>No throws yet</span>
          ) : bonusThrows > 0 ? (
            <div className="space-y-1">
              <div>{baseThrows} throws</div>
              <div className="font-black text-xl md:text-2xl"
                   style={{ color: theme.stateColors.streak.border }}>
                🔥 {bonusThrows} BONUS
              </div>
            </div>
          ) : (
            <span>{baseThrows} {baseThrows === 1 ? 'throw' : 'throws'}</span>
          )}
        </div>

        {/* X01 checkout suggestion */}
        {isX01 && isActive && checkoutSuggestion && !requiresDoubleIn && (
          <div className="mt-4 p-3 rounded-xl border-2 shadow-lg"
               style={{
                 background: 'rgba(15, 23, 42, 0.8)',
                 borderColor: colorScheme.primary
               }}>
            <div className="text-xs md:text-sm text-center mb-1 font-semibold uppercase tracking-wide"
                 style={{ color: theme.text.muted }}>
              Suggested Checkout
            </div>
            <div className="text-lg md:text-xl text-center font-black" 
                 style={{ 
                   fontFamily: 'Courier New, monospace',
                   color: colorScheme.primary
                 }}>
              {checkoutSuggestion}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;