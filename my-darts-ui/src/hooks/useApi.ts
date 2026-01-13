const API_URL = '/api/Game';

export interface GameOptions {
  startingScore?: number;
  doubleIn?: boolean;
}

export interface ThrowData {
  segment?: string;  // The dart segment that was hit (e.g., "T20", "D16", "SB", "DB")
  value: number;
  multiplier: number;
  allocationChoice?: string;  // For Mickey Mouse allocation
}

export const useApi = () => {
  const createGame = async (playerNames: string[], gameType: number, options?: GameOptions) => {
    const response = await fetch(`${API_URL}/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerNames,
        gameType,
        startingScore: options?.startingScore,
        doubleIn: options?.doubleIn
      })
    });
    return response.json();
  };

  const getGame = async (gameId: string) => {
    const response = await fetch(`${API_URL}/${gameId}`);
    return response.json();
  };

  const submitThrow = async (gameId: string, dart: ThrowData) => {
    const response = await fetch(`${API_URL}/${gameId}/throw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segment: dart.segment,
        value: dart.value,
        multiplier: dart.multiplier,
        allocationChoice: dart.allocationChoice
      })
    });
    return response.json();
  };

  const editThrow = async (gameId: string, throwIndex: number, dart: ThrowData) => {
    const response = await fetch(`${API_URL}/${gameId}/throw/${throwIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segment: dart.segment,
        value: dart.value,
        multiplier: dart.multiplier,
        allocationChoice: dart.allocationChoice
      })
    });
    return response.json();
  };

  const confirmTurn = async (gameId: string, bedAllocation?: string, shanghaiAllocation?: string) => {
    const response = await fetch(`${API_URL}/${gameId}/confirm-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bedAllocation: bedAllocation,
        shanghaiAllocation: shanghaiAllocation
      })
    });
    return response.json();
  };

  const undoThrow = async (gameId: string) => {
    const response = await fetch(`${API_URL}/${gameId}/undo`, {
      method: 'POST'
    });
    return response.json();
  };

  const getGameTypes = async () => {
    const response = await fetch(`${API_URL}/types`);
    return response.json();
  };

  const getPlayers = async () => {
    const response = await fetch(`${API_URL}/players`);
    return response.json();
  };

  const getPlayerStats = async (playerName: string) => {
    const response = await fetch(`${API_URL}/stats/${encodeURIComponent(playerName)}`);
    return response.json();
  };

  const getGameHistory = async (count: number = 10) => {
    const response = await fetch(`${API_URL}/history?count=${count}`);
    return response.json();
  };

  return {
    createGame,
    getGame,
    submitThrow,
    editThrow,
    confirmTurn,
    undoThrow,
    getGameTypes,
    getPlayers,
    getPlayerStats,
    getGameHistory,
  };
};