import { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (move: string) => void;
  orientation?: 'white' | 'black';
  disabled?: boolean;
}

const SQUARE_SIZE = 60;

const PIECES: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const getPieceSymbol = (piece: { type: string; color: string }): string => {
  const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
  return PIECES[key] || '';
};

export default function ChessBoard({
  fen,
  onMove,
  orientation = 'white',
  disabled = false,
}: ChessBoardProps) {
  const [game, setGame] = useState(new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  useEffect(() => {
    if (fen) {
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
      } catch (e) {
        console.error('Invalid FEN:', e);
      }
    }
  }, [fen]);

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    return isLight ? '#f0d9b5' : '#b58863';
  };

  const getSquareName = (row: number, col: number): Square => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return `${files[col]}${ranks[row]}` as Square;
  };

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (disabled) return;

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const piece = game.get(square);
      const isMyTurn = game.turn() === (orientation === 'white' ? 'w' : 'b');

      if (selectedSquare && validMoves.includes(square)) {
        // Make move
        try {
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q',
          });
          if (move && onMove) {
            onMove(move.san);
          }
          setSelectedSquare(null);
          setValidMoves([]);
        } catch (e) {
          console.error('Invalid move:', e);
        }
      } else if (piece && piece.color === (orientation === 'white' ? 'w' : 'b') && isMyTurn) {
        // Select piece
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [game, selectedSquare, validMoves, orientation, disabled, onMove]
  );

  const isSquareSelected = (square: Square) => selectedSquare === square;
  const isValidMove = (square: Square) => validMoves.includes(square);
  const isHovered = (square: Square) => hoveredSquare === square;

  const renderSquare = (row: number, col: number) => {
    const square = getSquareName(row, col);
    const piece = game.get(square);
    const bgColor = getSquareColor(row, col);
    const isSelected = isSquareSelected(square);
    const isValid = isValidMove(square);
    const hovered = isHovered(square);

    let squareStyle: React.CSSProperties = {
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      transition: 'all 0.2s ease',
    };

    if (isSelected) {
      squareStyle.backgroundColor = '#f7f769';
      squareStyle.boxShadow = 'inset 0 0 0 3px #8b5cf6';
    } else if (isValid) {
      squareStyle.backgroundColor = hovered ? '#a8e6cf' : '#c8e6c9';
    } else if (hovered) {
      squareStyle.backgroundColor = '#e0e0e0';
    }

    return (
      <div
        key={square}
        style={squareStyle}
        onClick={() => handleSquareClick(square)}
        onMouseEnter={() => !disabled && setHoveredSquare(square)}
        onMouseLeave={() => setHoveredSquare(null)}
      >
        {piece && (
          <span
            style={{
              fontSize: '40px',
              userSelect: 'none',
              filter: isSelected ? 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.8))' : 'none',
            }}
          >
            {getPieceSymbol(piece)}
          </span>
        )}
        {isValid && !piece && (
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 92, 246, 0.6)',
              position: 'absolute',
            }}
          />
        )}
      </div>
    );
  };

  const rows = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div
      style={{
        display: 'inline-block',
        border: '3px solid #2a2a3a',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${SQUARE_SIZE}px)`,
          gridTemplateRows: `repeat(8, ${SQUARE_SIZE}px)`,
        }}
      >
        {rows.map((row) => cols.map((col) => renderSquare(row, col)))}
      </div>
    </div>
  );
}

