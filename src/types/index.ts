export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  rating?: number;
  createdAt: string;
  status?: 'online' | 'offline' | 'playing';
}

export interface Game {
  _id: string;
  whitePlayer: string;
  blackPlayer?: string; // Optional - undefined for joinable online games
  whitePlayerUsername?: string;
  blackPlayerUsername?: string;
  gameType?: 'online' | 'offline'; // Track game type
  currentTurn?: 'white' | 'black'; // Current turn from backend
  status: 'waiting' | 'active' | 'finished' | 'abandoned' | 'pending'; // Added 'pending'
  result?: 'white' | 'black' | 'draw';
  timeControl: {
    initial: number;
    increment: number;
  };
  fen: string;
  moves: string[];
  createdAt: string;
  updatedAt: string;
  whiteTime?: number; // Added
  blackTime?: number; // Added
}

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  organizer: string;
  format: 'swiss' | 'round-robin' | 'knockout';
  status: 'upcoming' | 'registration' | 'active' | 'finished';
  maxParticipants: number;
  participants?: string[]; // Made optional with default empty array
  rounds?: Round[];
  prizePool?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface Round {
  roundNumber: number;
  games: string[];
  completed: boolean;
}

export interface Rating {
  userId: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  peakRating: number;
  category: 'blitz' | 'rapid' | 'classical' | 'bullet';
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'game_invite' | 'friend_request' | 'tournament' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  senderUsername?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  from: string;
  to: string;
  fromUsername?: string;
  toUsername?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  createdAt: string;
}

export interface Statistics {
  userId: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  averageRating: number;
  bestStreak: number;
  currentStreak: number;
}

export interface MatchmakingQueue {
  userId: string;
  timeControl: {
    initial: number;
    increment: number;
  };
  ratingRange?: {
    min: number;
    max: number;
  };
  queuedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
}

