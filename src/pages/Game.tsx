import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import ChessBoard from '../components/ChessBoard';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Flag, Clock, RotateCcw, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Game } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentGame, setCurrentGame } = useGameStore();
  const [game, setGame] = useState<Game | null>(currentGame);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  useEffect(() => {
    if (id) {
      loadGame();
      // Poll for updates every 2 seconds if game is active
      if (game?.status === 'active') {
        const interval = setInterval(loadGame, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [id, game?.status]);

  // WebSocket for real-time updates
  useWebSocket(id || null, (data) => {
    if (data.game) {
      setGame(data.game);
      setCurrentGame(data.game);
    }
  });

  useEffect(() => {
    if (game) {
      const isWhite = game.whitePlayer === user?._id;
      setOrientation(isWhite ? 'white' : 'black');
      const moves = game.moves || [];
      setIsMyTurn(
        game.status === 'active' &&
          ((moves.length % 2 === 0 && isWhite) || (moves.length % 2 === 1 && !isWhite))
      );
    }
  }, [game, user]);

  const loadGame = async () => {
    if (!id) return;
    try {
      const gameData = await apiService.getGame(id);
      setGame(gameData);
      setCurrentGame(gameData);
    } catch (error) {
      toast.error('Failed to load game');
      navigate('/games');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async (move: string) => {
    if (!id || !isMyTurn) return;

    try {
      const updatedGame = await apiService.makeMove(id, move);
      setGame(updatedGame);
      setCurrentGame(updatedGame);
      toast.success('Move made!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid move');
    }
  };

  const handleResign = async () => {
    if (!id) return;

    if (!confirm('Are you sure you want to resign?')) return;

    try {
      await apiService.resignGame(id);
      toast.success('Game resigned');
      loadGame();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resign');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Game not found</p>
        <Button onClick={() => navigate('/games')}>Back to Games</Button>
      </div>
    );
  }

  const isWhitePlayer = game.whitePlayer === user?._id;
  const isBlackPlayer = game.blackPlayer === user?._id;
  const isPlayer = isWhitePlayer || isBlackPlayer;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/games')} size="md">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chess Game</h1>
            <p className="text-text-secondary text-lg mt-1">
              {game.status === 'active' ? 'In Progress' : game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {game.status === 'finished' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/games/${game._id}/replay`)} size="md">
                <RotateCcw className="w-5 h-5" />
                Replay
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/games/${game._id}/analysis`)} size="md">
                <BarChart3 className="w-5 h-5" />
                Analyze
              </Button>
            </>
          )}
          {isPlayer && game.status === 'active' && (
            <Button variant="danger" onClick={handleResign} size="md">
              <Flag className="w-5 h-5" />
              Resign
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chess Board */}
        <div className="lg:col-span-2 flex flex-col items-center space-y-6 animate-scale-in">
          <div className="w-full flex justify-center glass-card rounded-2xl p-8 shadow-2xl">
            <ChessBoard
              fen={game.fen}
              onMove={handleMove}
              orientation={orientation}
              disabled={!isMyTurn || game.status !== 'active'}
            />
          </div>

          {/* Move History */}
          {(game.moves || []).length > 0 && (
            <Card className="w-full">
              <h3 className="text-xl font-bold mb-5">Move History</h3>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {(game.moves || []).map((move, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <span className="text-text-secondary font-medium">
                      {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}
                    </span>
                    <span className="font-mono text-text-primary font-semibold">{move}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Game Info */}
        <div className="space-y-6">
          {/* Players */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xl font-bold mb-5">Players</h3>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 bg-bg-tertiary rounded-xl transition-all ${isMyTurn && isWhitePlayer ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-bg-primary font-bold shadow-lg">
                    W
                  </div>
                  <div>
                    <p className="font-bold text-lg">{game.whitePlayerUsername || 'White Player'}</p>
                    <p className="text-text-secondary">White</p>
                  </div>
                </div>
                {isWhitePlayer && (
                  <span className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg">You</span>
                )}
              </div>

              <div className={`flex items-center justify-between p-4 bg-bg-tertiary rounded-xl transition-all ${isMyTurn && isBlackPlayer ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-bg-primary border-2 border-white rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    B
                  </div>
                  <div>
                    <p className="font-bold text-lg">{game.blackPlayerUsername || 'Black Player'}</p>
                    <p className="text-text-secondary">Black</p>
                  </div>
                </div>
                {isBlackPlayer && (
                  <span className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg">You</span>
                )}
              </div>
            </div>
          </Card>

          {/* Time Control */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold mb-5 flex items-center space-x-3">
              <Clock className="w-6 h-6 text-primary" />
              <span>Time Control</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary font-medium">Initial Time</span>
                <span className="font-bold text-lg">{Math.floor((game.timeControl?.initial || 0) / 60)}:{(game.timeControl?.initial || 0) % 60}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary font-medium">Increment</span>
                <span className="font-bold text-lg">+{game.timeControl?.increment || 0}s</span>
              </div>
            </div>
          </Card>

          {/* Game Status */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-bold mb-5">Game Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary font-medium">Status</span>
                <span
                  className={`font-bold text-lg px-3 py-1 rounded-lg ${
                    game.status === 'active'
                      ? 'bg-success-light text-success'
                      : game.status === 'finished'
                      ? 'bg-text-tertiary/20 text-text-tertiary'
                      : 'bg-warning-light text-warning'
                  }`}
                >
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                </span>
              </div>
              {game.result && (
                <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                  <span className="text-text-secondary font-medium">Result</span>
                  <span className="font-bold text-lg">{game.result}</span>
                </div>
              )}
              {isMyTurn && game.status === 'active' && (
                <div className="mt-4 p-4 bg-primary-light border-2 border-primary rounded-xl animate-glow">
                  <p className="text-primary font-bold text-center text-lg">Your Turn!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

