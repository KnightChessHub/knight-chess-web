import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import ChessLoader from '../components/ChessLoader';
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
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const timeControlTypes = ['bullet', 'blitz', 'rapid', 'classical'] as const;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load leaderboard separately to not block other data if it fails
        const [
          stats,
          tournaments,
          games,
          activities,
          friendsData,
        ] = await Promise.all([
          apiService.getStatistics().catch(() => null),
          apiService.getTournaments({ status: 'upcoming' }).catch(() => []),
          apiService.getGames({ limit: 5 }).catch(() => []),
          apiService.getActivityFeed().catch(() => []),
          apiService.getFriends().catch(() => []),
        ]);

        // Fetch ratings for each time control type
        const ratingsPromises = timeControlTypes.map(async (timeControl) => {
          try {
            const rating = await apiService.getUserRating(user?._id, timeControl);
            return { timeControl, rating };
          } catch (error) {
            console.warn(`Failed to fetch ${timeControl} rating:`, error);
            return { timeControl, rating: null };
          }
        });

        const ratingsResults = await Promise.all(ratingsPromises);
        const ratingsMap: Record<string, Rating> = {};
        ratingsResults.forEach(({ timeControl, rating }) => {
          if (rating) {
            ratingsMap[timeControl] = rating;
          }
        });

        // Try to load leaderboard separately - don't block other data
        let leaderboardData: Rating[] = [];
        try {
          leaderboardData = await apiService.getLeaderboard('blitz', 5);
        } catch (error: any) {
          console.warn('Leaderboard unavailable:', error?.response?.data?.error || error?.message);
          // Silently fail - leaderboard is optional
        }

        setStatistics(stats);
        setRatings(ratingsMap);
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
    return <ChessLoader />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      {/* Hero Welcome Section */}
      <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                <span className="text-2xl text-white font-bold leading-none">♘</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">
                  Welcome back,{' '}
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-lg">{user?.username}</span>
                </h1>
                <p className="text-text-secondary text-sm">
                  {activeGames.length > 0
                    ? `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''} waiting for you`
                    : 'Ready to make your next move?'}
                </p>
              </div>
            </div>
            {activeGames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/games')}
                  className="animate-scale-in"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Continue Playing
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleQuickMatch}
                >
                  <Zap className="w-4 h-4" />
                  Quick Match
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '1rem' }}>
        {timeControlTypes.map((timeControl, index) => {
          const rating = ratings[timeControl];
          const ratingValue = rating?.rating || 1200;
          const peakRating = rating?.peakRating;
          const gamesPlayed = rating?.gamesPlayed || 0;
          const iconMap = {
            bullet: Zap,
            blitz: Clock,
            rapid: Play,
            classical: Trophy,
          };
          const Icon = iconMap[timeControl];
          const colorClasses = {
            bullet: { bg: 'bg-accent/20', text: 'text-accent', border: 'border-accent/20', shadow: 'shadow-accent/30' },
            blitz: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/20', shadow: 'shadow-primary/30' },
            rapid: { bg: 'bg-secondary/20', text: 'text-secondary', border: 'border-secondary/20', shadow: 'shadow-secondary/30' },
            classical: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/20', shadow: 'shadow-warning/30' },
          };
          const colors = colorClasses[timeControl];

          return (
            <Card key={timeControl} className="glass-card animate-scale-in hover:scale-[1.02] transition-transform" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary text-xs mb-2 font-semibold uppercase tracking-wider capitalize">{timeControl}</p>
                  <p className={`text-3xl font-bold ${colors.text} tracking-tight mb-1`}>
                    {ratingValue}
                  </p>
                  {peakRating && peakRating > ratingValue && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-primary-lighter" />
                      <p className="text-xs text-text-tertiary">
                        Peak: <span className="text-primary-lighter font-semibold">{peakRating}</span>
                      </p>
                    </div>
                  )}
                  {gamesPlayed > 0 && (
                    <p className="text-xs text-text-tertiary mt-1">
                      {gamesPlayed} games
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shadow-lg ${colors.shadow} flex-shrink-0 border ${colors.border}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1rem' }}>
        {/* Quick Match */}
        <Card hover className="glass-card animate-slide-up hover:scale-[1.01] transition-all" style={{ animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 border border-primary/20">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">Quick Match</h3>
                <p className="text-text-secondary text-sm">Find an opponent instantly</p>
              </div>
            </div>
            <Button onClick={handleQuickMatch} className="w-full" size="md">
              <Zap className="w-4 h-4" />
              Find Opponent
            </Button>
          </div>
        </Card>

        {/* Create Game */}
        <Card hover className="glass-card animate-slide-up hover:scale-[1.01] transition-all" style={{ animationDelay: '0.7s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-secondary/30 border border-secondary/20">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">Create Game</h3>
                <p className="text-text-secondary text-sm">Start a custom game</p>
              </div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: '0.5rem' }}>
              {timeControls.map((tc) => {
                const Icon = tc.icon;
                return (
                  <Button
                    key={tc.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/games')}
                    className="flex items-center justify-center gap-1.5 glass-light hover:glass transition-all text-xs"
                  >
                    <Icon className="w-3.5 h-3.5" />
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
                  const myUsername = user?.username || 'You';
                  const opponent = isWhite
                    ? game.blackPlayerUsername
                    : game.whitePlayerUsername;
                  return (
                    <div
                      key={game._id}
                      className="glass-light rounded-lg p-3 hover:glass transition-all cursor-pointer border border-border/50 hover:border-primary/40"
                      onClick={() => navigate(`/games/${game._id}`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-text-primary text-sm truncate">
                              {myUsername}
                            </span>
                            <span className="text-text-secondary text-sm">vs</span>
                            <span className="font-bold text-text-primary truncate text-sm">
                              {opponent || 'Opponent'}
                            </span>
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
                              {isWhite ? 'White' : 'Black'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {game.timeControl
                                  ? `${formatTime(game.timeControl.initial)} + ${game.timeControl.increment}s`
                                  : 'N/A'}
                              </span>
                            </div>
                            <span className="text-text-tertiary">•</span>
                            <span className="font-medium">{(game.moves || []).length} moves</span>
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
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center border border-secondary/20">
                    <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                  </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentGames.slice(0, 5).map((game) => {
                  const isPlayer =
                    game.whitePlayer === user?._id || game.blackPlayer === user?._id;
                  const isWhite = game.whitePlayer === user?._id;
                  const opponent = isPlayer
                    ? isWhite
                      ? game.blackPlayerUsername
                      : game.whitePlayerUsername
                    : null;
                  // Only show result if game is finished and has a result
                  const isFinished = game.status === 'finished' || game.status === 'abandoned';
                  const result = isFinished && game.result
                    ? game.result === 'white'
                      ? isWhite
                        ? 'Won'
                        : 'Lost'
                      : game.result === 'black'
                      ? !isWhite
                        ? 'Won'
                        : 'Lost'
                      : game.result === 'draw'
                      ? 'Draw'
                      : null
                    : null;

                  return (
                    <div
                      key={game._id}
                      className="glass-light rounded-lg p-3 hover:glass transition-all cursor-pointer border border-border/50 hover:border-primary/40"
                      onClick={() => navigate(`/games/${game._id}`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isPlayer && opponent && (
                              <>
                                <span className="font-bold text-text-primary text-sm truncate">
                                  {myUsername}
                                </span>
                                <span className="text-text-secondary text-sm">vs</span>
                                <span className="font-bold text-text-primary truncate text-sm">
                                  {opponent}
                                </span>
                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
                                  {isWhite ? 'White' : 'Black'}
                                </span>
                              </>
                            )}
                            {!isPlayer && (
                              <>
                                <span className="font-bold text-text-primary truncate text-sm">
                                  {game.whitePlayerUsername || 'White Player'}
                                </span>
                                <span className="text-text-secondary text-sm">vs</span>
                                <span className="font-bold text-text-primary truncate text-sm">
                                  {game.blackPlayerUsername || 'Black Player'}
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
                            {!isFinished && (
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  game.status === 'waiting'
                                    ? 'bg-warning-light text-warning'
                                    : 'bg-primary-light text-primary'
                                }`}
                              >
                                {game.status === 'waiting' ? 'Waiting' : 'Active'}
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
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/20">
                    <Activity className="w-4 h-4 text-accent flex-shrink-0" />
                  </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activityFeed.map((activity, index) => (
                  <div
                    key={activity._id || index}
                    className="glass-light rounded-lg p-3 hover:glass transition-all border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-accent/20">
                        <Activity className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium">
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
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center border border-warning/20">
                    <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                  </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaderboard.map((player, index) => (
                  <div
                    key={player.userId || `leaderboard-${index}`}
                    className="glass-light rounded-xl p-4 hover:glass transition-all cursor-pointer border border-border/50 hover:border-warning/40"
                    onClick={() => player.userId && navigate(`/profile/${player.userId}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                        index === 0 
                          ? 'bg-warning/20 text-warning border-warning/30 shadow-lg shadow-warning/20' 
                          : index === 1 
                          ? 'bg-text-tertiary/20 text-text-secondary border-text-tertiary/30'
                          : index === 2
                          ? 'bg-accent/20 text-accent border-accent/30'
                          : 'bg-primary/20 text-primary border-primary/30'
                      }`}>
                        {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          Player #{index + 1}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          <span className="font-semibold text-primary">{player.rating || 1200}</span> • {player.gamesPlayed || 0} games
                        </p>
                      </div>
                      <BarChart3 className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Friends */}
          {friends.length > 0 && (
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="glass-light rounded-xl p-4 hover:glass transition-all cursor-pointer border border-border/50 hover:border-primary/40"
                    onClick={() => navigate(`/profile/${friend._id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-base font-bold text-primary flex-shrink-0 border border-primary/30 shadow-lg shadow-primary/10">
                        {(friend.username || 'U')[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{friend.username || 'User'}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          Rating: <span className="font-semibold text-primary">{friend.rating || 1200}</span>
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
                        className="glass-light hover:glass"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
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
