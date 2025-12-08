import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3014';

export function useWebSocket(gameId: string | null, onMessage?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    let socket: Socket | null = null;
    let isConnected = false;

    const connect = () => {
      try {
        socket = io(WS_URL, {
          auth: { token },
          transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          timeout: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          isConnected = true;
          console.log('WebSocket connected');
          if (gameId) {
            socket?.emit('join_game', gameId);
          }
        });

        socket.on('disconnect', (reason) => {
          isConnected = false;
          console.log('WebSocket disconnected:', reason);
          // Only try to reconnect if it wasn't a manual disconnect
          if (reason !== 'io client disconnect') {
            // Reconnection is handled automatically by socket.io
          }
        });

        socket.on('connect_error', (error) => {
          console.warn('WebSocket connection error:', error.message);
          // Don't show error to user - WebSocket is optional for game updates
          // Game will still work with polling via API
        });

        socket.on('game_update', (data) => {
          if (onMessage && isConnected) {
            onMessage(data);
          }
        });

        socket.on('move_made', (data) => {
          if (onMessage && isConnected) {
            onMessage(data);
          }
        });

        socket.on('game_finished', (data) => {
          if (onMessage && isConnected) {
            onMessage(data);
          }
        });

        socket.on('game:player-joined', (data) => {
          // When a player joins, trigger a refresh
          if (onMessage && isConnected) {
            console.log('Player joined game:', data);
            // Trigger a reload by calling onMessage with a flag
            onMessage({ type: 'player_joined', gameId: data.gameId });
          }
        });
      } catch (error) {
        console.warn('Failed to initialize WebSocket:', error);
        // WebSocket is optional - game will work without it
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        try {
          if (gameId && isConnected) {
            socket.emit('leave_game', gameId);
          }
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      socketRef.current = null;
    };
  }, [gameId, onMessage]);

  const sendMove = (move: string) => {
    if (socketRef.current && gameId && socketRef.current.connected) {
      try {
        socketRef.current.emit('make_move', { gameId, move });
      } catch (error) {
        console.warn('Failed to send move via WebSocket:', error);
      }
    }
  };

  return { sendMove };
}

