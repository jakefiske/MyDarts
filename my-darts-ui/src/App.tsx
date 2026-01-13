import React, { useState } from 'react';
import GameSetup from './components/GameSetup';
import GameBoard from './components/game/boards/GameBoard';
import { X01GameBoardPro } from './components/game/boards/X01GameboardPro';
import { AroundTheClockGameBoardPro } from './components/game/boards/AroundTheClockGameboardPro';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import ThrowDisplay from './components/ui/ThrowDisplay';
import SoundSettings from './components/SoundSettings';
import { ThemeSelector } from './components/ui/ThemeSelector';
import { DartboardControls } from './components/game/controls/DartboardControls';
import { useGame } from './hooks/useGame';
import { ThemeProvider, useTheme } from './hooks/useThemeContext';

type Page = 'game' | 'stats' | 'settings';

// Game type enum
enum GameType {
  AroundTheClockTurbo = 0,
  X01 = 1,
  Cricket = 2,
  MickeyMouse = 3
}

function AppContent() {
  const { theme, themeName, setTheme } = useTheme();
  const [page, setPage] = useState<Page>('game');
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showDartboard, setShowDartboard] = useState(false);

  const {
    game,
    loading,
    startNewGame,
    confirmTurn,
    handleThrow,
    resetGame,
    undoThrow,
    canUndo,
    editingThrowIndex,
    setEditingThrowIndex,
    playerTotalThrows,
  } = useGame();

  if (page === 'stats') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.backgrounds.base}`}>
        <div className="container mx-auto p-4">
          <StatsPage onBack={() => setPage('game')} />
        </div>
      </div>
    );
  }

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('game')} />;
  }

  const displayThrows = game?.currentTurnThrows || [];
  const lastThrow = editingThrowIndex !== null && editingThrowIndex < displayThrows.length
    ? displayThrows[editingThrowIndex]
    : displayThrows[displayThrows.length - 1];

  // Check if we should use the new full-screen boards (X01 or Around the Clock)
  const useNewBoard = game && (game.gameType === GameType.AroundTheClockTurbo || game.gameType === GameType.X01);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: theme.backgrounds.baseHex }}>
      
      {!game ? (
        /* SETUP SCREEN */
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.stateColors.active.color, fontFamily: theme.fonts.display }}>🎯 MyDarts</h1>
              <div className="flex gap-2">
                <button onClick={() => setShowThemeSelector(true)} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🎨</button>
                <button onClick={() => setShowSoundSettings(true)} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🔊</button>
                <button onClick={() => setPage('settings')} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>⚙️</button>
                <button onClick={() => setPage('stats')} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>📊</button>
              </div>
            </div>
            <GameSetup onStartGame={startNewGame} loading={loading} onOpenSettings={() => setPage('settings')} />
          </div>
        </div>
      ) : useNewBoard ? (
        /* ========== PROFESSIONAL BOARDS (X01 & Around the Clock) ========== */
        <div className="fixed inset-0 flex flex-col">
          {/* Minimal top bar for quit only */}
          <div className="flex-shrink-0 flex justify-between items-center px-4 py-2" 
               style={{ borderBottom: `1px solid ${theme.borders.primary}`, background: theme.backgrounds.baseHex }}>
            <button 
              onClick={resetGame}
              className="px-4 py-2 rounded font-bold text-sm transition-all"
              style={{ background: theme.backgrounds.cardHex, color: theme.text.secondary }}
            >
              ← Quit
            </button>
            <div className="text-sm font-bold" style={{ color: theme.text.primary }}>
              {game.currentPlayerName}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowThemeSelector(true)} 
                      className="p-2 rounded" 
                      style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>
                🎨
              </button>
              <button onClick={() => setShowSoundSettings(true)} 
                      className="p-2 rounded" 
                      style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>
                🔊
              </button>
              <button onClick={() => setPage('stats')} 
                      className="p-2 rounded" 
                      style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>
                📊
              </button>
            </div>
          </div>

          {/* Full-screen game board */}
          <div className="flex-1 overflow-hidden">
            {game.gameType === GameType.AroundTheClockTurbo ? (
              <AroundTheClockGameBoardPro
                game={game}
                onThrow={handleThrow}
                onConfirmTurn={() => confirmTurn()}
                onUndo={undoThrow}
                canUndo={canUndo}
                displayThrows={displayThrows}
                editingThrowIndex={editingThrowIndex}
                setEditingThrowIndex={setEditingThrowIndex}
              />
            ) : (
              <X01GameBoardPro
                game={game}
                onThrow={handleThrow}
                onConfirmTurn={() => confirmTurn()}
                onUndo={undoThrow}
                canUndo={canUndo}
                displayThrows={displayThrows}
                editingThrowIndex={editingThrowIndex}
                setEditingThrowIndex={setEditingThrowIndex}
              />
            )}
          </div>
        </div>
      ) : (
        /* ========== EXISTING MICKEY MOUSE / CRICKET LAYOUT ========== */
        <>
          {/* Top bar */}
          <div className="flex-shrink-0 flex justify-between items-center px-3 py-2 border-b" style={{ borderColor: theme.borders.secondary }}>
            <button 
              onClick={resetGame}
              className="px-3 py-1 rounded text-sm font-bold"
              style={{ background: theme.backgrounds.cardHex, color: theme.text.secondary }}
            >
              ← Quit
            </button>
            <div className="text-sm font-bold" style={{ color: theme.text.primary }}>
              {game.currentPlayerName}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowThemeSelector(true)} className="p-1 text-xs rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🎨</button>
              <button onClick={() => setShowSoundSettings(true)} className="p-1 text-xs rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🔊</button>
              <button onClick={() => setPage('stats')} className="p-1 text-xs rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>📊</button>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-1 md:p-2 lg:p-4">
            
            {/* DESKTOP (lg+): 3-column layout */}
            <div className="hidden lg:flex h-full gap-4">
              <div className="flex-shrink-0">
                <DartboardControls
                  gameType={game.gameType}
                  gameStatus={game.status}
                  turnComplete={game.turnComplete}
                  editingThrowIndex={editingThrowIndex}
                  lastThrow={lastThrow}
                  currentTurnThrows={game.currentTurnThrows}
                  onThrow={handleThrow}
                  onConfirmTurn={() => confirmTurn()}
                  bedPendingAllocation={game.bedPendingAllocation}
                  bedNumber={game.bedNumber}
                  onBedAllocation={(allocation) => confirmTurn(allocation, undefined)}
                  shanghaiPendingAllocation={game.shanghaiPendingAllocation}
                  shanghaiNumber={game.shanghaiNumber}
                  onShanghaiAllocation={(s, d, t) => confirmTurn(undefined, `${s},${d},${t}`)}
                />
              </div>

              <div className="flex-shrink-0">
                <ThrowDisplay 
                  throws={displayThrows} 
                  onUndo={undoThrow}
                  canUndo={canUndo}
                  selectedIndex={editingThrowIndex}
                  onSelectThrow={setEditingThrowIndex}
                />
              </div>

              <div className="flex-1 min-w-0">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={resetGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>
            </div>

            {/* TABLET (md-lg): 2-row layout */}
            <div className="hidden md:flex lg:hidden h-full flex-col gap-2">
              <div className="flex gap-2 flex-shrink-0" style={{ maxHeight: '45vh' }}>
                <div className="flex-shrink-0">
                  <DartboardControls
                    gameType={game.gameType}
                    gameStatus={game.status}
                    turnComplete={game.turnComplete}
                    editingThrowIndex={editingThrowIndex}
                    lastThrow={lastThrow}
                    currentTurnThrows={game.currentTurnThrows}
                    onThrow={handleThrow}
                    onConfirmTurn={() => confirmTurn()}
                    bedPendingAllocation={game.bedPendingAllocation}
                    bedNumber={game.bedNumber}
                    onBedAllocation={(allocation) => confirmTurn(allocation, undefined)}
                    shanghaiPendingAllocation={game.shanghaiPendingAllocation}
                    shanghaiNumber={game.shanghaiNumber}
                    onShanghaiAllocation={(s, d, t) => confirmTurn(undefined, `${s},${d},${t}`)}
                  />
                </div>
                <div className="flex-1 overflow-auto">
                  <ThrowDisplay 
                    throws={displayThrows} 
                    onUndo={undoThrow}
                    canUndo={canUndo}
                    selectedIndex={editingThrowIndex}
                    onSelectThrow={setEditingThrowIndex}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={resetGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>
            </div>

            {/* MOBILE (<md): Scoreboard + input bar */}
            <div className="md:hidden h-full flex flex-col">
              
              {/* SCOREBOARD - takes all space */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={resetGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>

              {/* INPUT BAR - Shows last 3 throws + entry button */}
              <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: theme.borders.secondary, backgroundColor: theme.backgrounds.cardHex }}>
                <div className="flex items-center gap-2">
                  {/* Last 3 throws - tap to edit */}
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => {
                      const throw_ = displayThrows[i];
                      const isEditing = editingThrowIndex === i;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (throw_) {
                              setEditingThrowIndex(i);
                              setShowDartboard(true);
                            }
                          }}
                          className="w-12 h-12 rounded flex items-center justify-center text-xs font-bold border-2"
                          style={{
                            background: throw_ ? theme.backgrounds.baseHex : 'transparent',
                            borderColor: isEditing ? theme.stateColors.active.border : theme.borders.secondary,
                            color: throw_ ? theme.text.primary : theme.text.muted
                          }}
                        >
                          {throw_ ? throw_.segment : '-'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Enter button */}
                  <button
                    onClick={() => {
                      setEditingThrowIndex(null);
                      setShowDartboard(true);
                    }}
                    className="flex-1 py-3 rounded-lg font-bold text-sm"
                    style={{
                      background: `linear-gradient(to right, ${theme.stateColors.active.gradient})`,
                      color: theme.text.primary,
                      border: `2px solid ${theme.stateColors.active.border}`
                    }}
                  >
                    {game.throwsThisTurn === 3 ? 'Confirm Turn' : `Enter Dart ${game.throwsThisTurn + 1}`}
                  </button>

                  {/* Undo button */}
                  {canUndo && (
                    <button
                      onClick={undoThrow}
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{
                        background: theme.backgrounds.baseHex,
                        color: theme.text.secondary,
                        border: `1px solid ${theme.borders.secondary}`
                      }}
                    >
                      ↶
                    </button>
                  )}
                </div>
              </div>

              {/* DARTBOARD OVERLAY - for input/editing */}
              {showDartboard && (
                <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
                  {/* Header */}
                  <div className="flex-shrink-0 flex justify-between items-center p-3 border-b" style={{ borderColor: theme.borders.secondary }}>
                    <button
                      onClick={() => {
                        setShowDartboard(false);
                        setEditingThrowIndex(null);
                      }}
                      className="px-4 py-2 rounded font-bold"
                      style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
                    >
                      ← Close
                    </button>
                    <div className="text-sm font-bold" style={{ color: theme.text.primary }}>
                      {editingThrowIndex !== null ? `Edit Dart ${editingThrowIndex + 1}` : `Dart ${game.throwsThisTurn + 1}/3`}
                    </div>
                    <div className="w-16"></div>
                  </div>

                  {/* Dartboard */}
                  <div className="flex-1 flex items-center justify-center overflow-auto">
                    <DartboardControls
                      gameType={game.gameType}
                      gameStatus={game.status}
                      turnComplete={game.turnComplete}
                      editingThrowIndex={editingThrowIndex}
                      lastThrow={lastThrow}
                      currentTurnThrows={game.currentTurnThrows}
                      onThrow={(seg, mult, val, alloc) => {
                        handleThrow(seg, mult, val, alloc);
                        // Close after throw entry (not editing)
                        if (editingThrowIndex === null) {
                          setShowDartboard(false);
                        }
                      }}
                      onConfirmTurn={() => {
                        confirmTurn();
                        setShowDartboard(false);
                      }}
                      bedPendingAllocation={game.bedPendingAllocation}
                      bedNumber={game.bedNumber}
                      onBedAllocation={(allocation) => {
                        confirmTurn(allocation, undefined);
                        setShowDartboard(false);
                      }}
                      shanghaiPendingAllocation={game.shanghaiPendingAllocation}
                      shanghaiNumber={game.shanghaiNumber}
                      onShanghaiAllocation={(s, d, t) => {
                        confirmTurn(undefined, `${s},${d},${t}`);
                        setShowDartboard(false);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showThemeSelector && (
        <ThemeSelector 
          currentTheme={themeName}
          onThemeChange={(name) => {
            setTheme(name);
            setShowThemeSelector(false);
          }}
          onClose={() => setShowThemeSelector(false)} 
        />
      )}
      {showSoundSettings && <SoundSettings onClose={() => setShowSoundSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;