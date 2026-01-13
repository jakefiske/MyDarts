import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useThemeContext';
import { PlayerManager, SavedPlayer } from '../utils/PlayerManager';

interface GameTypeInfo {
  gameType: number;
  displayName: string;
  description: string;
}

interface GameSetupProps {
  onStartGame: (playerNames: string[], gameType: number, options?: any) => void;
  loading: boolean;
  onOpenSettings: () => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, loading, onOpenSettings }) => {
  const { theme } = useTheme();
  const api = useApi();
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | null)[]>([null, null]);
  const [gameTypes, setGameTypes] = useState<GameTypeInfo[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<number>(0);
  
  // Saved players
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<SavedPlayer[]>([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState<number | null>(null);
  
  // X01 options
  const [startingScore, setStartingScore] = useState<number>(501);
  const [doubleIn, setDoubleIn] = useState<boolean>(false);

  // Mickey Mouse options
  const [lowestNumber, setLowestNumber] = useState<number>(12);
  const [includeDoubles, setIncludeDoubles] = useState<boolean>(true);
  const [includeTriples, setIncludeTriples] = useState<boolean>(true);
  const [includeBeds, setIncludeBeds] = useState<boolean>(true);

  useEffect(() => {
    // Load game types
    api.getGameTypes()
      .then(data => {
        setGameTypes(data);
        if (data.length > 0) {
          setSelectedGameType(data[0].gameType);
        }
      })
      .catch(err => console.error('Failed to fetch game types:', err));

    // Load saved players and settings
    loadPlayersAndSettings();
  }, []);

  const loadPlayersAndSettings = async () => {
    setSavedPlayers(await PlayerManager.getPlayers());
    setRecentPlayers(await PlayerManager.getRecentPlayers(6));
    
    // Load default settings
    const settings = PlayerManager.getSettings();
    setStartingScore(settings.defaultX01Score);
    setDoubleIn(settings.defaultDoubleIn);
    setLowestNumber(settings.defaultMickeyMouseRange);
    setIncludeDoubles(settings.defaultIncludeDoubles);
    setIncludeTriples(settings.defaultIncludeTriples);
    setIncludeBeds(settings.defaultIncludeBeds);
  };

  const handleAddPlayer = () => {
    setPlayerNames([...playerNames, '']);
    setSelectedPlayerIds([...selectedPlayerIds, null]);
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
      setSelectedPlayerIds(selectedPlayerIds.filter((_, i) => i !== index));
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    
    // Clear selected player ID if manually typing
    const newIds = [...selectedPlayerIds];
    newIds[index] = null;
    setSelectedPlayerIds(newIds);
  };

  const handleSelectPlayer = (index: number, player: SavedPlayer) => {
    const newNames = [...playerNames];
    newNames[index] = player.name;
    setPlayerNames(newNames);
    
    const newIds = [...selectedPlayerIds];
    newIds[index] = player.id;
    setSelectedPlayerIds(newIds);
    
    setShowPlayerPicker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = playerNames.filter(name => name.trim() !== '');
    
    // Track which saved players were used
    const usedPlayerIds = selectedPlayerIds
      .filter((id, i) => id && playerNames[i].trim())
      .filter((id): id is number => id !== null);
    
    if (usedPlayerIds.length > 0) {
      // Get player names for the IDs
      const usedPlayerNames = usedPlayerIds
        .map(id => savedPlayers.find(p => p.id === id)?.name)
        .filter((name): name is string => name !== undefined);
      
      await PlayerManager.trackPlayerUsage(usedPlayerNames);
    }
    
    let options = undefined;
    if (selectedGameType === 1) {
      options = { startingScore, doubleIn };
    } else if (selectedGameType === 3) {
      options = {
        mickeyMouseOptions: {
          lowestNumber,
          includeDoubles,
          includeTriples,
          includeBeds
        }
      };
    }
    
    onStartGame(validNames.length > 0 ? validNames : ['Player 1'], selectedGameType, options);
  };

  const selectedGame = gameTypes.find(g => g.gameType === selectedGameType);
  const isX01 = selectedGameType === 1;
  const isMickeyMouse = selectedGameType === 3;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Players Section */}
        <div className="rounded-lg md:rounded-2xl p-4 md:p-6 border-2"
             style={{
               background: theme.backgrounds.cardHex,
               borderColor: theme.borders.primary
             }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold"
                style={{ color: theme.stateColors.active.color, fontFamily: theme.fonts.display }}>
              Players
            </h2>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1 rounded text-sm"
              style={{
                background: theme.backgrounds.baseHex,
                color: theme.text.secondary
              }}
            >
              ⚙️ Manage
            </button>
          </div>

          {/* Recent Players Quick Select */}
          {recentPlayers.length > 0 && (
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: theme.text.muted }}>Recent:</div>
              <div className="flex flex-wrap gap-2">
                {recentPlayers.map(player => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      // Find first empty slot or add new
                      const emptyIndex = playerNames.findIndex(n => !n.trim());
                      if (emptyIndex !== -1) {
                        handleSelectPlayer(emptyIndex, player);
                      } else {
                        setPlayerNames([...playerNames, player.name]);
                        setSelectedPlayerIds([...selectedPlayerIds, player.id]);
                      }
                    }}
                    className="px-3 py-1 rounded text-sm font-bold"
                    style={{
                      background: theme.backgrounds.baseHex,
                      color: theme.text.primary,
                      border: `1px solid ${theme.borders.secondary}`
                    }}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {playerNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    onFocus={() => setShowPlayerPicker(index)}
                    placeholder={`Player ${index + 1}`}
                    className="w-full rounded px-3 py-2 md:py-3 focus:outline-none focus:ring-2 border-2 text-sm md:text-base"
                    style={{
                      background: `${theme.backgrounds.baseHex}88`,
                      color: theme.text.primary,
                      borderColor: theme.borders.primary
                    }}
                  />
                  
                  {/* Player Picker Dropdown */}
                  {showPlayerPicker === index && savedPlayers.length > 0 && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-lg border-2 shadow-xl max-h-48 overflow-auto"
                      style={{
                        background: theme.backgrounds.cardHex,
                        borderColor: theme.borders.primary
                      }}
                    >
                      {savedPlayers
                        .filter(p => !name || p.name.toLowerCase().includes(name.toLowerCase()))
                        .map(player => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => handleSelectPlayer(index, player)}
                            className="w-full px-3 py-2 text-left hover:opacity-80 border-b text-sm"
                            style={{
                              background: theme.backgrounds.baseHex,
                              color: theme.text.primary,
                              borderColor: theme.borders.secondary
                            }}
                          >
                            <div className="font-bold">{player.name}</div>
                            <div className="text-xs" style={{ color: theme.text.muted }}>
                              {player.gamesPlayed} games
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                
                {playerNames.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="px-3 md:px-4 py-2 md:py-3 rounded transition border-2 text-sm md:text-base"
                    style={{
                      background: `linear-gradient(to right, ${theme.stateColors.bust.gradient})`,
                      borderColor: theme.stateColors.bust.border,
                      color: theme.text.primary
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddPlayer}
            className="mt-3 w-full px-4 py-2 md:py-3 rounded transition border-2 text-sm md:text-base"
            style={{
              background: `${theme.backgrounds.baseHex}88`,
              borderColor: theme.borders.secondary,
              color: theme.text.primary
            }}
          >
            + Add Player
          </button>
        </div>

        {/* Game Type Selection */}
        <div className="rounded-lg md:rounded-2xl p-4 md:p-6 border-2"
             style={{
               background: theme.backgrounds.cardHex,
               borderColor: theme.borders.primary
             }}>
          <h2 className="text-xl md:text-2xl font-bold mb-4"
              style={{ color: theme.stateColors.active.color, fontFamily: theme.fonts.display }}>
            Select Game
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {gameTypes.map((game) => (
              <button
                key={game.gameType}
                type="button"
                onClick={() => setSelectedGameType(game.gameType)}
                className="py-3 md:py-4 rounded-lg font-bold transition border-4 text-sm md:text-base"
                style={{
                  background: selectedGameType === game.gameType
                    ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
                    : `${theme.backgrounds.baseHex}88`,
                  borderColor: selectedGameType === game.gameType ? theme.stateColors.active.border : theme.borders.secondary,
                  color: theme.text.primary,
                  boxShadow: selectedGameType === game.gameType ? `0 0 20px ${theme.stateColors.active.glow}` : 'none',
                  transform: selectedGameType === game.gameType ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {game.displayName}
              </button>
            ))}
          </div>
        </div>

        {/* X01 Options */}
        {isX01 && (
          <div className="rounded-lg md:rounded-2xl p-4 md:p-6 border-2"
               style={{
                 background: theme.backgrounds.cardHex,
                 borderColor: theme.titleBars.x01.split(' ')[0]
               }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4"
                style={{ color: theme.text.primary, fontFamily: theme.fonts.display }}>
              X01 Options
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Starting Score</label>
                <div className="grid grid-cols-3 gap-2">
                  {[301, 501, 701].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setStartingScore(score)}
                      className="py-2 md:py-3 rounded-lg font-bold transition border-4 text-sm md:text-base"
                      style={{
                        background: startingScore === score ? theme.stateColors.active.color : `${theme.backgrounds.baseHex}88`,
                        borderColor: startingScore === score ? theme.stateColors.active.border : theme.borders.secondary,
                        color: theme.text.primary
                      }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doubleIn}
                  onChange={(e) => setDoubleIn(e.target.checked)}
                  className="w-5 h-5"
                />
                <span style={{ color: theme.text.primary }}>Double In Required</span>
              </label>
            </div>
          </div>
        )}

        {/* Mickey Mouse Options */}
        {isMickeyMouse && (
          <div className="rounded-lg md:rounded-2xl p-4 md:p-6 border-2"
               style={{
                 background: theme.backgrounds.cardHex,
                 borderColor: theme.categoryColors.beds.color
               }}>
            <h2 className="text-xl md:text-2xl font-bold mb-4"
                style={{ color: theme.categoryColors.beds.color, fontFamily: theme.fonts.display }}>
              Mickey Mouse Options
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Numbers Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 11, 12, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLowestNumber(num)}
                      className="py-2 md:py-3 rounded-lg font-bold transition border-4 text-sm md:text-base"
                      style={{
                        background: lowestNumber === num ? theme.categoryColors.beds.color : `${theme.backgrounds.baseHex}88`,
                        borderColor: lowestNumber === num ? theme.categoryColors.beds.color : theme.borders.secondary,
                        color: theme.text.primary
                      }}
                    >
                      20-{num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDoubles}
                    onChange={(e) => setIncludeDoubles(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Doubles</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTriples}
                    onChange={(e) => setIncludeTriples(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Triples</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBeds}
                    onChange={(e) => setIncludeBeds(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Beds</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          type="submit"
          disabled={loading || gameTypes.length === 0}
          className="w-full px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl transition disabled:opacity-50 border-2"
          style={{
            background: `linear-gradient(to right, ${theme.stateColors.active.gradient})`,
            borderColor: theme.stateColors.active.border,
            color: theme.text.primary,
            boxShadow: `0 0 20px ${theme.stateColors.active.glow}`
          }}
        >
          {loading ? 'Starting...' : `Start ${isX01 ? startingScore : selectedGame?.displayName || 'Game'}`}
        </button>
      </form>

      {/* Click outside to close picker */}
      {showPlayerPicker !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowPlayerPicker(null)}
        />
      )}
    </div>
  );
};

export default GameSetup;