import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Trophy, TrendingUp, BarChart3, Calendar, Award, Target } from 'lucide-react';
import type { Statistics, Rating, Game } from '../types';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [stats, userRating, games] = await Promise.all([
        apiService.getStatistics().catch(() => null),
        apiService.getUserRating().catch(() => null),
        apiService.getGames({ limit: 10 }).catch(() => []),
      ]);

      setStatistics(stats);
      if (userRating) {
        setRatings([userRating]);
      }
      setRecentGames(games);
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await apiService.updateUser({ username: editUsername });
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
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
      {/* Profile Header */}
      <Card className="animate-slide-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 bg-primary rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-xl shadow-primary/40">
              {(user?.username || 'U')[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="px-5 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary w-full"
                  />
                  <div className="flex gap-3">
                    <Button size="md" onClick={handleUpdateProfile}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setIsEditing(false);
                        setEditUsername(user?.username || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold mb-2 tracking-tight">{user?.username || 'User'}</h1>
                  <p className="text-text-secondary text-lg">{user?.email || 'No email'}</p>
                  <p className="text-text-tertiary mt-2">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </>
              )}
            </div>
          </div>
          {!isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(true)} size="lg">
              <User className="w-5 h-5" />
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Statistics Grid */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-2 font-medium">Total Games</p>
                <p className="text-4xl font-bold text-text-primary tracking-tight">{statistics.totalGames || 0}</p>
              </div>
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-2 font-medium">Win Rate</p>
                <p className="text-4xl font-bold text-success tracking-tight">
                  {Math.round(statistics.winRate || 0)}%
                </p>
              </div>
              <div className="w-14 h-14 bg-success-light rounded-xl flex items-center justify-center shadow-lg shadow-success/20">
                <Target className="w-7 h-7 text-success" />
              </div>
            </div>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-2 font-medium">Wins</p>
                <p className="text-4xl font-bold text-primary tracking-tight">{statistics.wins || 0}</p>
              </div>
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-2 font-medium">Best Streak</p>
                <p className="text-4xl font-bold text-secondary tracking-tight">{statistics.bestStreak || 0}</p>
              </div>
              <div className="w-14 h-14 bg-secondary-light rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
                <TrendingUp className="w-7 h-7 text-secondary" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Stats */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-text-secondary" />
              <span>Game Statistics</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary">Wins</span>
                <span className="text-xl font-semibold text-text-primary">{statistics.wins}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary">Losses</span>
                <span className="text-xl font-bold text-danger">{statistics.losses}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary">Draws</span>
                <span className="text-xl font-bold text-text-primary">{statistics.draws}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary">Current Streak</span>
                <span className="text-xl font-semibold text-text-primary">{statistics.currentStreak}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-text-secondary" />
              <span>Ratings</span>
            </h2>
            {ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div
                    key={rating.category}
                    className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold capitalize">{rating.category}</p>
                        <p className="text-text-secondary text-sm">
                          {rating.gamesPlayed} games • Peak: {rating.peakRating}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-text-primary">{rating.rating}</p>
                        <p className="text-text-secondary text-xs">
                          {rating.wins}W / {rating.losses}L / {rating.draws}D
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">No ratings yet</p>
            )}
          </Card>
        </div>
      )}

      {/* Recent Games */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-text-secondary" />
            <span>Recent Games</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
            View All
          </Button>
        </div>
        {recentGames.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No games yet</p>
        ) : (
          <div className="space-y-2">
            {recentGames.map((game) => {
              const isWhite = game.whitePlayer === user?._id;
              const isWinner =
                game.result === 'draw'
                  ? null
                  : (game.result === 'white' && isWhite) || (game.result === 'black' && !isWhite);
              return (
                <div
                  key={game._id}
                  className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                  onClick={() => navigate(`/games/${game._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        vs {isWhite ? game.blackPlayerUsername || 'Opponent' : game.whitePlayerUsername || 'Opponent'}
                      </p>
                      <p className="text-text-secondary text-sm">
                        {new Date(game.createdAt).toLocaleDateString()} • {(game.moves || []).length} moves
                      </p>
                    </div>
                    <div className="text-right">
                      {isWinner !== null && (
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded ${
                            isWinner
                              ? 'bg-bg-tertiary text-text-primary'
                              : 'bg-danger-light text-danger'
                          }`}
                        >
                          {isWinner ? 'Win' : 'Loss'}
                        </span>
                      )}
                      {game.result === 'draw' && (
                        <span className="text-sm font-semibold px-3 py-1 rounded bg-text-tertiary/20 text-text-tertiary">
                          Draw
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

