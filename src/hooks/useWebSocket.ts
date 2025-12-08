import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3014';

export function useWebSocket(gameId: string | null, onMessage?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const token = localStorage.getItem('token');
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('join_game', gameId);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('game_update', (data) => {
      if (onMessage) {
        onMessage(data);
      }
    });

    socket.on('move_made', (data) => {
      if (onMessage) {
        onMessage(data);
      }
    });

    socket.on('game_finished', (data) => {
      if (onMessage) {
        onMessage(data);
      }
    });

    return () => {
      socket.emit('leave_game', gameId);
      socket.disconnect();
    };
  }, [gameId, onMessage]);

  const sendMove = (move: string) => {
    if (socketRef.current && gameId) {
      socketRef.current.emit('make_move', { gameId, move });
    }
  };

  return { sendMove };
}

