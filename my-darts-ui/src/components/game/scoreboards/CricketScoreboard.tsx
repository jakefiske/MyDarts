import React, { useEffect, useState } from 'react';
import { PlayerResponse } from '../../../hooks/useGame';
import { useTheme } from '../../../hooks/useThemeContext';

interface CricketScoreboardProps {
  players: PlayerResponse[];
  currentPlayerIndex: number;
}

const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25]; // Bull = 25

const getMarkDisplay = (marks: number): string => {
  if (marks === 0) return '';
  if (marks === 1) return '/';
  if (marks === 2) return 'X';
  return '⭕';
};

const getNumberDisplay = (num: number): string => {
  return num === 25 ? 'BULL' : num.toString();
};

export const CricketScoreboard: React.FC<CricketScoreboardProps> = ({ 
  players, 
  currentPlayerIndex 
}) => {
  const { theme } = useTheme();
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  const [prevMarks, setPrevMarks] = useState<Map<string, number>>(new Map());

  // Detect mark changes and trigger animations
  useEffect(() => {
    const newAnimating = new Set<string>();
    const newMarks = new Map<string, number>();

    players.forEach((player) => {
      CRICKET_NUMBERS.forEach((num) => {
        const key = `${player.id}-${num}`;
        const marks = player.cricketMarks?.[num] || 0;
        const prevMark = prevMarks.get(key) || 0;
        
        newMarks.set(key, marks);
        if (marks > prevMark) {
          newAnimating.add(key);
        }
      });
    });

    setAnimatingCells(newAnimating);
    setPrevMarks(newMarks);

    if (newAnimating.size > 0) {
      const timer = setTimeout(() => setAnimatingCells(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [players]);

  return (
    <div className="w-full">
      <style>{`
        @keyframes scoreboardPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        @keyframes scoreboardGlow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 0px currentColor); }
          50% { filter: brightness(1.4) drop-shadow(0 0 20px currentColor); }
        }

        .mark-animate {
          animation: scoreboardPulse 0.4s ease-out, scoreboardGlow 0.4s ease-out;
        }

        @keyframes playerPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        .active-player {
          animation: playerPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className={`bg-gradient-to-br ${theme.backgrounds.base} rounded-lg md:rounded-2xl shadow-2xl overflow-hidden border`}
           style={{ borderColor: theme.borders.primary }}>
        {/* Title Bar - HIDDEN on mobile */}
        <div className={`hidden md:block bg-gradient-to-r ${theme.titleBars.cricket} px-4 py-2`}>
          <h2 className="text-xl font-bold tracking-tight" 
              style={{ 
                fontFamily: theme.fonts.display,
                color: theme.text.primary
              }}>
            CRICKET
          </h2>
        </div>

        {/* Player Headers - Much more compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row gap-1 p-1 md:p-2 bg-slate-800/50">
          {players.map((player, idx) => {
            const colorScheme = theme.playerColors[idx % theme.playerColors.length];
            const isActive = idx === currentPlayerIndex;
            
            return (
              <div
                key={player.id}
                className={`flex-1 rounded p-1.5 md:p-3 transition-all duration-300 ${
                  isActive ? 'active-player' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${colorScheme.primary}22, ${colorScheme.secondary}11)`,
                  border: `2px solid ${isActive ? colorScheme.primary : colorScheme.primary}44`,
                  boxShadow: isActive 
                    ? `0 0 15px ${colorScheme.glow}, inset 0 0 10px ${colorScheme.glow}`
                    : `0 0 0 ${colorScheme.glow}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div 
                      className="player-name text-xs md:text-base lg:text-lg font-bold tracking-wide truncate"
                      style={{ 
                        color: colorScheme.primary,
                        textShadow: `0 0 8px ${colorScheme.glow}`
                      }}
                    >
                      {player.name.toUpperCase()}
                    </div>
                    <div className="player-score text-lg md:text-2xl lg:text-3xl font-black"
                         style={{ 
                           color: colorScheme.secondary,
                           textShadow: `1px 1px 0 #00000066`
                         }}>
                      {player.score}
                    </div>
                  </div>
                  {isActive && (
                    <div className="player-emoji ml-1 text-base md:text-2xl lg:text-3xl animate-pulse">🎯</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scoreboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full scoreboard-table">
            <thead>
              <tr className="border-b-2 md:border-b-4 border-slate-700 bg-slate-900">
                <th className="sticky left-0 z-10 bg-slate-900 p-1 md:p-2 text-left text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wider">
                  <span className="hidden sm:inline">Number</span>
                  <span className="sm:hidden">#</span>
                </th>
                {players.map((player, idx) => {
                  const colorScheme = theme.playerColors[idx % theme.playerColors.length];
                  return (
                    <th 
                      key={player.id} 
                      className="p-1 md:p-2 text-center font-bold text-xs md:text-sm"
                      style={{ color: colorScheme.primary }}
                    >
                      <div className="hidden md:block">Marks</div>
                      <div className="md:hidden">M</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CRICKET_NUMBERS.map((num, rowIdx) => {
                const isBull = num === 25;
                return (
                  <tr 
                    key={num} 
                    className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                      isBull ? 'bg-slate-800/50' : ''
                    }`}
                    style={{ 
                      background: !isBull && rowIdx % 2 === 0 ? 'rgba(15, 23, 42, 0.3)' : undefined
                    }}
                  >
                    <td 
                      className="table-number sticky left-0 z-10 p-1 md:p-2 font-black text-base md:text-xl lg:text-2xl"
                      style={{
                        background: isBull
                          ? 'linear-gradient(90deg, rgba(30, 41, 59, 1) 0%, rgba(30, 41, 59, 0.95) 100%)'
                          : rowIdx % 2 === 0 
                            ? 'linear-gradient(90deg, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.95) 100%)'
                            : 'linear-gradient(90deg, rgba(30, 41, 59, 1) 0%, rgba(30, 41, 59, 0.95) 100%)',
                        color: isBull ? theme.categoryColors.bull.color : theme.categoryColors.numbers.color,
                        textShadow: isBull 
                          ? `0 0 10px ${theme.categoryColors.bull.glow}`
                          : `0 0 10px ${theme.categoryColors.numbers.glow}`
                      }}
                    >
                      {getNumberDisplay(num)}
                    </td>
                    {players.map((player, idx) => {
                      const marks = player.cricketMarks?.[num] || 0;
                      const isClosed = marks >= 3;
                      const cellKey = `${player.id}-${num}`;
                      const isAnimating = animatingCells.has(cellKey);
                      const colorScheme = theme.playerColors[idx % theme.playerColors.length];
                      
                      return (
                        <td 
                          key={player.id} 
                          className={`p-1 md:p-2 text-center text-lg md:text-2xl lg:text-3xl font-black transition-all mark-text ${
                            isAnimating ? 'mark-animate' : ''
                          }`}
                          style={{
                            color: isClosed ? colorScheme.primary : '#64748b',
                            textShadow: isClosed ? `0 0 10px ${colorScheme.glow}` : 'none'
                          }}
                        >
                          {getMarkDisplay(marks)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend - Collapsible info icon */}
        <div className="bg-slate-900/80 px-3 py-2 border-t-2 border-slate-700">
          <button
            onClick={() => {
              const legend = document.getElementById('cricket-legend');
              if (legend) {
                legend.classList.toggle('hidden');
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="text-base">ℹ️</span>
            <span>Game Rules</span>
          </button>
          <div id="cricket-legend" className="hidden mt-2 text-xs text-slate-400 space-y-1">
            <p>
              <span className="text-slate-300 font-semibold">Marks:</span> / = 1 mark · X = 2 marks · ⭕ = Closed (3+)
            </p>
            <p>
              Close numbers before your opponent to score points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};