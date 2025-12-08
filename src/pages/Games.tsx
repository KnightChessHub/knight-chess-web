import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Play, Clock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Game } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Games() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'finished'>('all');

  useEffect(() => {
    loadGames();
  }, [filter]);

  const loadGames = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const gamesData = await apiService.getGames(params);
      setGames(gamesData);
    } catch (error) {
      toast.error('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async (initial: number, increment: number) => {
    try {
      const game = await apiService.createGame({ initial, increment });
      toast.success('Game created!');
      navigate(`/games/${game._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create game');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-text-primary';
      case 'waiting':
        return 'text-warning';
      case 'finished':
        return 'text-text-secondary';
      default:
        return 'text-text-secondary';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Games</h1>
          <p className="text-text-secondary">Play, watch, and analyze chess games</p>
        </div>
        <Button onClick={() => navigate('/games/new')} size="lg">
          <Plus className="w-4 h-4" />
          New Game
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {(['all', 'active', 'waiting', 'finished'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Quick Create */}
      <Card>
        <h3 className="text-lg font-semibold mb-5">Quick Create</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bullet', initial: 60, increment: 0 },
            { label: 'Blitz', initial: 300, increment: 0 },
            { label: 'Rapid', initial: 600, increment: 0 },
            { label: 'Classical', initial: 1800, increment: 0 },
          ].map((tc) => (
            <Button
              key={tc.label}
              variant="ghost"
              size="sm"
              onClick={() => handleCreateGame(tc.initial, tc.increment)}
            >
              <Clock className="w-4 h-4" />
              {tc.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Games List */}
      {games.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No games found</p>
            <Button onClick={() => navigate('/games/new')}>Create Your First Game</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const isPlayer = game.whitePlayer === user?._id || game.blackPlayer === user?._id;
            return (
              <Card
                key={game._id}
                hover
                onClick={() => navigate(`/games/${game._id}`)}
                className="cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${getStatusColor(game.status)}`}>
                      {game.status.toUpperCase()}
                    </span>
                    {isPlayer && (
                      <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded">
                        Your Game
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary">vs</span>
                      <span className="font-medium">
                        {game.whitePlayerUsername || 'White'} vs{' '}
                        {game.blackPlayerUsername || 'Black'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary">
                        {formatTime(game.timeControl.initial)} + {game.timeControl.increment}s
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/games/${game._id}`);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {game.status === 'waiting' ? 'Join' : 'View'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

