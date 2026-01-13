import React, { useState } from 'react';
import { GameResponse, PlayerResponse, ThrowResponse } from '../../../hooks/useGame';
import DartboardSVG from '../controls/DartboardSVG';
import { ManualScoringPad } from '../controls/ManualScoringPad';
import { EditingIndicator } from '../controls/EditingIndicator';
import { useTheme } from '../../../hooks/useThemeContext';
import HorizontalThrowDisplay from '../../ui/HorizontalThrowDisplay';

interface X01GameBoardProps {
  game: GameResponse;
  onThrow: (segment: string, multiplier: number, value: number) => void;
  onConfirmTurn: () => void;
  onUndo: () => void;
  canUndo: boolean;
  displayThrows: ThrowResponse[];
  editingThrowIndex: number | null;
  setEditingThrowIndex: (index: number | null) => void;
}

export const X01GameBoard: React.FC<X01GameBoardProps> = ({
  game,
  onThrow,
  onConfirmTurn,
  onUndo,
  canUndo,
  displayThrows,
  editingThrowIndex,
  setEditingThrowIndex,
}) => {
  const { theme } = useTheme();
  const [showManualScoring, setShowManualScoring] = useState(false);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const lastThrow = displayThrows[displayThrows.length - 1];

  // Handle dartboard segment click
  const handleSegmentClick = (segment: string, mult: number, value: number) => {
    onThrow(segment, mult, value);
  };

  // Calculate current turn score
  const turnScore = displayThrows.reduce((sum, t) => sum + (t.value * t.multiplier), 0);

  return (
    <div className="h-full flex flex-col" style={{ background: theme.backgrounds.base }}>
      {/* Header - Current player and scores */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: theme.borders.secondary }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70" style={{ color: theme.text.secondary }}>Now Playing</div>
            <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>
              {currentPlayer.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-70" style={{ color: theme.text.secondary }}>Remaining</div>
            <div className="text-5xl font-black" style={{ color: theme.text.primary }}>
              {currentPlayer.score}
            </div>
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-4 p-4 h-full">
          
          {/* Left sidebar - Player scores (desktop only) */}
          <div className="hidden xl:block space-y-2 overflow-auto">
            <h3 className="text-lg font-bold mb-3" style={{ color: theme.text.primary }}>Players</h3>
            {game.players.map((player, idx) => (
              <div
                key={player.id}
                className="p-3 rounded-lg border-2"
                style={{
                  background: idx === game.currentPlayerIndex ? theme.backgrounds.cardHex : theme.backgrounds.baseHex,
                  borderColor: idx === game.currentPlayerIndex ? theme.stateColors.active.border : theme.borders.secondary,
                  color: theme.text.primary
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{player.name}</span>
                  {player.isWinner && <span className="text-2xl">🏆</span>}
                </div>
                <div className="text-3xl font-black">{player.score}</div>
                {player.checkoutSuggestion && (
                  <div className="text-xs mt-1 opacity-70">
                    Checkout: {player.checkoutSuggestion}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Center - Dartboard and manual scoring */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Dartboard */}
            <div className="relative">
              <div 
                className="p-4 rounded-2xl border-4"
                style={{
                  borderColor: game.turnComplete ? theme.stateColors.winner.border : theme.borders.primary,
                  boxShadow: game.turnComplete ? `0 0 30px ${theme.stateColors.winner.border}44` : 'none'
                }}
              >
                <DartboardSVG
                  size={Math.min(500, window.innerWidth - 100)}
                  highlightSegment={lastThrow?.segment}
                  onSegmentClick={!game.turnComplete ? handleSegmentClick : undefined}
                  showClickable={!game.turnComplete && game.status !== 2}
                />
              </div>
            </div>

            {/* Turn complete indicator - auto-advances with cameras */}
            {game.turnComplete && (
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="px-6 py-3 rounded-xl font-bold text-lg border-2 animate-pulse"
                  style={{
                    background: theme.stateColors.winner.gradient,
                    borderColor: theme.stateColors.winner.border,
                    color: theme.text.primary,
                    boxShadow: `0 0 20px ${theme.stateColors.winner.border}88`
                  }}
                >
                  ✓ Turn Complete - Remove Darts
                </div>
                <button
                  onClick={onConfirmTurn}
                  className="px-4 py-2 rounded-lg font-bold text-sm opacity-70 hover:opacity-100 transition-all"
                  style={{
                    background: 'transparent',
                    borderColor: theme.borders.secondary,
                    color: theme.text.secondary,
                    border: `1px solid ${theme.borders.secondary}`
                  }}
                >
                  Manual: Click to Continue →
                </button>
              </div>
            )}

            {/* Current turn throws - Horizontal display below dartboard */}
            <div className="w-full max-w-2xl">
              <HorizontalThrowDisplay 
                throws={displayThrows} 
                onUndo={onUndo}
                canUndo={canUndo}
                selectedIndex={editingThrowIndex}
                onSelectThrow={setEditingThrowIndex}
              />
            </div>

            {/* Toggle manual scoring */}
            {!game.turnComplete && (
              <button
                onClick={() => setShowManualScoring(!showManualScoring)}
                className="px-4 py-2 rounded-lg font-bold transition-all"
                style={{
                  background: showManualScoring ? theme.stateColors.active.gradient : 'transparent',
                  borderColor: theme.borders.primary,
                  color: theme.text.primary,
                  border: `2px solid ${theme.borders.primary}`
                }}
              >
                {showManualScoring ? '▼ Hide' : '▶ Show'} Manual Scoring
              </button>
            )}

            {/* Manual scoring pad */}
            {showManualScoring && !game.turnComplete && (
              <div className="w-full max-w-md p-4 rounded-xl" style={{ background: theme.backgrounds.cardHex }}>
                <ManualScoringPad
                  onThrow={onThrow}
                  disabled={game.turnComplete || game.status === 2}
                  editingThrowIndex={editingThrowIndex}
                />
                
                {/* Undo button */}
                {canUndo && (
                  <button
                    onClick={onUndo}
                    className="w-full mt-3 py-2 rounded-lg font-bold"
                    style={{
                      background: 'transparent',
                      borderColor: theme.borders.secondary,
                      color: theme.text.secondary,
                      border: `2px solid ${theme.borders.secondary}`
                    }}
                  >
                    ↶ Undo Last Throw
                  </button>
                )}
              </div>
            )}

            {/* Editing indicator */}
            {editingThrowIndex !== null && (
              <div className="w-full max-w-md">
                <EditingIndicator
                  editingThrowIndex={editingThrowIndex}
                  onChangToMiss={() => onThrow('MISS', 0, 0)}
                />
              </div>
            )}
          </div>

          {/* Right sidebar - Recent throws / stats (desktop only) */}
          <div className="hidden xl:block space-y-2">
            <h3 className="text-lg font-bold mb-3" style={{ color: theme.text.primary }}>This Turn</h3>
            {displayThrows.length === 0 ? (
              <div className="text-center py-8 opacity-50" style={{ color: theme.text.secondary }}>
                No throws yet
              </div>
            ) : (
              <div className="space-y-2">
                {displayThrows.map((throw_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border-2"
                    style={{
                      background: theme.backgrounds.cardHex,
                      borderColor: theme.borders.secondary,
                      color: theme.text.primary
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{throw_.segment}</span>
                      <span className="text-xl font-bold">{throw_.value * throw_.multiplier}</span>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg border-2 mt-4" style={{
                  background: theme.stateColors.active.gradient,
                  borderColor: theme.stateColors.active.border,
                  color: theme.text.primary
                }}>
                  <div className="text-sm opacity-70">Turn Total</div>
                  <div className="text-3xl font-black">{turnScore}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile player list - shows at bottom on small screens */}
      <div className="xl:hidden p-4 border-t overflow-auto" style={{ borderColor: theme.borders.secondary }}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {game.players.map((player, idx) => (
            <div
              key={player.id}
              className="flex-shrink-0 w-32 p-3 rounded-lg border-2"
              style={{
                background: idx === game.currentPlayerIndex ? theme.backgrounds.cardHex : theme.backgrounds.baseHex,
                borderColor: idx === game.currentPlayerIndex ? theme.stateColors.active.border : theme.borders.secondary,
                color: theme.text.primary
              }}
            >
              <div className="font-bold text-sm truncate">{player.name}</div>
              <div className="text-2xl font-black">{player.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};