import React, { useState } from 'react';
import { GameResponse, ThrowResponse } from '../../../hooks/useGame';
import DartboardSVG from '../controls/DartboardSVG';
import { ManualScoringPad } from '../controls/ManualScoringPad';
import { EditingIndicator } from '../controls/EditingIndicator';
import { useTheme } from '../../../hooks/useThemeContext';

interface AroundTheClockGameBoardProProps {
  game: GameResponse;
  onThrow: (segment: string, multiplier: number, value: number) => void;
  onConfirmTurn: () => void;
  onUndo: () => void;
  canUndo: boolean;
  displayThrows: ThrowResponse[];
  editingThrowIndex: number | null;
  setEditingThrowIndex: (index: number | null) => void;
}

export const AroundTheClockGameBoardPro: React.FC<AroundTheClockGameBoardProProps> = ({
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
  const currentTarget = parseInt(currentPlayer.currentTargetDisplay);
  const highlightNumbers = isNaN(currentTarget) ? [] : [currentTarget];
  const playerColor = theme.playerColors[game.currentPlayerIndex % theme.playerColors.length];

  const handleSegmentClick = (segment: string, mult: number, value: number) => {
    onThrow(segment, mult, value);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: theme.backgrounds.baseHex }}>
      
      {/* MOBILE */}
      <div className="md:hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 text-center" 
             style={{ background: `${playerColor.primary}11`, borderBottom: `1px solid ${theme.borders.primary}` }}>
          <div className="text-xs font-bold mb-1" style={{ color: theme.text.secondary }}>
            {currentPlayer.name.toUpperCase()}
          </div>
          <div className="text-7xl font-black" 
               style={{ color: playerColor.primary, lineHeight: '1', textShadow: `0 0 20px ${playerColor.glow}` }}>
            {currentPlayer.currentTargetDisplay}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-2">
          <DartboardSVG
            size={Math.min(window.innerWidth - 16, 500)}
            highlightSegment={editingThrowIndex !== null && displayThrows[editingThrowIndex] ? displayThrows[editingThrowIndex].segment : undefined}
            targetSegment={`S${currentTarget}`}
            onSegmentClick={!game.turnComplete ? handleSegmentClick : undefined}
            showClickable={!game.turnComplete && game.status !== 2}
          />
        </div>

        <div className="flex-shrink-0 p-2 space-y-2" style={{ borderTop: `1px solid ${theme.borders.primary}` }}>
          {editingThrowIndex !== null && (
            <div className="px-3 py-2 rounded-lg text-center text-sm font-bold"
                 style={{ background: `${theme.stateColors.active.color}22`, border: `2px solid ${theme.stateColors.active.border}`, color: theme.text.primary }}>
              Editing Dart {editingThrowIndex + 1}
            </div>
          )}

          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map(i => {
              const throw_ = displayThrows[i];
              const isEditing = editingThrowIndex === i;
              const isLastThrow = throw_ && i === displayThrows.length - 1;
              return (
                <button key={i} onClick={() => throw_ && isLastThrow && setEditingThrowIndex(i)} disabled={!throw_ || !isLastThrow}
                  className="flex-1 h-14 rounded-lg font-bold text-base"
                  style={{
                    background: throw_ ? theme.backgrounds.cardHex : 'transparent',
                    border: `2px solid ${isEditing ? theme.stateColors.active.border : theme.borders.primary}`,
                    color: throw_ ? theme.text.primary : theme.text.muted,
                    opacity: (throw_ && !isLastThrow) ? 0.4 : 1
                  }}>
                  {throw_ ? throw_.segment : '-'}
                </button>
              );
            })}
            {canUndo && (
              <button onClick={onUndo} className="h-14 px-4 rounded-lg font-bold"
                style={{ background: theme.backgrounds.cardHex, border: `2px solid ${theme.borders.primary}`, color: theme.text.secondary }}>
                ↶
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {game.players.map((player, idx) => {
              const isActive = idx === game.currentPlayerIndex;
              const color = theme.playerColors[idx % theme.playerColors.length];
              return (
                <div key={player.id} className="flex-shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-2"
                  style={{ background: isActive ? `${color.primary}22` : theme.backgrounds.cardHex, border: `2px solid ${isActive ? color.primary : theme.borders.primary}` }}>
                  <div className="text-xs font-medium" style={{ color: theme.text.secondary }}>{player.name}</div>
                  <div className="text-lg font-black" style={{ color: color.primary }}>{player.currentTargetDisplay}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex h-full">
        {/* Left */}
        <div className="w-72 flex-shrink-0 flex flex-col p-6" style={{ borderRight: `1px solid ${theme.borders.primary}` }}>
          <div className="text-xs font-bold mb-2" style={{ color: theme.text.secondary }}>NOW PLAYING</div>
          <div className="text-3xl font-black mb-8" style={{ color: theme.text.primary }}>{currentPlayer.name}</div>
          
          <div className="text-xs font-bold mb-2" style={{ color: theme.text.secondary }}>CURRENT TARGET</div>
          <div className="text-9xl font-black mb-8" 
               style={{ color: playerColor.primary, lineHeight: '0.9', textShadow: `0 0 30px ${playerColor.glow}` }}>
            {currentPlayer.currentTargetDisplay}
          </div>

          <div className="text-xs font-bold mb-3" style={{ color: theme.text.secondary }}>THIS TURN</div>
          <div className="flex flex-wrap gap-2 mb-6">
            {displayThrows.map((throw_, idx) => {
              const isEditing = editingThrowIndex === idx;
              const isLastThrow = idx === displayThrows.length - 1;
              return (
                <button key={idx} onClick={() => isLastThrow && setEditingThrowIndex(idx)} disabled={!isLastThrow}
                  className="w-16 h-16 rounded-lg font-bold text-lg"
                  style={{
                    background: theme.backgrounds.cardHex, border: `2px solid ${isEditing ? theme.stateColors.active.border : theme.borders.primary}`,
                    color: theme.text.primary, opacity: isLastThrow ? 1 : 0.4
                  }}>
                  {throw_.segment}
                </button>
              );
            })}
          </div>

          {canUndo && (
            <button onClick={onUndo} className="w-full py-3 rounded-lg font-bold"
              style={{ background: theme.backgrounds.cardHex, color: theme.text.secondary, border: `2px solid ${theme.borders.primary}` }}>
              ↶ Undo
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Players above board */}
          <div className="flex gap-3 mb-4">
            {game.players.map((player, idx) => {
              const isActive = idx === game.currentPlayerIndex;
              const color = theme.playerColors[idx % theme.playerColors.length];
              return (
                <div key={player.id} className="px-6 py-3 rounded-xl flex items-center justify-between gap-4 min-w-[140px]"
                  style={{ background: isActive ? `${color.primary}22` : theme.backgrounds.cardHex, border: `2px solid ${isActive ? color.primary : theme.borders.primary}` }}>
                  <div>
                    <div className="text-sm font-bold" style={{ color: theme.text.primary }}>{player.name}</div>
                    <div className="text-xs" style={{ color: theme.text.secondary }}>{player.throwCount} throws</div>
                  </div>
                  <div className="text-3xl font-black" style={{ color: color.primary }}>{player.currentTargetDisplay}</div>
                </div>
              );
            })}
          </div>

          {/* Dartboard */}
          <div className="relative">
            <div className="rounded-3xl p-6" style={{ background: theme.backgrounds.cardHex, border: `2px solid ${game.turnComplete ? theme.stateColors.winner.border : theme.borders.primary}` }}>
              <DartboardSVG
                size={Math.min(550, window.innerWidth - 700)}
                highlightSegment={editingThrowIndex !== null && displayThrows[editingThrowIndex] ? displayThrows[editingThrowIndex].segment : undefined}
                targetSegment={`S${currentTarget}`}
                onSegmentClick={!game.turnComplete ? handleSegmentClick : undefined}
                showClickable={!game.turnComplete && game.status !== 2}
              />
            </div>

            {game.turnComplete && (
              <div className="absolute inset-x-0 -bottom-16 text-center">
                <button onClick={onConfirmTurn} className="px-8 py-4 rounded-xl font-bold text-lg hover:scale-105"
                  style={{ background: theme.stateColors.winner.border, color: theme.backgrounds.baseHex }}>
                  ✓ Continue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="w-80 flex-shrink-0 flex flex-col p-6" style={{ borderLeft: `1px solid ${theme.borders.primary}` }}>
          
          {editingThrowIndex !== null && (
            <div className="mb-4">
              <EditingIndicator editingThrowIndex={editingThrowIndex} onChangToMiss={() => onThrow('MISS', 0, 0)} />
            </div>
          )}

          {!game.turnComplete && (
            <>
              <button onClick={() => setShowManualScoring(!showManualScoring)} className="w-full py-3 rounded-lg font-bold mb-4"
                style={{ background: showManualScoring ? theme.stateColors.active.color : theme.backgrounds.cardHex, color: showManualScoring ? theme.backgrounds.baseHex : theme.text.primary, border: `2px solid ${theme.borders.primary}` }}>
                {showManualScoring ? '▼ Hide' : '▶ Show'} Manual Scoring
              </button>

              {showManualScoring && (
                <div className="flex-1 overflow-auto">
                  <ManualScoringPad onThrow={onThrow} disabled={game.turnComplete || game.status === 2} editingThrowIndex={editingThrowIndex} highlightNumbers={highlightNumbers} compact={true} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};