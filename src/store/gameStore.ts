import { create } from 'zustand';
import type { Game } from '../types';

interface GameState {
  currentGame: Game | null;
  games: Game[];
  setCurrentGame: (game: Game | null) => void;
  setGames: (games: Game[]) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  games: [],
  setCurrentGame: (game) => set({ currentGame: game }),
  setGames: (games) => set({ games }),
  updateGame: (gameId, updates) =>
    set((state) => ({
      games: state.games.map((g) => (g._id === gameId ? { ...g, ...updates } : g)),
      currentGame:
        state.currentGame?._id === gameId ? { ...state.currentGame, ...updates } : state.currentGame,
    })),
}));

