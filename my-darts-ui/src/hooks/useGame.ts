import { useState, useCallback, useEffect } from 'react';
import { playThrowSound, playGameStartSound } from './useGameSounds';
import { useApi, GameOptions } from './useApi';
import { useSignalR } from './useSignalR';
import { useThrowSource } from './useThrowSource';

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
  const { activateSource, bindToGame, unbind } = useThrowSource();
  
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingThrowIndex, setEditingThrowIndex] = useState<number | null>(null);
  const [playerTotalThrows, setPlayerTotalThrows] = useState<Record<string, {base: number, bonus: number}>>({});

  // Refresh game state from API (used by SignalR handlers)
  const refreshGame = useCallback(async (playSound: boolean = false) => {
    if (!game) return;
    try {
      const oldGame = game;
      const data = await api.getGame(game.gameId);
      console.log('Game refreshed:', data);
      if (data && data.currentTurnThrows) {
        if (playSound && data.currentTurnThrows.length > oldGame.currentTurnThrows.length) {
          playThrowSound(data, oldGame);
        }
        setGame(data);
      }
    } catch (err) {
      console.error('Failed to refresh game:', err);
    }
  }, [game, api]);

  // Confirm turn handler
  const handleConfirmTurn = useCallback(async (bedAllocation?: string, shanghaiAllocation?: string) => {
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
    
    setGame(data);
    setEditingThrowIndex(null);
  }, [game, api]);

  // SignalR event handlers
  const signalRHandlers = {
    onDartThrown: useCallback(() => {
      console.log('Dart thrown event - refreshing game state');
      refreshGame(true);
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
    
    onTakeoutDetected: useCallback(() => {
      console.log('Takeout detected - auto-confirming turn');
      if (game && !game.turnComplete && game.throwsThisTurn > 0) {
        handleConfirmTurn();
      }
    }, [game, handleConfirmTurn]),
  };

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
      
      try {
        await activateSource('autodarts');
        await bindToGame(data.gameId);
        console.log('Autodarts bound to game:', data.gameId);
      } catch (err) {
        console.log('Autodarts not available, using manual input');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleThrow = async (segment: string, multiplier: number, value: number, allocationChoice?: string) => {
    if (!game || game.status === 2) return;
    
    if (editingThrowIndex !== null) {
      const data = await api.editThrow(game.gameId, editingThrowIndex, { 
        segment, value, multiplier, allocationChoice 
      });
      setGame(data);
      setEditingThrowIndex(null);
      return;
    }

    if (game.turnComplete) return;

    const oldGame = game;
    const data = await api.submitThrow(game.gameId, { 
      segment, value, multiplier, allocationChoice 
    });
    
    playThrowSound(data, oldGame);
    
    if (!enableRealtime || !isConnected) {
      setGame(data);
    }
  };

  const handleUndoThrow = async () => {
    if (!game || game.currentTurnThrows.length === 0) return;

    const data = await api.undoThrow(game.gameId);
    
    if (!enableRealtime || !isConnected) {
      setGame(data);
    } else {
      setTimeout(() => refreshGame(), 100);
    }
    setEditingThrowIndex(null);
  };

  const resetGame = () => {
    setGame(null);
    setEditingThrowIndex(null);
    setPlayerTotalThrows({});
    unbind().catch(() => {});
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
