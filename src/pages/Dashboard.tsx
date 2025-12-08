import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trophy, TrendingUp, Clock, Play } from 'lucide-react';
import type { Statistics, Rating, Tournament } from '../types';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, userRating, tournaments] = await Promise.all([
          apiService.getStatistics(),
          apiService.getUserRating().catch(() => null),
          apiService.getTournaments({ status: 'upcoming' }).catch(() => []),
        ]);

        setStatistics(stats);
        setRating(userRating);
        setUpcomingTournaments(Array.isArray(tournaments) ? tournaments.slice(0, 3) : []);
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
      const timeControl = { initial: 300, increment: 0 }; // 5 minutes
      await apiService.joinMatchmakingQueue(timeControl);
      toast.success('Searching for opponent...');
      navigate('/games');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join matchmaking');
    }
  };

  const timeControls = [
    { label: 'Bullet', initial: 60, increment: 0 },
    { label: 'Blitz', initial: 300, increment: 0 },
    { label: 'Rapid', initial: 600, increment: 0 },
    { label: 'Classical', initial: 1800, increment: 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold mb-3 tracking-tight">
          Welcome back, <span className="text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">{user?.username}</span>
        </h1>
        <p className="text-text-secondary text-lg">Ready for your next game?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-2 font-medium">Rating</p>
              <p className="text-4xl font-bold text-primary tracking-tight">{rating?.rating || 1200}</p>
            </div>
            <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-2 font-medium">Games Played</p>
              <p className="text-4xl font-bold text-secondary tracking-tight">{statistics?.totalGames || 0}</p>
            </div>
            <div className="w-14 h-14 bg-secondary-light rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
              <Trophy className="w-7 h-7 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-2 font-medium">Win Rate</p>
              <p className="text-4xl font-bold text-success tracking-tight">
                {statistics ? Math.round(statistics.winRate) : 0}%
              </p>
            </div>
            <div className="w-14 h-14 bg-success-light rounded-xl flex items-center justify-center shadow-lg shadow-success/20">
              <TrendingUp className="w-7 h-7 text-success" />
            </div>
          </div>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-2 font-medium">Wins</p>
              <p className="text-4xl font-bold text-accent tracking-tight">{statistics?.wins || 0}</p>
            </div>
            <div className="w-14 h-14 bg-accent-light rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <Trophy className="w-7 h-7 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Match */}
        <Card hover className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1">Quick Match</h3>
                <p className="text-text-secondary">Find an opponent instantly</p>
              </div>
            </div>
            <Button onClick={handleQuickMatch} className="w-full" size="lg">
              <Play className="w-5 h-5" />
              Find Opponent
            </Button>
          </div>
        </Card>

        {/* Create Game */}
        <Card hover onClick={() => navigate('/games/new')} className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="space-y-5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1">Create Game</h3>
                <p className="text-text-secondary">Start a custom game</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {timeControls.map((tc) => (
                <Button
                  key={tc.label}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/games/new?time=${tc.initial}&increment=${tc.increment}`);
                  }}
                >
                  {tc.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary flex-shrink-0" />
              <span>Upcoming Tournaments</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tournaments')}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingTournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                onClick={() => navigate(`/tournaments/${tournament._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-1">{tournament.name}</h3>
                    <p className="text-text-secondary">
                      {(tournament.participants || []).length} / {tournament.maxParticipants} participants
                    </p>
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
    </div>
  );
}

