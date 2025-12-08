import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import ChessBoard from '../components/ChessBoard';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Game } from '../types';
import { Chess } from 'chess.js';

export default function GameReplay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [currentFen, setCurrentFen] = useState('');

  useEffect(() => {
    if (id) {
      loadGame();
    }
  }, [id]);

  useEffect(() => {
    if (game && game.moves.length > 0) {
      const chess = new Chess();
      const history: string[] = [chess.fen()];
      
      for (const move of game.moves) {
        try {
          chess.move(move);
          history.push(chess.fen());
        } catch (e) {
          console.error('Invalid move:', move);
        }
      }
      
      setGameHistory(history);
      setCurrentMoveIndex(0);
      setCurrentFen(history[0]);
    }
  }, [game]);

  useEffect(() => {
    if (isPlaying && currentMoveIndex < gameHistory.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMoveIndex((prev) => {
          const next = prev + 1;
          setCurrentFen(gameHistory[next]);
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentMoveIndex >= gameHistory.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMoveIndex, gameHistory]);

  const loadGame = async () => {
    if (!id) return;
    try {
      const gameData = await apiService.getGame(id);
      setGame(gameData);
    } catch (error) {
      toast.error('Failed to load game');
      navigate('/games');
    } finally {
      setIsLoading(false);
    }
  };

  const goToMove = (index: number) => {
    if (index >= 0 && index < gameHistory.length) {
      setCurrentMoveIndex(index);
      setCurrentFen(gameHistory[index]);
      setIsPlaying(false);
    }
  };

  const previousMove = () => {
    if (currentMoveIndex > 0) {
      goToMove(currentMoveIndex - 1);
    }
  };

  const nextMove = () => {
    if (currentMoveIndex < gameHistory.length - 1) {
      goToMove(currentMoveIndex + 1);
    }
  };

  const togglePlay = () => {
    if (currentMoveIndex >= gameHistory.length - 1) {
      goToMove(0);
    }
    setIsPlaying(!isPlaying);
  };

  const exportPGN = () => {
    if (!game) return;
    
    let pgn = `[Event "KnightChess Game"]\n`;
    pgn += `[Site "KnightChess"]\n`;
    pgn += `[Date "${new Date(game.createdAt).toISOString().split('T')[0]}"]\n`;
    pgn += `[White "${game.whitePlayerUsername || 'White'}"]\n`;
    pgn += `[Black "${game.blackPlayerUsername || 'Black'}"]\n`;
    pgn += `[Result "${game.result || '*'}"].\n\n`;
    
    const chess = new Chess();
    const moves: string[] = [];
    for (const move of game.moves) {
      try {
        const moveObj = chess.move(move);
        if (moveObj) {
          moves.push(moveObj.san);
        }
      } catch (e) {
        moves.push(move);
      }
    }
    
    pgn += moves.join(' ') + '\n';
    
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${game._id}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PGN exported');
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/games')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Game Replay</h1>
            <p className="text-text-secondary">
              {game.whitePlayerUsername} vs {game.blackPlayerUsername}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={exportPGN}>
          <Download className="w-4 h-4 mr-2" />
          Export PGN
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chess Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-center bg-bg-card border border-border rounded-2xl p-6">
            <ChessBoard fen={currentFen} disabled={true} />
          </div>

          {/* Controls */}
          <Card>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                onClick={previousMove}
                disabled={currentMoveIndex <= 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="primary" onClick={togglePlay}>
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Play
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={nextMove}
                disabled={currentMoveIndex >= gameHistory.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="px-4 py-2 bg-bg-tertiary rounded-lg">
                <span className="text-text-secondary text-sm">
                  Move {currentMoveIndex + 1} / {gameHistory.length}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Move List */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-bold mb-4">Move History</h3>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {game.moves.map((move, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhite = index % 2 === 0;
                const isCurrent = index === currentMoveIndex;
                
                return (
                  <div
                    key={index}
                    onClick={() => goToMove(index + 1)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-primary-light border border-primary'
                        : 'bg-bg-tertiary hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isWhite && <span className="text-text-secondary w-8">{moveNumber}.</span>}
                      {!isWhite && <span className="text-text-secondary w-8">...</span>}
                      <span className="font-mono">{move}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Game Info */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Game Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Result</span>
                <span className="font-semibold">{game.result || 'Ongoing'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status</span>
                <span className="font-semibold capitalize">{game.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Moves</span>
                <span className="font-semibold">{game.moves.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

