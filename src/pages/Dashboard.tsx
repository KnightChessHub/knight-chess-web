import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  Trophy,
  TrendingUp,
  Clock,
  Play,
  Users,
  MessageSquare,
  Zap,
  Target,
  Award,
  Activity,
  Gamepad2,
  ChevronRight,
  Crown,
  Flame,
  BarChart3,
} from 'lucide-react';
import type { Statistics, Rating, Tournament, Game, User } from '../types';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load leaderboard separately to not block other data if it fails
        const [
          stats,
          userRating,
          tournaments,
          games,
          activities,
          friendsData,
        ] = await Promise.all([
          apiService.getStatistics().catch(() => null),
          apiService.getUserRating().catch(() => null),
          apiService.getTournaments({ status: 'upcoming' }).catch(() => []),
          apiService.getGames({ limit: 5 }).catch(() => []),
          apiService.getActivityFeed().catch(() => []),
          apiService.getFriends().catch(() => []),
        ]);

        // Try to load leaderboard separately - don't block other data
        let leaderboardData: Rating[] = [];
        try {
          leaderboardData = await apiService.getLeaderboard('blitz', 5);
        } catch (error: any) {
          console.warn('Leaderboard unavailable:', error?.response?.data?.error || error?.message);
          // Silently fail - leaderboard is optional
        }

        setStatistics(stats);
        setRating(userRating);
        setUpcomingTournaments(Array.isArray(tournaments) ? tournaments.slice(0, 3) : []);
        
        const allGames = Array.isArray(games) ? games : [];
        setRecentGames(allGames.slice(0, 5));
        setActiveGames(allGames.filter((g) => g.status === 'active').slice(0, 3));
        
        setActivityFeed(Array.isArray(activities) ? activities.slice(0, 5) : []);
        setFriends(Array.isArray(friendsData) ? friendsData.slice(0, 6) : []);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickMatch = async () => {
    try {
      const timeControl = { initial: 300, increment: 0 };
      await apiService.joinMatchmakingQueue(timeControl);
      toast.success('Searching for opponent...');
      navigate('/games');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join matchmaking');
    }
  };

  const timeControls = [
    { label: 'Bullet', initial: 60, increment: 0, icon: Zap },
    { label: 'Blitz', initial: 300, increment: 0, icon: Clock },
    { label: 'Rapid', initial: 600, increment: 0, icon: Play },
    { label: 'Classical', initial: 1800, increment: 0, icon: Trophy },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
      {/* Welcome Section */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              Welcome back,{' '}
              <span className="text-primary">{user?.username}</span>
            </h1>
            <p className="text-text-secondary text-lg">
              {activeGames.length > 0
                ? `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''}`
                : 'Ready for your next game?'}
            </p>
          </div>
          {activeGames.length > 0 && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/games')}
              className="animate-scale-in"
            >
              <Gamepad2 className="w-5 h-5" />
              View Active Games
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm mb-2 font-medium">Rating</p>
              <p className="text-4xl font-bold text-primary tracking-tight">
                {rating?.rating || 1200}
              </p>
              {rating && rating.peakRating && rating.peakRating > (rating.rating || 0) && (
                <p className="text-xs text-text-tertiary mt-1">
                  Peak: {rating.peakRating}
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm mb-2 font-medium">Games Played</p>
              <p className="text-4xl font-bold text-secondary tracking-tight">
                {statistics?.totalGames || 0}
              </p>
              {statistics && statistics.totalGames > 0 && (
                <p className="text-xs text-text-tertiary mt-1">
                  {statistics.wins}W / {statistics.losses}L / {statistics.draws}D
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-secondary-light rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20 flex-shrink-0">
              <Trophy className="w-7 h-7 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm mb-2 font-medium">Win Rate</p>
              <p className="text-4xl font-bold text-success tracking-tight">
                {statistics ? Math.round(statistics.winRate) : 0}%
              </p>
              {statistics && statistics.currentStreak > 0 && (
                <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-warning" />
                  {statistics.currentStreak} streak
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-success-light rounded-xl flex items-center justify-center shadow-lg shadow-success/20 flex-shrink-0">
              <Target className="w-7 h-7 text-success" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm mb-2 font-medium">Best Streak</p>
              <p className="text-4xl font-bold text-accent tracking-tight">
                {statistics?.bestStreak || 0}
              </p>
              {statistics && statistics.bestStreak > 0 && (
                <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-accent" />
                  Personal best
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-accent-light rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 flex-shrink-0">
              <Award className="w-7 h-7 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Match */}
        <Card hover className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1">Quick Match</h3>
                <p className="text-text-secondary text-sm">Find an opponent instantly</p>
              </div>
            </div>
            <Button onClick={handleQuickMatch} className="w-full" size="lg">
              <Play className="w-5 h-5" />
              Find Opponent
            </Button>
          </div>
        </Card>

        {/* Create Game */}
        <Card hover className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1">Create Game</h3>
                <p className="text-text-secondary text-sm">Start a custom game</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {timeControls.map((tc) => {
                const Icon = tc.icon;
                return (
                  <Button
                    key={tc.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/games/new?time=${tc.initial}&increment=${tc.increment}`)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {tc.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - 2 spans */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Games */}
          {activeGames.length > 0 && (
            <Card className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Active Games</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/games')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {activeGames.map((game) => {
                  const isWhite = game.whitePlayer === user?._id;
                  const opponent = isWhite
                    ? game.blackPlayerUsername
                    : game.whitePlayerUsername;
                  return (
                    <div
                      key={game._id}
                      className="p-4 bg-bg-tertiary rounded-xl hover:bg-bg-hover transition-colors cursor-pointer border border-border hover:border-primary/30"
                      onClick={() => navigate(`/games/${game._id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-primary-light text-primary">
                              {isWhite ? 'White' : 'Black'}
                            </span>
                            <span className="text-text-secondary text-sm">vs</span>
                            <span className="font-semibold text-text-primary truncate">
                              {opponent || 'Opponent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <Clock className="w-4 h-4" />
                            <span>
                              {game.timeControl
                                ? `${formatTime(game.timeControl.initial)} + ${game.timeControl.increment}s`
                                : 'N/A'}
                            </span>
                            <span className="text-text-tertiary">•</span>
                            <span>{(game.moves || []).length} moves</span>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/games/${game._id}`);
                          }}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Games */}
          {recentGames.length > 0 && (
            <Card className="animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Recent Games</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/games')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {recentGames.slice(0, 5).map((game) => {
                  const isPlayer =
                    game.whitePlayer === user?._id || game.blackPlayer === user?._id;
                  const isWhite = game.whitePlayer === user?._id;
                  const opponent = isPlayer
                    ? isWhite
                      ? game.blackPlayerUsername
                      : game.whitePlayerUsername
                    : null;
                  const result =
                    game.result === 'white'
                      ? isWhite
                        ? 'Won'
                        : 'Lost'
                      : game.result === 'black'
                      ? !isWhite
                        ? 'Won'
                        : 'Lost'
                      : game.result === 'draw'
                      ? 'Draw'
                      : null;

                  return (
                    <div
                      key={game._id}
                      className="p-4 bg-bg-tertiary rounded-xl hover:bg-bg-hover transition-colors cursor-pointer border border-border hover:border-primary/30"
                      onClick={() => navigate(`/games/${game._id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {isPlayer && opponent && (
                              <>
                                <span className="font-semibold text-text-primary">
                                  {isWhite ? 'White' : 'Black'}
                                </span>
                                <span className="text-text-secondary">vs</span>
                                <span className="font-semibold text-text-primary truncate">
                                  {opponent}
                                </span>
                              </>
                            )}
                            {!isPlayer && (
                              <>
                                <span className="font-semibold text-text-primary truncate">
                                  {game.whitePlayerUsername || 'White'}
                                </span>
                                <span className="text-text-secondary">vs</span>
                                <span className="font-semibold text-text-primary truncate">
                                  {game.blackPlayerUsername || 'Black'}
                                </span>
                              </>
                            )}
                            {result && (
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  result === 'Won'
                                    ? 'bg-success-light text-success'
                                    : result === 'Lost'
                                    ? 'bg-danger-light text-danger'
                                    : 'bg-text-tertiary/20 text-text-tertiary'
                                }`}
                              >
                                {result}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span className="text-xs">
                              {getTimeAgo(game.updatedAt || game.createdAt)}
                            </span>
                            <span className="text-text-tertiary">•</span>
                            <span className="capitalize">{game.status}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/games/${game._id}`);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Activity Feed */}
          {activityFeed.length > 0 && (
            <Card className="animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Activity Feed</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/activity')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {activityFeed.map((activity, index) => (
                  <div
                    key={activity._id || index}
                    className="p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary">
                          {activity.message || activity.description || 'Activity update'}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {activity.createdAt ? getTimeAgo(activity.createdAt) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <Card className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Tournaments</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tournaments')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingTournaments.map((tournament) => (
                  <div
                    key={tournament._id}
                    className="p-4 bg-bg-tertiary rounded-xl hover:bg-bg-hover transition-colors cursor-pointer border border-border hover:border-primary/30"
                    onClick={() => navigate(`/tournaments/${tournament._id}`)}
                  >
                    <h3 className="font-bold text-lg mb-2 truncate">{tournament.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Users className="w-4 h-4" />
                        <span>
                          {(tournament.participants || []).length} / {tournament.maxParticipants}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tournaments/${tournament._id}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Leaderboard Preview */}
          {leaderboard.length > 0 ? (
            <Card className="animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Top Players</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/leaderboard')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.userId || `leaderboard-${index}`}
                    className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                    onClick={() => player.userId && navigate(`/profile/${player.userId}`)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      index === 0 
                        ? 'bg-warning-light text-warning' 
                        : index === 1 
                        ? 'bg-text-tertiary/30 text-text-secondary'
                        : index === 2
                        ? 'bg-accent-light text-accent'
                        : 'bg-primary-light text-primary'
                    }`}>
                      {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        Player #{index + 1}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {player.rating || 1200} • {player.gamesPlayed || 0} games
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Friends */}
          {friends.length > 0 && (
            <Card className="animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Friends</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/friends')}
                  className="flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/profile/${friend._id}`)}
                  >
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {(friend.username || 'U')[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{friend.username || 'User'}</p>
                      <p className="text-xs text-text-secondary">
                        Rating: {friend.rating || 1200}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat`);
                      }}
                      title="Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
