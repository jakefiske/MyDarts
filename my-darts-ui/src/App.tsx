import React, { useState } from 'react';
import { AppShell, View } from './components/AppShell';
import GameSetup from './components/GameSetup';
import GameBoard from './components/game/boards/GameBoard';
import { X01GameBoardPro } from './components/game/boards/X01GameboardPro';
import { AroundTheClockGameBoardPro } from './components/game/boards/AroundTheClockGameboardPro';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/settings/SettingsPage';
import SoundSettings from './components/SoundSettings';
import { ThemeSelector } from './components/ui/ThemeSelector';
import { DartboardControls } from './components/game/controls/DartboardControls';
import { useGame } from './hooks/useGame';
import { ThemeProvider, useTheme } from './hooks/useThemeContext';
import { FullscreenButton } from './components/ui/FullscreenButton';

// Game type enum
enum GameType {
  AroundTheClockTurbo = 0,
  X01 = 1,
  Cricket = 2,
  MickeyMouse = 3
}

function AppContent() {
  const { theme, themeName, setTheme } = useTheme();
  const [currentView, setCurrentView] = useState<View>('home');
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

  // Navigation handler
  const handleNavigate = (view: View) => {
    if (view === 'home' && game) {
      // If navigating to home while in game, ask to quit
      if (window.confirm('Quit current game?')) {
        resetGame();
        setCurrentView('home');
      }
    } else {
      setCurrentView(view);
    }
  };

  // When game starts, switch to game view
  const handleStartGame = async (players: string[], gameType: number, options?: any) => {
    await startNewGame(players, gameType, options);
    setCurrentView('game');
  };

  // When game ends/quits, go back to home
  const handleQuitGame = () => {
    resetGame();
    setCurrentView('home');
  };

  const isInGame = !!game && currentView === 'game';
  const displayThrows = game?.currentTurnThrows || [];
  const lastThrow = editingThrowIndex !== null && editingThrowIndex < displayThrows.length
    ? displayThrows[editingThrowIndex]
    : displayThrows[displayThrows.length - 1];

  // Check if we should use the new full-screen boards
  const useNewBoard = game && (game.gameType === GameType.AroundTheClockTurbo || game.gameType === GameType.X01);

  const renderContent = () => {
    // Settings view
    if (currentView === 'settings') {
      return <SettingsPage onBack={() => setCurrentView('home')} />;
    }

    // Stats view
    if (currentView === 'stats') {
      return (
        <div className="h-full overflow-auto p-4">
          <StatsPage onBack={() => setCurrentView('home')} />
        </div>
      );
    }

    // Game view (when actively playing)
    if (currentView === 'game' && game) {
      // Professional boards (X01 & Around the Clock)
      if (useNewBoard) {
        return (
          <div className="h-full flex flex-col">
            {/* Minimal top bar */}
            <div 
              className="flex-shrink-0 flex justify-between items-center px-4 py-2"
              style={{ borderBottom: `1px solid ${theme.borders.primary}` }}
            >
              <button 
                onClick={handleQuitGame}
                className="px-4 py-2 rounded font-bold text-sm"
                style={{ background: theme.backgrounds.cardHex, color: theme.text.secondary }}
              >
                ← Quit
              </button>
              <div className="text-sm font-bold" style={{ color: theme.text.primary }}>
                {game.currentPlayerName}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowThemeSelector(true)} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🎨</button>
                <button onClick={() => setShowSoundSettings(true)} className="p-2 rounded" style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}>🔊</button>
              </div>
            </div>

            {/* Game board */}
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
        );
      }

      // Mickey Mouse / Cricket layout
      return (
        <div className="h-full flex flex-col">
          {/* Top bar */}
          <div 
            className="flex-shrink-0 flex justify-between items-center px-3 py-2 border-b" 
            style={{ borderColor: theme.borders.secondary }}
          >
            <button 
              onClick={handleQuitGame}
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

              <div className="flex-1 min-w-0">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={handleQuitGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>

              <div className="w-48 flex-shrink-0 flex flex-col gap-2">
                {displayThrows.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setEditingThrowIndex(i)}
                    className="p-3 rounded-lg text-center font-bold transition"
                    style={{
                      background: editingThrowIndex === i ? theme.stateColors.active.color : theme.backgrounds.cardHex,
                      color: theme.text.primary,
                      border: `2px solid ${editingThrowIndex === i ? theme.stateColors.active.border : theme.borders.secondary}`
                    }}
                  >
                    Dart {i + 1}: {t.segment}
                  </button>
                ))}
                {displayThrows.length < 3 && (
                  <div className="p-3 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex, color: theme.text.muted }}>
                    Dart {displayThrows.length + 1}: -
                  </div>
                )}
                
                <div className="flex-1" />
                
                {canUndo && (
                  <button
                    onClick={undoThrow}
                    className="p-3 rounded-lg font-bold"
                    style={{ background: theme.backgrounds.cardHex, color: theme.text.secondary }}
                  >
                    ↶ Undo
                  </button>
                )}
              </div>
            </div>

            {/* TABLET (md-lg): 2-column layout */}
            <div className="hidden md:flex lg:hidden h-full gap-2">
              <div className="flex-1 min-w-0">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={handleQuitGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>
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
            </div>

            {/* MOBILE (<md): Scoreboard + input bar */}
            <div className="md:hidden h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GameBoard
                  players={game.players}
                  currentPlayerIndex={game.currentPlayerIndex}
                  currentPlayerName={game.currentPlayerName}
                  throwsThisTurn={game.throwsThisTurn}
                  consecutiveHits={game.consecutiveHits}
                  isOnStreak={game.isOnStreak}
                  winnerName={game.winnerName}
                  onNewGame={handleQuitGame}
                  playerTotalThrows={playerTotalThrows}
                  gameType={game.gameType}
                  lastThrowMessage={game.lastThrowMessage}
                />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: theme.borders.secondary, backgroundColor: theme.backgrounds.cardHex }}>
                <div className="flex items-center gap-2">
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

              {/* Dartboard overlay for mobile */}
              {showDartboard && (
                <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
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
        </div>
      );
    }

    // Home view (game setup)
    return (
      <div className="h-full overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-3xl font-bold"
              style={{ color: theme.stateColors.active.color, fontFamily: theme.fonts.display }}
            >
              🎯 MyDarts
            </h1>
          </div>
          <GameSetup 
            onStartGame={handleStartGame} 
            loading={loading} 
            onOpenSettings={() => setCurrentView('settings')} 
          />
        </div>
      </div>
    );
  };

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      isInGame={isInGame}
    >
      {renderContent()}

      {/* Modals */}
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

      {/* Fullscreen Toggle */}
      <FullscreenButton />
    </AppShell>
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