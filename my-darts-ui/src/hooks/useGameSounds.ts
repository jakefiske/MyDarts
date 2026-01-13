import { soundManager } from '../utils/SoundManager';

interface ThrowResponse {
  throwNumber: number;
  segment: string;
  value: number;
  multiplier: number;
}

interface PlayerResponse {
  id: string;
  name: string;
  position: number;
  currentTargetDisplay: string;
  throwCount: number;
  isWinner: boolean;
}

interface GameResponse {
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
}

const calculateTurnScore = (throws: ThrowResponse[]): number => {
  return throws.reduce((sum, t) => sum + (t.value * t.multiplier), 0);
};

// Random miss sound - keeps it fresh
const playMissSound = () => {
  const sounds = ['miss', 'ustoopid', 'ustoopid']; // 2/3 chance of "u stoopid"
  const random = sounds[Math.floor(Math.random() * sounds.length)];
  soundManager.play(random);
};

// When streak ends - extra salt
const playStreakEndSound = () => {
  soundManager.stopMusic();
  const sounds = ['ustoopid', 'nelsonLaugh', 'miss'];
  const random = sounds[Math.floor(Math.random() * sounds.length)];
  soundManager.play(random);
};

export const playThrowSound = (newGame: GameResponse, oldGame: GameResponse) => {
  // Safety check - bail if no throws array
  if (!newGame.currentTurnThrows || newGame.currentTurnThrows.length === 0) {
    return;
  }

  const lastThrow = newGame.currentTurnThrows[newGame.currentTurnThrows.length - 1];

  // If was on fire but streak ended - extra punishment!
  if (oldGame.isOnStreak && !newGame.isOnStreak) {
    playStreakEndSound();
    return;
  }

  // Check for bust
  if (newGame.lastThrowMessage?.includes('BUST')) {
    soundManager.stopMusic();
    soundManager.play('bust');
    return;
  }

  // Check for explicit miss (off board) - ALWAYS PLAY MISS SOUND
  if (lastThrow?.segment === 'SMISS' || 
      lastThrow?.segment === 'MISS' || 
      lastThrow?.segment === 'S0' ||  // ADD THIS LINE
      (lastThrow?.value === 0 && lastThrow?.multiplier === 0)) {
    playMissSound();
    return;
  }

  // Check for checkout/win
  if (newGame.winnerName && !oldGame.winnerName) {
    soundManager.stopMusic();
    soundManager.play('checkout');
    return;
  }

  // Check for double-in achieved
  if (newGame.lastThrowMessage?.includes('Game on')) {
    soundManager.play('doubleIn');
    return;
  }

  // X01: Check for high scores on 3rd dart
  if (newGame.gameType === 1 && newGame.currentTurnThrows.length === 3) {
    const turnScore = calculateTurnScore(newGame.currentTurnThrows);
    
    if (turnScore === 180) {
      soundManager.play('oneEighty');
      return;
    } else if (turnScore >= 140) {
      soundManager.play('oneFourty');
      return;
    } else if (turnScore >= 100) {
      soundManager.play('ton');
      return;
    }
  }

  // Check for bull hit
  if (lastThrow?.value === 25) {
    soundManager.play('bull');
    return;
  }

  // Around the Clock: Check for streak
  if (newGame.gameType === 0) {
    // Streak just started (3 consecutive hits) - START THE ROCKY MUSIC!
    if (newGame.consecutiveHits === 3 && oldGame.consecutiveHits === 2) {
      soundManager.startMusic('rockyTheme');
      soundManager.play('ohhhh');
      return;
    }
    
    // On fire - continuing streak, rocky keeps playing
    if (newGame.isOnStreak && newGame.consecutiveHits > oldGame.consecutiveHits) {
      soundManager.play('hit');
      return;
    }

    // Check if position advanced (hit)
    const newPlayer = newGame.players[newGame.currentPlayerIndex];
    const oldPlayer = oldGame.players[oldGame.currentPlayerIndex];
    
    if (newGame.currentPlayerIndex === oldGame.currentPlayerIndex && newPlayer && oldPlayer) {
      if (parseInt(newPlayer.currentTargetDisplay) > parseInt(oldPlayer.currentTargetDisplay) ||
          newPlayer.currentTargetDisplay !== oldPlayer.currentTargetDisplay) {
        soundManager.play('hit');
      } else {
        // REMOVED - Don't play miss here, already handled above
      }
    }
    return;
  }

  // X01: Default hit sound (miss already handled above)
  if (newGame.gameType === 1) {
    if (!newGame.lastThrowMessage?.includes('Need DOUBLE')) {
      soundManager.play('hit');
    }
  }
};

export const playGameStartSound = () => {
  soundManager.play('gameStart');
};

export const playTurnEndSound = () => {
  soundManager.play('turnEnd');
};

export const playNelsonLaugh = () => {
  soundManager.play('nelsonLaugh');
};