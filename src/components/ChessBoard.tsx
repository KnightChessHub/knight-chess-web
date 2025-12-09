import { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { toast } from 'react-hot-toast';

interface ChessBoardProps {
  fen?: string;
  onMove?: (move: string) => void;
  orientation?: 'white' | 'black';
  disabled?: boolean;
}

const SQUARE_SIZE = 70;

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
    console.log('ChessBoard orientation changed to:', orientation);
  }, [orientation]);

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

  const getFileLabel = (col: number): string => {
    const files = 'abcdefgh';
    return files[orientation === 'white' ? col : 7 - col];
  };

  const getRankLabel = (row: number): string => {
    const ranks = '87654321';
    return ranks[orientation === 'white' ? row : 7 - row];
  };

  const getSquareName = (row: number, col: number): Square => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    // row and col are actual board coordinates (0-7), not visual positions
    // So we can use them directly
    return `${files[col]}${ranks[row]}` as Square;
  };

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (disabled) {
        console.log('Board is disabled');
        return;
      }

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const piece = game.get(square);
      // Check if it's the correct player's turn based on FEN
      const currentTurn = game.turn(); // 'w' or 'b'
      const expectedColor = orientation === 'white' ? 'w' : 'b';

      if (selectedSquare && validMoves.includes(square)) {
        // Make move - only check if disabled prop allows it
        try {
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q',
          });
          if (move && onMove) {
            console.log('Sending move:', move.san);
            onMove(move.san);
          }
          setSelectedSquare(null);
          setValidMoves([]);
        } catch (e) {
          console.error('Invalid move:', e);
          toast.error('Invalid move');
        }
      } else if (piece && piece.color === expectedColor && currentTurn === expectedColor) {
        // Select piece - only if it's the correct color and turn
        // The disabled prop should prevent this if it's not the user's turn
        // But if disabled is false, allow selection even if turn check fails (for offline games)
        if (!disabled) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          setValidMoves(moves.map((m) => m.to as Square));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
        if (piece && piece.color !== expectedColor) {
          console.log('Not your piece');
        } else if (currentTurn !== expectedColor) {
          console.log('Not your turn - current:', currentTurn, 'expected:', expectedColor);
        }
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
      squareStyle.boxShadow = 'inset 0 0 0 4px rgba(5, 150, 105, 0.8)';
      squareStyle.zIndex = 10;
    } else if (isValid) {
      squareStyle.backgroundColor = hovered ? '#a8e6cf' : '#c8e6c9';
      squareStyle.boxShadow = hovered ? 'inset 0 0 0 2px rgba(5, 150, 105, 0.5)' : 'none';
    } else if (hovered && piece) {
      squareStyle.backgroundColor = '#e8e8e8';
      squareStyle.transform = 'scale(1.1)';
      squareStyle.zIndex = 5;
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
              fontSize: '48px',
              userSelect: 'none',
              filter: isSelected 
                ? 'drop-shadow(0 0 8px rgba(5, 150, 105, 0.9))' 
                : hovered 
                ? 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))'
                : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
              transition: 'all 0.2s ease',
              cursor: disabled ? 'not-allowed' : 'grab',
            }}
          >
            {getPieceSymbol(piece)}
          </span>
        )}
        {isValid && !piece && (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: hovered ? 'rgba(5, 150, 105, 0.8)' : 'rgba(5, 150, 105, 0.5)',
              position: 'absolute',
              transition: 'all 0.2s ease',
            }}
          />
        )}
        {isValid && piece && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid rgba(5, 150, 105, 0.6)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    );
  };

  // Row 0 = rank 8 (black pieces), Row 7 = rank 1 (white pieces)
  // When orientation is 'white', white pieces should be at bottom (row 7 first)
  // When orientation is 'black', black pieces should be at bottom (row 0 first)
  // Columns are always left-to-right (a-h), regardless of orientation
  const rows = orientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7]; // Always left-to-right (a-h)

  return (
    <div
      style={{
        display: 'inline-block',
        border: '4px solid rgba(42, 42, 58, 0.8)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(17, 17, 17, 0.9) 100%)',
        padding: '8px',
      }}
    >
      {/* File labels (a-h) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${SQUARE_SIZE}px)`,
          paddingBottom: '4px',
          paddingLeft: '4px',
        }}
      >
        {cols.map((col) => (
          <div
            key={`file-${col}`}
            style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'rgba(163, 163, 163, 0.8)',
              userSelect: 'none',
            }}
          >
            {getFileLabel(col)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex' }}>
        {/* Rank labels (1-8) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            paddingRight: '4px',
            paddingTop: '4px',
          }}
        >
          {rows.map((row) => (
            <div
              key={`rank-${row}`}
              style={{
                height: `${SQUARE_SIZE}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'rgba(163, 163, 163, 0.8)',
                userSelect: 'none',
              }}
            >
              {getRankLabel(row)}
            </div>
          ))}
        </div>

        {/* Board */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(8, ${SQUARE_SIZE}px)`,
            gridTemplateRows: `repeat(8, ${SQUARE_SIZE}px)`,
            border: '2px solid rgba(42, 42, 58, 0.6)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {rows.map((row) => cols.map((col) => renderSquare(row, col)))}
        </div>
      </div>
    </div>
  );
}

