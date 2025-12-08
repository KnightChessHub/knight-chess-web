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
      setIsMyTurn(
        game.status === 'active' &&
          ((game.moves.length % 2 === 0 && isWhite) || (game.moves.length % 2 === 1 && !isWhite))
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/games')} size="md">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Chess Game</h1>
            <p className="text-text-secondary">
              {game.status === 'active' ? 'In Progress' : game.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {game.status === 'finished' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/games/${game._id}/replay`)} size="md">
                <RotateCcw className="w-4 h-4" />
                Replay
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/games/${game._id}/analysis`)} size="md">
                <BarChart3 className="w-4 h-4" />
                Analyze
              </Button>
            </>
          )}
          {isPlayer && game.status === 'active' && (
            <Button variant="danger" onClick={handleResign} size="md">
              <Flag className="w-4 h-4" />
              Resign
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chess Board */}
        <div className="lg:col-span-2 flex flex-col items-center space-y-6">
          <div className="w-full flex justify-center bg-bg-card border border-border rounded-2xl p-6">
            <ChessBoard
              fen={game.fen}
              onMove={handleMove}
              orientation={orientation}
              disabled={!isMyTurn || game.status !== 'active'}
            />
          </div>

          {/* Move History */}
          {game.moves.length > 0 && (
            <Card className="w-full">
              <h3 className="text-lg font-bold mb-4">Move History</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {game.moves.map((move, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-bg-tertiary rounded hover:bg-bg-hover"
                  >
                    <span className="text-text-secondary">
                      {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}
                    </span>
                    <span className="font-mono">{move}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Game Info */}
        <div className="space-y-4">
          {/* Players */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Players</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-bg-primary font-bold">
                    W
                  </div>
                  <div>
                    <p className="font-semibold">{game.whitePlayerUsername || 'White Player'}</p>
                    <p className="text-text-secondary text-sm">White</p>
                  </div>
                </div>
                {isWhitePlayer && (
                  <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded">You</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-bg-primary border-2 border-white rounded-full flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <div>
                    <p className="font-semibold">{game.blackPlayerUsername || 'Black Player'}</p>
                    <p className="text-text-secondary text-sm">Black</p>
                  </div>
                </div>
                {isBlackPlayer && (
                  <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded">You</span>
                )}
              </div>
            </div>
          </Card>

          {/* Time Control */}
          <Card>
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Time Control</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Initial Time</span>
                <span className="font-semibold">{game.timeControl.initial}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Increment</span>
                <span className="font-semibold">+{game.timeControl.increment}s</span>
              </div>
            </div>
          </Card>

          {/* Game Status */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Game Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Status</span>
                <span
                  className={`font-semibold ${
                    game.status === 'active'
                      ? 'text-text-primary'
                      : game.status === 'finished'
                      ? 'text-text-primary'
                      : 'text-text-secondary'
                  }`}
                >
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                </span>
              </div>
              {game.result && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Result</span>
                  <span className="font-semibold">{game.result}</span>
                </div>
              )}
              {isMyTurn && game.status === 'active' && (
                <div className="mt-4 p-3 bg-primary-light border border-primary rounded-lg">
                  <p className="text-primary font-semibold text-center">Your Turn!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

