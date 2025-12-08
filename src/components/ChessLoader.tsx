export default function ChessLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-backdrop">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-24 h-24">
          {/* Chessboard Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-0 w-24 h-24 rounded overflow-hidden border-2 border-primary/30">
            {/* Top Left - Green */}
            <div className="bg-primary/30 border-r border-b border-primary/50"></div>
            {/* Top Right - White */}
            <div className="bg-bg-tertiary border-b border-border"></div>
            {/* Bottom Left - White */}
            <div className="bg-bg-tertiary border-r border-border"></div>
            {/* Bottom Right - Green */}
            <div className="bg-primary/30"></div>
          </div>
          
          {/* King Piece - Moving Animation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="chess-king-move">
              <div className="text-4xl font-bold text-primary drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(5,150,105,0.8)]">♔</div>
            </div>
          </div>
        </div>
        <p className="text-text-secondary text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

