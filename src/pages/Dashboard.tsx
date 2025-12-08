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
        setUpcomingTournaments(tournaments.slice(0, 3));
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
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">
          Welcome back, <span className="text-primary">{user?.username}</span>
        </h1>
        <p className="text-text-secondary">Ready for your next game?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-1">Rating</p>
              <p className="text-3xl font-semibold text-primary">{rating?.rating || 1200}</p>
            </div>
            <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-1">Games Played</p>
              <p className="text-3xl font-semibold text-secondary">{statistics?.totalGames || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-light rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-1">Win Rate</p>
              <p className="text-3xl font-semibold text-success">
                {statistics ? Math.round(statistics.winRate) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm mb-1">Wins</p>
              <p className="text-3xl font-semibold text-accent">{statistics?.wins || 0}</p>
            </div>
            <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Match */}
        <Card hover>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold">Quick Match</h3>
                <p className="text-text-secondary text-sm">Find an opponent instantly</p>
              </div>
            </div>
            <Button onClick={handleQuickMatch} className="w-full" size="lg">
              <Play className="w-4 h-4" />
              Find Opponent
            </Button>
          </div>
        </Card>

        {/* Create Game */}
        <Card hover onClick={() => navigate('/games/new')}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold">Create Game</h3>
                <p className="text-text-secondary text-sm">Start a custom game</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary flex-shrink-0" />
              <span>Upcoming Tournaments</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tournaments')}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingTournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                onClick={() => navigate(`/tournaments/${tournament._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{tournament.name}</h3>
                    <p className="text-text-secondary text-sm">
                      {tournament.participants.length} / {tournament.maxParticipants} participants
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

