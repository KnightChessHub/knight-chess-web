import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import Card from '../components/Card';
import { Trophy, TrendingUp } from 'lucide-react';
import type { Rating } from '../types';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Rating[]>([]);
  const [category, setCategory] = useState<string>('blitz');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [category]);

  const loadLeaderboard = async () => {
    try {
      const data = await apiService.getLeaderboard(category, 100);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <Trophy className="w-8 h-8 text-text-secondary" />
          <span>Leaderboard</span>
        </h1>
        <p className="text-text-secondary">Top players in each category</p>
      </div>

      {/* Category Filter */}
      <Card>
        <div className="flex space-x-2">
          {['blitz', 'rapid', 'classical', 'bullet'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                category === cat
                  ? 'bg-bg-tertiary text-text-primary border border-border'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No players yet</p>
            </div>
          ) : (
            leaderboard.map((rating, index) => {
              const rank = index + 1;
              const icon = getRankIcon(rank);
              return (
                <div
                  key={rating.userId}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    rank <= 3
                      ? 'bg-bg-tertiary border border-border'
                      : 'bg-bg-tertiary hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-center">
                      {icon ? (
                        <span className="text-2xl">{icon}</span>
                      ) : (
                        <span className="text-xl font-bold text-text-secondary">#{rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Player {rating.userId.slice(0, 8)}</p>
                      <p className="text-text-secondary text-sm">
                        {rating.wins}W / {rating.losses}L / {rating.draws}D
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-text-secondary" />
                      <span className="text-2xl font-semibold text-text-primary">{rating.rating}</span>
                    </div>
                    <p className="text-text-secondary text-sm">{rating.gamesPlayed} games</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

