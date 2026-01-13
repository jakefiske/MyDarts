import { useState, useCallback } from 'react';
import { playThrowSound, playGameStartSound } from './useGameSounds';
import { useApi, GameOptions } from './useApi';
import { useSignalR } from './useSignalR';

export interface PlayerResponse {
  id: string;
  name: string;
  position: number;
  currentTargetDisplay: string;
  throwCount: number;
  isWinner: boolean;
  checkoutSuggestion?: string | null;
  requiresDoubleIn: boolean;
  cricketMarks?: { [key: number]: number };
  score: number;
  
  // Mickey Mouse specific
  mickeyMouseData?: {
    numberMarks: { [key: number]: number };
    doublesMarks: number;
    triplesMarks: number;
    bedsMarks: number;
    bullMarks: number;
  };
}

export interface ThrowResponse {
  throwNumber: number;
  segment: string;
  value: number;
  multiplier: number;
}

export interface GameResponse {
  gameId: string;
  gameType: number;
  status: number;
  players: PlayerResponse[];
  currentPlayerIndex: number;
  currentPlayerName: string | null;
  throwsThisTurn: number;
  consecutiveHits: number;
  isOnStreak: boolean;
  turnComplete: boolean;
  winnerName: string | null;
  currentTurnThrows: ThrowResponse[];
  lastThrowMessage: string | null;
  
  // Mickey Mouse bed/shanghai
  bedPendingAllocation?: boolean;
  bedNumber?: number;
  shanghaiPendingAllocation?: boolean;
  shanghaiNumber?: number;  
}

export function useGame(enableRealtime: boolean = true) {
  const api = useApi();
  
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingThrowIndex, setEditingThrowIndex] = useState<number | null>(null);
  const [playerTotalThrows, setPlayerTotalThrows] = useState<Record<string, {base: number, bonus: number}>>({});

  // Refresh game state from API (used by SignalR handlers)
  const refreshGame = useCallback(async (playSound: boolean = false) => {
    if (!game) return;
    try {
      const oldGame = game; // Capture old state for sound comparison
      const data = await api.getGame(game.gameId);
      console.log('Game refreshed:', data);
      if (data && data.currentTurnThrows) {
        // Play sound if requested (for Autodarts throws via SignalR)
        if (playSound && data.currentTurnThrows.length > oldGame.currentTurnThrows.length) {
          playThrowSound(data, oldGame);
        }
        setGame(data);
      }
    } catch (err) {
      console.error('Failed to refresh game:', err);
    }
  }, [game, api]);

  // SignalR event handlers
  const signalRHandlers = {
    onDartThrown: useCallback(() => {
      console.log('Dart thrown event - refreshing game state');
      refreshGame(true); // Play sound for Autodarts throws
    }, [refreshGame]),
    
    onGameWon: useCallback(() => {
      console.log('Game won event - refreshing game state');
      refreshGame();
    }, [refreshGame]),
    
    onStreakStarted: useCallback(() => {
      console.log('Streak started event - refreshing game state');
      refreshGame();
    }, [refreshGame]),
    
    onTurnEnded: useCallback(() => {
      console.log('Turn ended event - refreshing game state');
      refreshGame();
    }, [refreshGame]),
  };

  // Connect to SignalR if enabled
  const { connectionState, isConnected } = useSignalR(
    enableRealtime && game ? game.gameId : null,
    signalRHandlers
  );

  const startNewGame = async (playerNames: string[], gameType: number = 0, options?: GameOptions) => {
    setLoading(true);
    try {
      const data = await api.createGame(playerNames, gameType, options);
      setGame(data);
      setEditingThrowIndex(null);
      setPlayerTotalThrows({});
      playGameStartSound();
    } finally {
      setLoading(false);
    }
  };

  const handleThrow = async (segment: string, multiplier: number, value: number, allocationChoice?: string) => {
    if (!game || game.status === 2) return;
    
    // If editing
    if (editingThrowIndex !== null) {
      const data = await api.editThrow(game.gameId, editingThrowIndex, { 
        segment,
        value, 
        multiplier,
        allocationChoice 
      });
      setGame(data);
      setEditingThrowIndex(null);
      return;
    }

    // Block new throws when turn is complete
    if (game.turnComplete) return;

    // Store old game state for sound comparison
    const oldGame = game;

    // Normal throw
    const data = await api.submitThrow(game.gameId, { 
      segment,
      value, 
      multiplier,
      allocationChoice 
    });
    
    // ALWAYS play sound immediately when throwing
    playThrowSound(data, oldGame);
    
    // Only update state locally if NOT using SignalR (SignalR will broadcast the update)
    if (!enableRealtime || !isConnected) {
      setGame(data);
    }
  };

  const handleConfirmTurn = async (bedAllocation?: string, shanghaiAllocation?: string) => {
    if (!game) return;
    
    console.log('=== handleConfirmTurn START ===', { bedAllocation, shanghaiAllocation });
    
    // Add current turn's throws to player's totals
    const currentPlayer = game.players[game.currentPlayerIndex];
    const totalThrows = game.throwsThisTurn;
    const baseThrows = Math.min(totalThrows, 3);
    const bonusThrows = Math.max(0, totalThrows - 3);
    
    setPlayerTotalThrows(prev => {
      const existing = prev[currentPlayer.id] || { base: 0, bonus: 0 };
      return {
        ...prev,
        [currentPlayer.id]: { 
          base: existing.base + baseThrows, 
          bonus: existing.bonus + bonusThrows 
        }
      };
    });
    
    const data = await api.confirmTurn(game.gameId, bedAllocation, shanghaiAllocation);
    
    console.log('=== handleConfirmTurn COMPLETE ===', data);
    
    // ALWAYS update state immediately after confirmTurn completes
    // This prevents race condition with SignalR TurnEndedEvent
    setGame(data);
    setEditingThrowIndex(null);
  };

  const handleUndoThrow = async () => {
    if (!game || game.currentTurnThrows.length === 0) return;

    const data = await api.undoThrow(game.gameId);
    
    // ALWAYS update state (either from API or SignalR will refresh)
    if (!enableRealtime || !isConnected) {
      setGame(data);
    } else {
      // Force refresh after undo when using SignalR
      setTimeout(() => refreshGame(), 100);
    }
    setEditingThrowIndex(null);
  };

  const resetGame = () => {
    setGame(null);
    setEditingThrowIndex(null);
    setPlayerTotalThrows({});
  };

  return {
    // State
    game,
    loading,
    editingThrowIndex,
    playerTotalThrows,
    
    // SignalR state
    connectionState,
    isRealtimeConnected: isConnected,
    
    // Actions
    startNewGame,
    handleThrow,
    confirmTurn: handleConfirmTurn,
    undoThrow: handleUndoThrow,
    resetGame,
    setEditingThrowIndex,
    
    // Computed
    displayThrows: game?.currentTurnThrows || [],
    isGameOver: game?.status === 2,
    canUndo: ((game?.currentTurnThrows?.length ?? 0) > 0) && game?.status !== 2,
  };
}