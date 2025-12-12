import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3014';

export function useWebSocket(gameId: string | null, onMessage?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!gameId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    let socket: Socket | null = null;
    let isConnected = false;
    let isIntentionalDisconnect = false;

    const connect = () => {
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        return;
      }

      try {
        socket = io(WS_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          timeout: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          isConnected = true;
          reconnectAttemptsRef.current = 0;
          console.log('WebSocket connected');
          if (gameId) {
            socket?.emit('game:join', gameId);
          }
        });

        socket.on('disconnect', (reason) => {
          isConnected = false;
          console.log('WebSocket disconnected:', reason);
          if (!isIntentionalDisconnect && reason !== 'io client disconnect') {
            reconnectAttemptsRef.current++;
          }
        });

        socket.on('connect_error', (error) => {
          console.warn('WebSocket connection error:', error.message);
          reconnectAttemptsRef.current++;
        });

        // Listen for game updates (compatibility)
        socket.on('game_update', (data) => {
          if (onMessage && isConnected) {
            console.log('Game update received:', data);
            onMessage({ type: 'game_update', ...data });
          }
        });

        // Listen for move events (primary)
        socket.on('game:move', (data) => {
          if (onMessage && isConnected) {
            console.log('Move received via WebSocket:', data);
            onMessage({ type: 'move_made', game: data.game, move: data.move, gameId: data.gameId });
          }
        });

        // Listen for game finished events
        socket.on('game_finished', (data) => {
          if (onMessage && isConnected) {
            console.log('Game finished:', data);
            onMessage({ type: 'game_finished', ...data });
          }
        });

        // Listen for player joined events
        socket.on('game:player-joined', (data) => {
          if (onMessage && isConnected) {
            console.log('Player joined game:', data);
            onMessage({ type: 'player_joined', gameId: data.gameId });
          }
        });

        // Listen for player left events
        socket.on('game:player-left', (data) => {
          if (onMessage && isConnected) {
            console.log('Player left game:', data);
            onMessage({ type: 'player_left', gameId: data.gameId });
          }
        });
      } catch (error) {
        console.warn('Failed to initialize WebSocket:', error);
      }
    };

    connect();

    return () => {
      isIntentionalDisconnect = true;
      if (socket) {
        try {
          if (gameId && isConnected) {
            socket.emit('game:leave', gameId);
          }
          socket.disconnect();
        } catch (error) {
          console.warn('Error during socket cleanup:', error);
        }
      }
      socketRef.current = null;
      reconnectAttemptsRef.current = 0;
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
