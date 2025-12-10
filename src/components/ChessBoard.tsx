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
    if (fen) {
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
        setSelectedSquare(null);
        setValidMoves([]);
      } catch (e) {
        console.error('Invalid FEN:', e);
      }
    }
  }, [fen]);

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    return isLight ? '#f0d9b5' : '#b58863';
  };

  const getSquareName = (visualRow: number, visualCol: number): Square => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    if (orientation === 'white') {
      return `${files[visualCol]}${ranks[visualRow]}` as Square;
    } else {
      return `${files[7 - visualCol]}${ranks[7 - visualRow]}` as Square;
    }
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

      if (selectedSquare && validMoves.includes(square)) {
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
          toast.error('Invalid move');
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else if (piece) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [game, selectedSquare, validMoves, disabled, onMove]
  );

  const isSquareSelected = (square: Square) => selectedSquare === square;
  const isValidMove = (square: Square) => validMoves.includes(square);
  const isHovered = (square: Square) => hoveredSquare === square;

  const renderSquare = (visualRow: number, visualCol: number) => {
    const square = getSquareName(visualRow, visualCol);
    const piece = game.get(square);
    const bgColor = getSquareColor(visualRow, visualCol);
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

  const visualRows = [0, 1, 2, 3, 4, 5, 6, 7];
  const visualCols = [0, 1, 2, 3, 4, 5, 6, 7];

  const getFileLabel = (visualCol: number): string => {
    const files = 'abcdefgh';
    return orientation === 'white' ? files[visualCol] : files[7 - visualCol];
  };

  const getRankLabel = (visualRow: number): string => {
    const ranks = '87654321';
    return orientation === 'white' ? ranks[visualRow] : ranks[7 - visualRow];
  };

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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${SQUARE_SIZE}px)`,
          paddingBottom: '4px',
          paddingLeft: '4px',
        }}
      >
        {visualCols.map((col) => (
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            paddingRight: '4px',
            paddingTop: '4px',
          }}
        >
          {visualRows.map((row) => (
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
          {visualRows.map((row) => 
            visualCols.map((col) => renderSquare(row, col))
          )}
        </div>
      </div>
    </div>
  );
}
