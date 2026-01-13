import React, { useEffect, useState } from 'react';
import PlayerCard from '../../ui/PlayerCard';
import { CricketScoreboard } from './../scoreboards/CricketScoreboard';
import { MickeyMouseScoreboard } from './../scoreboards/MickeyMouseScoreboard';
import { PlayerResponse } from '../../../hooks/useGame';
import { useTheme } from '../../../hooks/useThemeContext';

interface GameBoardProps {
  players: PlayerResponse[];
  currentPlayerIndex: number;
  currentPlayerName: string | null;
  throwsThisTurn: number;
  consecutiveHits: number;
  isOnStreak: boolean;
  winnerName: string | null;
  onNewGame: () => void;
  playerTotalThrows: Record<string, {base: number, bonus: number}>;
  gameType: number;
  lastThrowMessage: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerIndex,
  currentPlayerName,
  throwsThisTurn,
  consecutiveHits,
  isOnStreak,
  winnerName,
  onNewGame,
  playerTotalThrows,
  gameType,
  lastThrowMessage
}) => {
  const { theme } = useTheme();
  const isAroundTheClock = gameType === 0;
  const isX01 = gameType === 1;
  const isCricket = gameType === 2;
  const isMickeyMouse = gameType === 3;

  return (
    <div className="relative">
      <style>{`
        @keyframes winnerGlow {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.4),
                        0 0 60px rgba(255, 215, 0, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.6),
                        0 0 80px rgba(255, 215, 0, 0.4);
          }
        }

        .winner-banner {
          animation: winnerGlow 2s ease-in-out infinite;
        }

        @keyframes bustShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .bust-banner {
          animation: bustShake 0.5s ease-in-out;
        }
      `}</style>

      {/* Simplified Winner banner */}
      {winnerName && (
        <div className="winner-banner rounded-3xl p-12 mb-6 text-center border-8"
             style={{
               background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
               borderColor: '#FFD700'
             }}>
          <div className="text-9xl mb-6">🏆</div>
          <div className="text-7xl font-black" 
               style={{ 
                 fontFamily: theme.fonts.display,
                 color: '#000',
                 textShadow: '4px 4px 0 rgba(255,255,255,0.3)'
               }}>
            {winnerName.toUpperCase()}
          </div>
          <div className="text-4xl mt-4 font-bold" style={{color: '#000'}}>
            WINNER!
          </div>
        </div>
      )}

      {/* Compact current player indicator - Hidden on mobile/tablet since sticky header shows this */}
      {!winnerName && (
        <div className="hidden 2xl:block rounded-lg p-3 mb-3 border-2"
             style={{
               background: `${theme.backgrounds.cardHex}cc`,
               borderColor: theme.stateColors.active.border,
               backdropFilter: 'blur(10px)'
             }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm md:text-base font-semibold" style={{ color: theme.text.muted }}>
                Now Playing:
              </span>
              <span className="text-xl md:text-2xl font-black"
                    style={{ 
                      color: theme.stateColors.active.color,
                      fontFamily: theme.fonts.display
                    }}>
                {currentPlayerName}
              </span>
              {isAroundTheClock && isOnStreak && consecutiveHits > 2 && (
                <span className="text-lg md:text-xl font-bold"
                      style={{ color: theme.stateColors.streak.border }}>
                  🔥 {consecutiveHits}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <span style={{ color: theme.text.muted }}>
                Dart {Math.min(throwsThisTurn + 1, 3)}/3
              </span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                    style={{
                      background: i < throwsThisTurn ? theme.stateColors.active.color : 'transparent',
                      border: `2px solid ${i < throwsThisTurn ? theme.stateColors.active.color : theme.borders.secondary}`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bust indicator - compact */}
      {lastThrowMessage && lastThrowMessage.includes('BUST') && (
        <div className="bust-banner rounded-lg p-3 mb-3 text-center border-2"
             style={{
               background: `linear-gradient(to right, ${theme.stateColors.bust.gradient.split(' ').map(c => c.replace('from-', '').replace('to-', '')).join(', ')})`,
               borderColor: theme.stateColors.bust.border
             }}>
          <div className="text-lg md:text-xl font-bold"
               style={{ 
                 fontFamily: theme.fonts.display,
                 color: theme.text.primary
               }}>
            💥 {lastThrowMessage}
          </div>
        </div>
      )}

      {/* Cricket/Mickey Mouse Scoreboard OR Player Cards */}
      {isCricket ? (
        <CricketScoreboard 
          players={players}
          currentPlayerIndex={currentPlayerIndex}
        />
      ) : isMickeyMouse ? (
        <MickeyMouseScoreboard 
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          lowestNumber={12}
          includeDoubles={true}
          includeTriples={true}
          includeBeds={true}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {players.map((player, index) => {
            const isActive = index === currentPlayerIndex && !winnerName;
            const totals = playerTotalThrows[player.id] || { base: 0, bonus: 0 };
            
            let displayBase = totals.base;
            let displayBonus = totals.bonus;
            
            if (isActive && throwsThisTurn > 0) {
              displayBase += Math.min(throwsThisTurn, 3);
              displayBonus += Math.max(0, throwsThisTurn - 3);
            }
            
            return (
              <PlayerCard
                key={player.id}
                name={player.name}
                targetDisplay={player.currentTargetDisplay}
                baseThrows={displayBase}
                bonusThrows={displayBonus}
                isActive={isActive}
                isWinner={player.isWinner}
                gameType={gameType}
                checkoutSuggestion={player.checkoutSuggestion}
                requiresDoubleIn={player.requiresDoubleIn ?? false}
                playerIndex={index}
              />
            );
          })}
        </div>
      )}

      {winnerName && (
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 border-2 border-slate-500"
          style={{ color: theme.text.primary }}
        >
          ← New Game
        </button>
      )}
    </div>
  );
};

export default GameBoard;