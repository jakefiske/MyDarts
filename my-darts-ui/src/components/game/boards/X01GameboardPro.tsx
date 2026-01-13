import React, { useState } from 'react';
import { GameResponse, ThrowResponse } from '../../../hooks/useGame';
import DartboardSVG from '../controls/DartboardSVG';
import { ManualScoringPad } from '../controls/ManualScoringPad';
import { EditingIndicator } from '../controls/EditingIndicator';
import { useTheme } from '../../../hooks/useThemeContext';

interface X01GameBoardProProps {
  game: GameResponse;
  onThrow: (segment: string, multiplier: number, value: number) => void;
  onConfirmTurn: () => void;
  onUndo: () => void;
  canUndo: boolean;
  displayThrows: ThrowResponse[];
  editingThrowIndex: number | null;
  setEditingThrowIndex: (index: number | null) => void;
}

/**
 * Professional X01 board
 * - MASSIVE scores readable from 10 feet
 * - Adaptive layouts
 * - Minimal chrome
 * - Maximum screen usage
 */
export const X01GameBoardPro: React.FC<X01GameBoardProProps> = ({
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
  const turnScore = displayThrows.reduce((sum, t) => sum + (t.value * t.multiplier), 0);
  
  // Get player color
  const playerColor = theme.playerColors[game.currentPlayerIndex % theme.playerColors.length];

  // Handle dartboard segment click
  const handleSegmentClick = (segment: string, mult: number, value: number) => {
    onThrow(segment, mult, value);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: theme.backgrounds.baseHex }}>
      
      {/* ==================== MOBILE PORTRAIT ==================== */}
      <div className="md:hidden flex flex-col h-full">
        {/* MASSIVE score header */}
        <div className="flex-shrink-0 px-4 py-6 text-center" 
             style={{ background: `${playerColor.primary}11` }}>
          <div className="text-xs font-bold tracking-wider mb-1" 
               style={{ color: theme.text.secondary }}>
            {currentPlayer.name.toUpperCase()}
          </div>
          <div className="text-8xl font-black tracking-tighter" 
               style={{ 
                 color: playerColor.primary,
                 lineHeight: '1',
                 textShadow: `0 0 20px ${playerColor.glow}`
               }}>
            {currentPlayer.score}
          </div>
          {currentPlayer.checkoutSuggestion && (
            <div className="text-sm font-bold mt-2" style={{ color: theme.stateColors.winner.border }}>
              Checkout: {currentPlayer.checkoutSuggestion}
            </div>
          )}
        </div>

        {/* Dartboard */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-square">
            <DartboardSVG
              size={Math.min(window.innerWidth - 32, 500)}
              highlightSegment={editingThrowIndex !== null && displayThrows[editingThrowIndex] ? displayThrows[editingThrowIndex].segment : undefined}
              onSegmentClick={!game.turnComplete ? handleSegmentClick : undefined}
              showClickable={!game.turnComplete && game.status !== 2}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0 p-3 space-y-2" 
             style={{ borderTop: `1px solid ${theme.borders.primary}` }}>
          {/* Turn info */}
          <div className="flex items-center justify-between px-2">
            <div>
              <div className="text-xs" style={{ color: theme.text.secondary }}>Turn Score</div>
              <div className="text-2xl font-black" style={{ color: theme.text.primary }}>
                {turnScore}
              </div>
            </div>
            <div className="flex gap-2">
              {displayThrows.map((throw_, idx) => {
                const isEditing = editingThrowIndex === idx;
                const isLastThrow = idx === displayThrows.length - 1;
                return (
                  <button
                    key={idx}
                    onClick={() => isLastThrow && setEditingThrowIndex(idx)}
                    disabled={!isLastThrow}
                    className="w-14 h-14 rounded-lg font-bold text-sm"
                    style={{
                      background: theme.backgrounds.cardHex,
                      border: `2px solid ${isEditing ? theme.borders.accent : theme.borders.primary}`,
                      color: theme.text.primary,
                      opacity: isLastThrow ? 1 : 0.5,
                      cursor: isLastThrow ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {throw_.segment}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opponents */}
          <div className="flex gap-2 overflow-x-auto">
            {game.players.map((player, idx) => {
              if (idx === game.currentPlayerIndex) return null;
              const color = theme.playerColors[idx % theme.playerColors.length];
              return (
                <div
                  key={player.id}
                  className="flex-shrink-0 px-4 py-2 rounded-lg"
                  style={{
                    background: theme.backgrounds.cardHex,
                    border: `1px solid ${theme.borders.primary}`,
                  }}
                >
                  <div className="text-xs" style={{ color: theme.text.secondary }}>
                    {player.name}
                  </div>
                  <div className="text-xl font-black" style={{ color: color.primary }}>
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== TABLET/DESKTOP LANDSCAPE ==================== */}
      <div className="hidden md:flex h-full">
        {/* Left: Current player - DOMINATE THE SCREEN */}
        <div className="w-96 flex-shrink-0 flex flex-col" 
             style={{ borderRight: `1px solid ${theme.borders.primary}` }}>
          {/* MASSIVE SCORE */}
          <div className="p-8 text-center" style={{ background: `${playerColor.primary}11` }}>
            <div className="text-sm font-bold tracking-wider mb-2" 
                 style={{ color: theme.text.secondary }}>
              NOW PLAYING
            </div>
            <div className="text-5xl font-black mb-6" style={{ color: theme.text.primary }}>
              {currentPlayer.name}
            </div>
            
            <div className="text-sm font-bold tracking-wider mb-2" 
                 style={{ color: theme.text.secondary }}>
              REMAINING
            </div>
            <div 
              className="font-black tracking-tighter mb-6" 
              style={{ 
                fontSize: currentPlayer.score >= 100 ? '8rem' : '10rem',
                color: playerColor.primary,
                lineHeight: '1',
                textShadow: `0 0 30px ${playerColor.glow}`
              }}
            >
              {currentPlayer.score}
            </div>

            {currentPlayer.checkoutSuggestion && (
              <div className="text-lg font-bold px-4 py-2 rounded-lg" 
                   style={{ 
                     background: theme.stateColors.winner.border + '22',
                     color: theme.stateColors.winner.border 
                   }}>
                Checkout: {currentPlayer.checkoutSuggestion}
              </div>
            )}
          </div>

          {/* Turn stats */}
          <div className="p-6" style={{ borderTop: `1px solid ${theme.borders.primary}` }}>
            <div className="text-xs font-bold mb-3" style={{ color: theme.text.secondary }}>
              THIS TURN
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {displayThrows.map((throw_, idx) => {
                const isEditing = editingThrowIndex === idx;
                const isLastThrow = idx === displayThrows.length - 1;
                return (
                  <button
                    key={idx}
                    onClick={() => isLastThrow && setEditingThrowIndex(idx)}
                    disabled={!isLastThrow}
                    className="aspect-square rounded-lg font-bold text-lg transition-all"
                    style={{
                      background: theme.backgrounds.cardHex,
                      border: `2px solid ${isEditing ? theme.borders.accent : theme.borders.primary}`,
                      color: theme.text.primary,
                      opacity: isLastThrow ? 1 : 0.5,
                      cursor: isLastThrow ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {throw_.segment}
                  </button>
                );
              })}
            </div>
            <div className="text-2xl font-black" style={{ color: theme.text.primary }}>
              Total: {turnScore}
            </div>
          </div>

          {/* Other players */}
          <div className="flex-1 p-6 overflow-auto" 
               style={{ borderTop: `1px solid ${theme.borders.primary}` }}>
            <div className="text-xs font-bold mb-3" style={{ color: theme.text.secondary }}>
              OPPONENTS
            </div>
            <div className="space-y-3">
              {game.players.map((player, idx) => {
                if (idx === game.currentPlayerIndex) return null;
                const color = theme.playerColors[idx % theme.playerColors.length];
                return (
                  <div
                    key={player.id}
                    className="p-4 rounded-lg flex items-center justify-between"
                    style={{
                      background: theme.backgrounds.cardHex,
                      border: `2px solid ${theme.borders.primary}`,
                    }}
                  >
                    <div>
                      <div className="text-sm font-bold" style={{ color: theme.text.primary }}>
                        {player.name}
                      </div>
                      {player.checkoutSuggestion && (
                        <div className="text-xs mt-1" style={{ color: theme.stateColors.winner.border }}>
                          {player.checkoutSuggestion}
                        </div>
                      )}
                    </div>
                    <div className="text-4xl font-black" style={{ color: color.primary }}>
                      {player.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Dartboard */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            <div className="rounded-3xl p-6" 
                 style={{ 
                   background: theme.backgrounds.cardHex,
                   border: `2px solid ${game.turnComplete ? theme.stateColors.winner.border : theme.borders.primary}`
                 }}>
              <DartboardSVG
                size={Math.min(600, window.innerWidth - 600)}
                highlightSegment={editingThrowIndex !== null && displayThrows[editingThrowIndex] ? displayThrows[editingThrowIndex].segment : undefined}
                onSegmentClick={!game.turnComplete ? handleSegmentClick : undefined}
                showClickable={!game.turnComplete && game.status !== 2}
              />
            </div>

            {/* Turn complete */}
            {game.turnComplete && (
              <div className="absolute inset-x-0 -bottom-20 text-center">
                <button
                  onClick={onConfirmTurn}
                  className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                  style={{
                    background: theme.stateColors.winner.border,
                    color: theme.backgrounds.baseHex,
                  }}
                >
                  ✓ Continue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-96 flex-shrink-0 flex flex-col p-4" 
             style={{ borderLeft: `1px solid ${theme.borders.primary}` }}>
          
          {/* Editing indicator */}
          {editingThrowIndex !== null && (
            <div className="mb-4">
              <EditingIndicator
                editingThrowIndex={editingThrowIndex}
                onChangToMiss={() => onThrow('MISS', 0, 0)}
              />
            </div>
          )}

          {/* Manual scoring */}
          {!game.turnComplete && (
            <>
              <button
                onClick={() => setShowManualScoring(!showManualScoring)}
                className="w-full py-3 rounded-lg font-bold mb-4 transition-all"
                style={{
                  background: showManualScoring ? theme.stateColors.active.color : theme.backgrounds.cardHex,
                  color: showManualScoring ? theme.backgrounds.baseHex : theme.text.primary,
                  border: `2px solid ${theme.borders.primary}`
                }}
              >
                {showManualScoring ? '▼ Hide' : '▶ Show'} Manual Scoring
              </button>

              {showManualScoring && (
                <div className="flex-1 overflow-auto">
                  <ManualScoringPad
                    onThrow={onThrow}
                    disabled={game.turnComplete || game.status === 2}
                    editingThrowIndex={editingThrowIndex}
                  />
                </div>
              )}
            </>
          )}

          {/* Undo */}
          {canUndo && !showManualScoring && (
            <button
              onClick={onUndo}
              className="w-full py-3 rounded-lg font-bold"
              style={{
                background: theme.backgrounds.cardHex,
                color: theme.text.secondary,
                border: `2px solid ${theme.borders.primary}`
              }}
            >
              ↶ Undo Last Throw
            </button>
          )}
        </div>
      </div>
    </div>
  );
};