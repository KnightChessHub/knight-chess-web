import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import ChessLoader from '../components/ChessLoader';
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
  const [showSideSelection, setShowSideSelection] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState<{ initial: number; increment: number; label: string } | null>(null);

  useEffect(() => {
    loadGames();
  }, [filter]);

  const loadGames = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const gamesData = await apiService.getGames(params);
      setGames(Array.isArray(gamesData) ? gamesData : []);
    } catch (error) {
      toast.error('Failed to load games');
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async (initial: number, increment: number) => {
    try {
      // Check for active games first
      const activeGames = games.filter(
        (g) => g.status === 'active' && (g.whitePlayer === user?._id || g.blackPlayer === user?._id)
      );

      if (activeGames.length > 0) {
        const shouldContinue = window.confirm(
          `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''}. Do you want to create another game anyway?`
        );
        if (!shouldContinue) {
          return;
        }
      }

      // Create offline game (practice mode - play against yourself)
      const game = await apiService.createGame({ initial, increment }, 'offline');
      toast.success('Game created!');
      navigate(`/games/${game._id}`);
      loadGames(); // Refresh games list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create game');
    }
  };

  const handleJoinGame = async (gameId: string) => {
    try {
      const updatedGame = await apiService.joinGame(gameId);
      toast.success('Game joined!');
      navigate(`/games/${updatedGame._id}`);
      loadGames(); // Refresh games list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join game');
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
    return <ChessLoader />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Games</h1>
          <p className="text-text-secondary text-lg">Play, watch, and analyze chess games</p>
        </div>
        <Button onClick={() => navigate('/games/new')} size="lg">
          <Plus className="w-5 h-5" />
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
      <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-xl font-bold mb-5">Quick Create</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-3 font-medium">Practice Games (Offline)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {tc.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-sm text-text-secondary mb-3 font-medium">Online Games (Others Can Join)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Bullet', initial: 60, increment: 0 },
                { label: 'Blitz', initial: 300, increment: 0 },
                { label: 'Rapid', initial: 600, increment: 0 },
                { label: 'Classical', initial: 1800, increment: 0 },
              ].map((tc) => (
                <Button
                  key={`online-${tc.label}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTimeControl({ initial: tc.initial, increment: tc.increment, label: tc.label });
                    setShowSideSelection(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {tc.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Joinable Games Section */}
      {(() => {
        const joinableGames = games.filter(
          (g) => g.status === 'waiting' 
            && g.gameType === 'online' 
            && g.whitePlayer !== user?._id 
            && !g.blackPlayer
        );
        return joinableGames.length > 0 ? (
          <Card className="bg-success-light border-2 border-success/30 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-success flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-success">
                    {joinableGames.length} Game{joinableGames.length > 1 ? 's' : ''} Waiting for Players
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Join these games to play against other players
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {joinableGames.slice(0, 3).map((game) => (
                <div
                  key={game._id}
                  className="p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer border border-success/20"
                  onClick={() => handleJoinGame(game._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-success">JOINABLE</span>
                    <span className="text-xs text-text-secondary">
                      {formatTime(game.timeControl?.initial || 0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    vs {game.whitePlayerUsername || 'White Player'}
                  </p>
                </div>
              ))}
            </div>
            {joinableGames.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  setFilter('waiting');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                View All Joinable Games ({joinableGames.length})
              </Button>
            )}
          </Card>
        ) : null;
      })()}

      {/* Active Games Warning */}
      {(() => {
        const activeGames = games.filter(
          (g) => g.status === 'active' && (g.whitePlayer === user?._id || g.blackPlayer === user?._id)
        );
        return activeGames.length > 0 ? (
          <Card className="bg-warning-light border border-warning/30 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="font-semibold text-warning">
                    You have {activeGames.length} active game{activeGames.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {activeGames.length > 1
                      ? 'Consider finishing your current games before starting new ones'
                      : 'Consider finishing your current game before starting a new one'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter('active');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                View Active
              </Button>
            </div>
          </Card>
        ) : null;
      })()}

      {/* Games List */}
      {games.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4 text-lg">No games found</p>
            <Button onClick={() => handleCreateGame(600, 0)} size="lg">
              Create Your First Game
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const isPlayer = game.whitePlayer === user?._id || (game.blackPlayer && game.blackPlayer === user?._id);
            const isWhitePlayer = game.whitePlayer === user?._id;
            // Can join if: game is waiting, user is not a player, game is online, and black player slot is empty
            const canJoin = game.status === 'waiting' 
              && !isPlayer 
              && game.gameType === 'online' 
              && !game.blackPlayer; // undefined or falsy means no black player
            // Is waiting if: user is white player and black player hasn't joined yet
            const isWaitingForPlayer = game.status === 'waiting' && isWhitePlayer && !game.blackPlayer;

            return (
              <Card
                key={game._id}
                hover
                onClick={() => !canJoin && navigate(`/games/${game._id}`)}
                className={`cursor-pointer ${canJoin ? 'border-2 border-primary' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${getStatusColor(game.status)}`}>
                      {game.status.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPlayer && (
                        <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded font-semibold">
                          Your Game
                        </span>
                      )}
                      {canJoin && (
                        <span className="text-xs bg-success-light text-success px-2 py-1 rounded font-semibold animate-pulse">
                          Joinable
                        </span>
                      )}
                      {isWaitingForPlayer && (
                        <span className="text-xs bg-warning-light text-warning px-2 py-1 rounded font-semibold">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      {isPlayer ? (
                        <>
                          <span className="font-semibold text-text-primary truncate">
                            {isWhitePlayer ? user?.username || 'You' : game.whitePlayerUsername || 'White Player'}
                          </span>
                          <span className="text-text-secondary">vs</span>
                          <span className="font-semibold text-text-primary truncate">
                            {isWhitePlayer ? (game.blackPlayerUsername || 'Waiting...') : (user?.username || 'You')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-text-primary truncate">
                            {game.whitePlayerUsername || 'White Player'}
                          </span>
                          <span className="text-text-secondary">vs</span>
                          <span className="font-semibold text-text-primary truncate">
                            {game.blackPlayer ? (game.blackPlayerUsername || 'Black Player') : 'Waiting for player...'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <span className="text-text-secondary">
                        {formatTime(game.timeControl?.initial || 0)} + {game.timeControl?.increment || 0}s
                      </span>
                    </div>
                  </div>

                  {canJoin ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGame(game._id);
                      }}
                    >
                      <Play className="w-4 h-4" />
                      Join Game
                    </Button>
                  ) : (
                    <Button
                      variant={game.status === 'waiting' && isWaitingForPlayer ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/games/${game._id}`);
                      }}
                    >
                      <Play className="w-4 h-4" />
                      {game.status === 'waiting' && isWaitingForPlayer
                        ? 'Waiting for Player'
                        : game.status === 'waiting'
                        ? 'View'
                        : game.status === 'active'
                        ? 'Continue'
                        : 'View'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Side Selection Modal */}
      {showSideSelection && selectedTimeControl && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => {
            setShowSideSelection(false);
            setSelectedTimeControl(null);
          }}
        >
          <Card 
            className="w-full max-w-md mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Choose Your Side</h2>
            <p className="text-text-secondary mb-6">
              Select which color you want to play as for this {selectedTimeControl.label} game
            </p>
            <div className="space-y-3 mb-6">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const activeGames = games.filter(
                      (g) => g.status === 'active' && (g.whitePlayer === user?._id || g.blackPlayer === user?._id)
                    );
                    if (activeGames.length > 0) {
                      const shouldContinue = window.confirm(
                        `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''}. Do you want to create another game anyway?`
                      );
                      if (!shouldContinue) {
                        setShowSideSelection(false);
                        setSelectedTimeControl(null);
                        return;
                      }
                    }
                    const game = await apiService.createGame(
                      { initial: selectedTimeControl.initial, increment: selectedTimeControl.increment },
                      'online',
                      undefined,
                      'white'
                    );
                    toast.success('Online game created! Waiting for opponent...');
                    setShowSideSelection(false);
                    setSelectedTimeControl(null);
                    navigate(`/games/${game._id}`);
                    loadGames();
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to create online game');
                  }
                }}
              >
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-bg-primary font-bold mr-3">
                  W
                </div>
                Play as White
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const activeGames = games.filter(
                      (g) => g.status === 'active' && (g.whitePlayer === user?._id || g.blackPlayer === user?._id)
                    );
                    if (activeGames.length > 0) {
                      const shouldContinue = window.confirm(
                        `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''}. Do you want to create another game anyway?`
                      );
                      if (!shouldContinue) {
                        setShowSideSelection(false);
                        setSelectedTimeControl(null);
                        return;
                      }
                    }
                    const game = await apiService.createGame(
                      { initial: selectedTimeControl.initial, increment: selectedTimeControl.increment },
                      'online',
                      undefined,
                      'black'
                    );
                    toast.success('Online game created! Waiting for opponent...');
                    setShowSideSelection(false);
                    setSelectedTimeControl(null);
                    navigate(`/games/${game._id}`);
                    loadGames();
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to create online game');
                  }
                }}
              >
                <div className="w-8 h-8 bg-bg-primary rounded flex items-center justify-center text-white font-bold mr-3">
                  B
                </div>
                Play as Black
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const activeGames = games.filter(
                      (g) => g.status === 'active' && (g.whitePlayer === user?._id || g.blackPlayer === user?._id)
                    );
                    if (activeGames.length > 0) {
                      const shouldContinue = window.confirm(
                        `You have ${activeGames.length} active game${activeGames.length > 1 ? 's' : ''}. Do you want to create another game anyway?`
                      );
                      if (!shouldContinue) {
                        setShowSideSelection(false);
                        setSelectedTimeControl(null);
                        return;
                      }
                    }
                    const game = await apiService.createGame(
                      { initial: selectedTimeControl.initial, increment: selectedTimeControl.increment },
                      'online',
                      undefined,
                      'random'
                    );
                    toast.success('Online game created! Waiting for opponent...');
                    setShowSideSelection(false);
                    setSelectedTimeControl(null);
                    navigate(`/games/${game._id}`);
                    loadGames();
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to create online game');
                  }
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-white to-bg-primary rounded flex items-center justify-center font-bold mr-3">
                  ?
                </div>
                Random Side
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowSideSelection(false);
                setSelectedTimeControl(null);
              }}
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

