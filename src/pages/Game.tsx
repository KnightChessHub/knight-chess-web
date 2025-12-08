import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import ChessBoard from '../components/ChessBoard';
import ChessLoader from '../components/ChessLoader';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Flag, Clock, RotateCcw, BarChart3, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Game } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentGame, setCurrentGame } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadGameRef = useRef<() => Promise<void>>();

  const loadGame = useCallback(async () => {
    if (!id) return;
    try {
      const gameData = await apiService.getGame(id);
      console.log('Game loaded:', gameData.status, 'blackPlayer:', gameData.blackPlayer);
      setGame(gameData);
      setCurrentGame(gameData);
    } catch (error) {
      console.error('Failed to load game:', error);
      toast.error('Failed to load game');
      navigate('/games');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, setCurrentGame]);

  // Store loadGame in ref so WebSocket callback can use it
  loadGameRef.current = loadGame;

  // Initial load and setup polling
  useEffect(() => {
    if (!id) return;

    // Reset state when game ID changes
    setGame(null);
    setIsLoading(true);
    setIsMyTurn(false);
    setOrientation('white');

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Load game initially
    loadGame();

    // Setup polling - will be updated when game status changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, loadGame]);

  // Setup/update polling based on game status
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Setup new interval if game is active or waiting
    if (game && (game.status === 'active' || game.status === 'waiting')) {
      intervalRef.current = setInterval(() => {
        loadGame();
      }, 2000);
    }

    // Cleanup on unmount or status change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [game?.status, loadGame]);

  // WebSocket for real-time updates
  useWebSocket(id || null, useCallback((data) => {
    if (data.game) {
      setGame(data.game);
      setCurrentGame(data.game);
    } else if (data.type === 'player_joined') {
      // When a player joins, reload the game to get updated status
      console.log('Player joined, reloading game...');
      if (loadGameRef.current) {
        loadGameRef.current();
      }
    }
  }, [setCurrentGame]));

  useEffect(() => {
    if (game && user) {
      const isWhitePlayer = game.whitePlayer === user._id;
      const isBlackPlayer = game.blackPlayer === user._id;
      
      // Set orientation:
      // - If user is white player: 'white'
      // - If user is black player: 'black'
      // - If offline game (both players same): 'white' (default)
      // - If not a player yet: 'white' (default for viewing)
      if (isWhitePlayer) {
        setOrientation('white');
      } else if (isBlackPlayer) {
        setOrientation('black');
      } else {
        // Not a player or offline game - default to white
        setOrientation('white');
      }
      
      // Determine if it's my turn using backend's currentTurn field
      if (game.status === 'active') {
        if (game.gameType === 'offline') {
          // For offline games, user can always move (they play both sides)
          setIsMyTurn(true);
        } else if (isWhitePlayer || isBlackPlayer) {
          const isMyTurnNow = 
            (isWhitePlayer && game.currentTurn === 'white') ||
            (isBlackPlayer && game.currentTurn === 'black');
          setIsMyTurn(isMyTurnNow);
          console.log('Turn check - isWhite:', isWhitePlayer, 'isBlack:', isBlackPlayer, 'currentTurn:', game.currentTurn, 'isMyTurn:', isMyTurnNow);
        } else {
          setIsMyTurn(false);
        }
      } else {
        setIsMyTurn(false);
      }
    }
  }, [game, user]);

  const handleMove = async (move: string) => {
    if (!id) {
      console.error('No game ID');
      return;
    }
    
    if (!isMyTurn) {
      console.log('Not your turn - isMyTurn:', isMyTurn, 'game.currentTurn:', game?.currentTurn);
      toast.error('Not your turn');
      return;
    }

    console.log('Making move:', move, 'Game status:', game?.status, 'Is my turn:', isMyTurn);
    
    try {
      const updatedGame = await apiService.makeMove(id, move);
      console.log('Move successful, updated game:', updatedGame);
      setGame(updatedGame);
      setCurrentGame(updatedGame);
      toast.success('Move made!');
      // Reload game to get latest state
      setTimeout(() => loadGame(), 500);
    } catch (error: any) {
      console.error('Move error:', error);
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
    return <ChessLoader />;
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
  // Can join if: game is waiting, user is not a player, game is online, and black player slot is empty
  const canJoin = game.status === 'waiting' 
    && !isPlayer 
    && game.gameType === 'online' 
    && !game.blackPlayer;

  const handleJoin = async () => {
    if (!id) return;
    try {
      const updatedGame = await apiService.joinGame(id);
      setGame(updatedGame);
      setCurrentGame(updatedGame);
      toast.success('Game joined!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join game');
    }
  };

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
              {game.status === 'active'
                ? 'In Progress'
                : game.status === 'waiting'
                ? 'Waiting for Player'
                : game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {canJoin && (
            <Button variant="primary" onClick={handleJoin} size="md">
              <Play className="w-5 h-5" />
              Join Game
            </Button>
          )}
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

      {/* Join Game Banner */}
      {canJoin && (
        <Card className="bg-primary-light border-2 border-primary animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Play className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-primary">Join This Game</h3>
                <p className="text-text-secondary text-sm mt-1">
                  This game is waiting for a player. Click the button above to join as Black.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Waiting for Player Banner */}
      {game.status === 'waiting' && isWhitePlayer && !game.blackPlayer && (
        <Card className="bg-warning-light border-2 border-warning animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-warning flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-warning">Waiting for Opponent</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Your game is waiting for another player to join. Share the game link or wait for matchmaking.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chess Board */}
        <div className="lg:col-span-2 flex flex-col items-center space-y-6 animate-scale-in">
          <div className="w-full flex justify-center glass-card rounded-2xl p-8 shadow-2xl">
            <ChessBoard
              fen={game.fen}
              onMove={handleMove}
              orientation={orientation}
              disabled={game.status !== 'active' || !isMyTurn}
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

