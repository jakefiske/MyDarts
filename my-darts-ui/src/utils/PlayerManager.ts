// Player management using API

export interface SavedPlayer {
  id: number;
  name: string;
  createdAt: string;
  lastPlayedAt?: string;
  gamesPlayed: number;
  preferredGameType?: number;
  notes?: string;
}

export interface AppSettings {
  // Game defaults
  defaultGameType: number;
  defaultX01Score: number;
  defaultDoubleIn: boolean;
  defaultMickeyMouseRange: number;
  defaultIncludeDoubles: boolean;
  defaultIncludeTriples: boolean;
  defaultIncludeBeds: boolean;
  
  // UI preferences
  soundEnabled: boolean;
  soundVolume: number;
}

const SETTINGS_KEY = 'mydarts_settings';
const API_BASE = '/api/player';

const defaultSettings: AppSettings = {
  defaultGameType: 3, // Mickey Mouse
  defaultX01Score: 501,
  defaultDoubleIn: false,
  defaultMickeyMouseRange: 12,
  defaultIncludeDoubles: true,
  defaultIncludeTriples: true,
  defaultIncludeBeds: true,
  soundEnabled: true,
  soundVolume: 0.5,
};

export class PlayerManager {
  
  // ========== PLAYERS (API-based) ==========
  
  static async getPlayers(): Promise<SavedPlayer[]> {
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) throw new Error('Failed to fetch players');
      return await response.json();
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  static async savePlayer(player: { name: string; preferredGameType?: number; notes?: string }): Promise<SavedPlayer | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('A player with this name already exists');
        }
        throw new Error('Failed to save player');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving player:', error);
      throw error;
    }
  }

  static async updatePlayer(id: number, updates: { name?: string; preferredGameType?: number; notes?: string }): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Another player with this name already exists');
        }
        throw new Error('Failed to update player');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  static async deletePlayer(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete player');
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }

  static async getPlayerById(id: number): Promise<SavedPlayer | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching player:', error);
      return null;
    }
  }

  static async trackPlayerUsage(playerNames: string[]): Promise<void> {
    try {
      await fetch(`${API_BASE}/track-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerNames }),
      });
    } catch (error) {
      console.error('Error tracking player usage:', error);
    }
  }

  // ========== RECENT PLAYERS ==========
  
  static async getRecentPlayers(limit: number = 6): Promise<SavedPlayer[]> {
    try {
      const response = await fetch(`${API_BASE}/recent?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recent players');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent players:', error);
      return [];
    }
  }

  // ========== SETTINGS (localStorage - local to device) ==========
  
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  static updateSettings(updates: Partial<AppSettings>): void {
    const settings = this.getSettings();
    const newSettings = { ...settings, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }

  static resetSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  }

  // ========== UTILITY ==========
  
  static async exportData(): Promise<string> {
    const players = await this.getPlayers();
    return JSON.stringify({
      players,
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    });
  }

  static async importData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      
      // Import settings
      if (data.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      }
      
      // Import players (create new ones in API)
      if (data.players && Array.isArray(data.players)) {
        for (const player of data.players) {
          try {
            await this.savePlayer({ 
              name: player.name,
              preferredGameType: player.preferredGameType,
              notes: player.notes 
            });
          } catch (error) {
            console.warn(`Failed to import player ${player.name}:`, error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  static async clearAllData(): Promise<void> {
    // Clear settings
    localStorage.removeItem(SETTINGS_KEY);
    
    // Delete all players from API
    try {
      const players = await this.getPlayers();
      for (const player of players) {
        await this.deletePlayer(player.id);
      }
    } catch (error) {
      console.error('Error clearing players:', error);
    }
  }
}