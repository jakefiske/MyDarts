import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

interface GameSummary {
  gameId: string;
  gameType: string;
  playedAt: string;
  won: boolean;
  totalThrows: number;
  threeDartAvg: number | null;
  checkout: number | null;
}

interface PlayerStats {
  playerName: string;
  gamesPlayed: number;
  gamesWon: number;
  winPercentage: number;
  threeDartAverage: number;
  highestCheckout: number;
  totalCheckouts: number;
  checkoutPercentage: number;
  oneEighties: number;
  oneFortiesPlus: number;
  tonPlus: number;
  bestStreak: number;
  fastestGame: number;
  recentGames: GameSummary[];
}

interface StatsPageProps {
  onBack: () => void;
}

const StatsPage: React.FC<StatsPageProps> = ({ onBack }) => {
  const api = useApi();
  const [players, setPlayers] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPlayers()
      .then(data => {
        setPlayers(data);
        if (data.length > 0 && !selectedPlayer) {
          setSelectedPlayer(data[0]);
        }
      })
      .catch(err => console.error('Failed to fetch players:', err));
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      setLoading(true);
      api.getPlayerStats(selectedPlayer)
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch stats:', err);
          setLoading(false);
        });
    }
  }, [selectedPlayer]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-400">📊 Player Stats</h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
          >
            ← Back to Game
          </button>
        </div>

        {/* Player Selection */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-300">Select Player</h2>
          <div className="flex flex-wrap gap-3">
            {players.map(player => (
              <button
                key={player}
                onClick={() => setSelectedPlayer(player)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedPlayer === player
                    ? 'bg-green-600 ring-2 ring-green-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {player}
              </button>
            ))}
            {players.length === 0 && (
              <div className="text-gray-400">No players found. Play some games first!</div>
            )}
          </div>
        </div>

        {/* Stats Display */}
        {loading && (
          <div className="text-center text-gray-400 py-8">Loading stats...</div>
        )}

        {stats && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overall Stats */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Overall</h3>
              <div className="space-y-3">
                <StatRow label="Games Played" value={stats.gamesPlayed} />
                <StatRow label="Games Won" value={stats.gamesWon} />
                <StatRow label="Win %" value={`${stats.winPercentage.toFixed(1)}%`} />
              </div>
            </div>

            {/* X01 Stats */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">X01 Stats</h3>
              <div className="space-y-3">
                <StatRow label="3-Dart Average" value={stats.threeDartAverage.toFixed(1)} />
                <StatRow label="Highest Checkout" value={stats.highestCheckout || '-'} />
                <StatRow label="Checkout %" value={`${stats.checkoutPercentage.toFixed(1)}%`} />
                <StatRow label="180s" value={stats.oneEighties} highlight={stats.oneEighties > 0} />
                <StatRow label="140+" value={stats.oneFortiesPlus} />
                <StatRow label="100+" value={stats.tonPlus} />
              </div>
            </div>

            {/* Around the Clock Stats */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Around the Clock</h3>
              <div className="space-y-3">
                <StatRow label="Best Streak" value={stats.bestStreak || '-'} />
                <StatRow label="Fastest Win" value={stats.fastestGame > 0 ? `${stats.fastestGame} throws` : '-'} />
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-gray-800 rounded-2xl p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-bold text-green-400 mb-4">Recent Games</h3>
              {stats.recentGames.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Game</th>
                        <th className="pb-2">Result</th>
                        <th className="pb-2">Throws</th>
                        <th className="pb-2">3-Dart Avg</th>
                        <th className="pb-2">Checkout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentGames.map((game, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          <td className="py-2 text-gray-300">
                            {new Date(game.playedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2">{game.gameType}</td>
                          <td className="py-2">
                            {game.won ? (
                              <span className="text-green-400 font-bold">WIN 🏆</span>
                            ) : (
                              <span className="text-gray-400">Loss</span>
                            )}
                          </td>
                          <td className="py-2">{game.totalThrows}</td>
                          <td className="py-2">
                            {game.threeDartAvg ? game.threeDartAvg.toFixed(1) : '-'}
                          </td>
                          <td className="py-2">
                            {game.checkout || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400">No games played yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ 
  label, 
  value, 
  highlight 
}) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <span className={`font-bold ${highlight ? 'text-yellow-400 text-xl' : ''}`}>{value}</span>
  </div>
);

export default StatsPage;