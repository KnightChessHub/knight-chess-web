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
    <div className="space-y-8 animate-fade-in">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary flex-shrink-0" />
          <span>Leaderboard</span>
        </h1>
        <p className="text-text-secondary text-lg">Top players in each category</p>
      </div>

      {/* Category Filter */}
      <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-3">
          {['blitz', 'rapid', 'classical', 'bullet'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                category === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:scale-105'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No players yet</p>
            </div>
          ) : (
            leaderboard.map((rating, index) => {
              const rank = index + 1;
              const icon = getRankIcon(rank);
              return (
                <div
                  key={rating.userId || index}
                  className={`flex items-center justify-between p-5 rounded-xl transition-all duration-300 ${
                    rank <= 3
                      ? 'bg-bg-tertiary border-2 border-primary shadow-lg shadow-primary/20'
                      : 'bg-bg-tertiary hover:bg-bg-hover hover:scale-[1.01]'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 text-center">
                      {icon ? (
                        <span className="text-3xl">{icon}</span>
                      ) : (
                        <span className="text-2xl font-bold text-text-secondary">#{rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">Player {(rating.userId || 'Unknown').slice(0, 8)}</p>
                      <p className="text-text-secondary">
                        {rating.wins || 0}W / {rating.losses || 0}L / {rating.draws || 0}D
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <span className="text-3xl font-bold text-primary">{rating.rating || 1200}</span>
                    </div>
                    <p className="text-text-secondary text-sm">{rating.gamesPlayed || 0} games</p>
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

