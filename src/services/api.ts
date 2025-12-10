import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Game,
  Tournament,
  Rating,
  Notification,
  ChatMessage,
  FriendRequest,
  Group,
  Statistics,
  MatchmakingQueue,
  AuthResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper to normalize API responses
  private normalizeResponse<T>(data: any, key: string): T {
    if (data && typeof data === 'object') {
      // Handle { success: true, data: { [key]: value } } structure
      if ('data' in data && data.data && typeof data.data === 'object') {
        if (key in data.data) {
          return data.data[key];
        }
        return data.data as T;
      }
      // Handle { [key]: value } structure
      if (key in data) {
        return data[key];
      }
      // Return as-is if structure doesn't match
      return data as T;
    }
    return data as T;
  }

  private normalizeArrayResponse<T>(data: any, key: string): T[] {
    const normalized = this.normalizeResponse<T[]>(data, key);
    return Array.isArray(normalized) ? normalized : [];
  }

  // Auth
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<{ success: boolean; data: AuthResponse } | AuthResponse>('/auth/register', {
      username,
      email,
      password,
    });
    // Handle both response structures
    if ('success' in data && data.success && 'data' in data) {
      return data.data;
    }
    return data as AuthResponse;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<{ success: boolean; data: AuthResponse } | AuthResponse>('/auth/login', {
      email,
      password,
    });
    // Handle both response structures
    if ('success' in data && data.success && 'data' in data) {
      return data.data;
    }
    return data as AuthResponse;
  }

  async verifyToken(): Promise<User> {
    const { data } = await this.api.get<{ success: boolean; data: { user: User } } | { user: User }>('/auth/verify');
    if ('data' in data && data.data) {
      return data.data.user;
    }
    return (data as { user: User }).user;
  }

  // Users
  async getCurrentUser(): Promise<User> {
    const { data } = await this.api.get<{ success: boolean; data: { user: User } } | { user: User }>('/users/me');
    if ('data' in data && data.data) {
      return data.data.user;
    }
    return (data as { user: User }).user;
  }

  async getUser(userId: string): Promise<User> {
    const { data } = await this.api.get<{ success: boolean; data: { user: User } } | { user: User }>(`/users/${userId}`);
    if ('data' in data && data.data) {
      return data.data.user;
    }
    return (data as { user: User }).user;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    const { data } = await this.api.put<{ success: boolean; data: { user: User } } | { user: User }>('/users/me', updates);
    if ('data' in data && data.data) {
      return data.data.user;
    }
    return (data as { user: User }).user;
  }

  // Helper to map backend status to frontend status
  private mapGameStatus(status: string): 'waiting' | 'active' | 'finished' | 'abandoned' {
    if (status === 'pending') return 'waiting';
    if (status === 'active') return 'active';
    if (status === 'finished') return 'finished';
    if (status === 'abandoned') return 'abandoned';
    return 'waiting'; // default
  }

  // Helper to map backend result to frontend result
  private mapGameResult(result: string | null | undefined): 'white' | 'black' | 'draw' | undefined {
    if (!result) return undefined;
    if (result === 'white_wins') return 'white';
    if (result === 'black_wins') return 'black';
    if (result === 'draw') return 'draw';
    return undefined;
  }

  // Helper to normalize game data from backend
  private normalizeGameData(gameData: any, timeControl?: { initial: number; increment: number }): Game {
    // For offline games, blackPlayer should be same as whitePlayer
    // For online games without blackPlayer, blackPlayer should be undefined
    const gameType = gameData.gameType || 'online';
    const isOffline = gameType === 'offline';
    const blackPlayerId = gameData.blackPlayerId || gameData.blackPlayer;
    const whitePlayerId = gameData.whitePlayerId || gameData.whitePlayer;
    
    // Determine blackPlayer: 
    // - Offline: always same as whitePlayer
    // - Online: only set if blackPlayerId exists and is different from whitePlayerId
    let blackPlayer: string | undefined;
    if (isOffline) {
      blackPlayer = blackPlayerId || whitePlayerId;
    } else {
      // Online game: only set blackPlayer if it exists and is different from white
      blackPlayer = (blackPlayerId && blackPlayerId !== whitePlayerId) ? blackPlayerId : undefined;
    }
    
    return {
      _id: gameData.id || gameData._id,
      whitePlayer: whitePlayerId,
      blackPlayer: blackPlayer,
      gameType: gameType,
      currentTurn: gameData.currentTurn || 'white',
      whitePlayerUsername: gameData.whitePlayerUsername,
      blackPlayerUsername: gameData.blackPlayerUsername,
      status: this.mapGameStatus(gameData.status),
      result: this.mapGameResult(gameData.result),
      timeControl: timeControl || gameData.timeControl || { initial: 600, increment: 0 },
      fen: gameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: gameData.moves ? gameData.moves.map((m: any) => {
        // Backend stores moves as { from, to, san, timestamp }, convert to string array
        return m.san || `${m.from}${m.to}`;
      }) : [],
      createdAt: gameData.createdAt || new Date().toISOString(),
      updatedAt: gameData.updatedAt || gameData.createdAt || new Date().toISOString(),
    };
  }

  // Games
  async createGame(timeControl: { initial: number; increment: number }, gameType: 'online' | 'offline' = 'online', blackPlayerId?: string, preferredSide?: 'white' | 'black' | 'random'): Promise<Game> {
    const payload: any = { gameType };
    if (gameType === 'online') {
      if (blackPlayerId) {
        payload.blackPlayerId = blackPlayerId;
      }
      if (preferredSide) {
        payload.preferredSide = preferredSide;
      }
    }
    
    try {
      const { data } = await this.api.post<{ success: boolean; data: any }>('/games', payload);
      
      // Backend returns: { success: true, data: { id, gameType, status, whitePlayerId, blackPlayerId, ... } }
      let gameData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          gameData = data.data;
        } else if ('game' in data) {
          gameData = data.game;
        } else {
          gameData = data;
        }
      }
      
      if (!gameData) {
        throw new Error('Invalid response from server');
      }
      
      return this.normalizeGameData(gameData, timeControl);
    } catch (error: any) {
      console.error('Create game error:', error?.response?.data || error);
      throw error;
    }
  }

  async getGames(params?: { status?: string; limit?: number }): Promise<Game[]> {
    try {
      // Map frontend status to backend status
      const backendParams: any = {};
      if (params?.status) {
        backendParams.status = params.status === 'waiting' ? 'pending' : params.status;
      }
      if (params?.limit) {
        backendParams.limit = params.limit;
      }

      const { data } = await this.api.get<{ success: boolean; data: any[] }>('/games', { params: backendParams });
      
      // Backend returns: { success: true, data: [...] } (array directly)
      let gamesData: any[] = [];
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data && Array.isArray(data.data)) {
          gamesData = data.data;
        } else if (Array.isArray(data)) {
          gamesData = data;
        } else if ('games' in data && Array.isArray(data.games)) {
          gamesData = data.games;
        }
      }
      
      return gamesData.map(gameData => this.normalizeGameData(gameData));
    } catch (error: any) {
      console.error('Get games error:', error?.response?.data || error);
      return [];
    }
  }

  async getGame(gameId: string): Promise<Game> {
    try {
      const { data } = await this.api.get<{ success: boolean; data: any }>(`/games/${gameId}`);
      
      // Backend returns: { success: true, data: { id, gameType, status, ... } }
      let gameData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          gameData = data.data;
        } else if ('game' in data) {
          gameData = data.game;
        } else {
          gameData = data;
        }
      }
      
      if (!gameData) {
        throw new Error('Game not found');
      }
      
      // Handle backend errors gracefully (e.g., getGameState not defined)
      // If gameData has error field, it means backend had an issue
      if (gameData.error) {
        console.warn('Backend error in game data:', gameData.error);
        // Try to return partial game data if available
        if (gameData.id) {
          // Return minimal game data - frontend can still display it
          return this.normalizeGameData({
            id: gameData.id,
            status: gameData.status || 'active',
            whitePlayerId: gameData.whitePlayerId,
            blackPlayerId: gameData.blackPlayerId,
            fen: gameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            moves: gameData.moves || [],
          });
        }
        throw new Error(gameData.error || 'Failed to load game');
      }
      
      return this.normalizeGameData(gameData);
    } catch (error: any) {
      // If it's a 500 error with getGameState issue, try to handle gracefully
      if (error?.response?.status === 500 && error?.response?.data?.error?.includes('getGameState')) {
        console.warn('Backend getGameState error - this is a backend bug, but continuing...');
        // Try to get basic game info without gameState
        // The game should still work for basic play
        throw new Error('Game service error - please try refreshing the page');
      }
      console.error('Get game error:', error?.response?.data || error);
      throw error;
    }
  }

  async makeMove(gameId: string, move: string): Promise<Game> {
    try {
      // Chess.js gives us SAN notation (e.g., "e4", "Nf3")
      // We need to convert to { from, to, promotion? } for backend
      
      const currentGame = await this.getGame(gameId);
      const { Chess } = await import('chess.js');
      const chess = new Chess(currentGame.fen);
      
      let moveObj: any;
      try {
        const parsedMove = chess.move(move);
        if (parsedMove) {
          moveObj = {
            from: parsedMove.from,
            to: parsedMove.to,
          };
          if (parsedMove.promotion) {
            moveObj.promotion = parsedMove.promotion;
          }
        } else {
          throw new Error('Invalid move');
        }
      } catch (parseError) {
        throw new Error('Invalid move: ' + move);
      }

      const { data } = await this.api.post<{ success: boolean; data: any }>(`/games/${gameId}/move`, moveObj);
      
      // Backend returns partial game data after move, need to get full game
      // But first check if response has full game data
      let gameData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          gameData = data.data;
        } else if ('game' in data) {
          gameData = data.game;
        } else {
          gameData = data;
        }
      }
      
      // If response doesn't have full game, fetch it
      if (!gameData || !gameData.id) {
        return await this.getGame(gameId);
      }
      
      return this.normalizeGameData(gameData);
    } catch (error: any) {
      console.error('Make move error:', error?.response?.data || error);
      throw error;
    }
  }

  async joinGame(gameId: string): Promise<Game> {
    try {
      const { data } = await this.api.post<{ success: boolean; data: any }>(`/games/${gameId}/join`);
      
      let gameData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          gameData = data.data;
        } else if ('game' in data) {
          gameData = data.game;
        } else {
          gameData = data;
        }
      }
      
      if (!gameData) {
        throw new Error('Invalid response from server');
      }
      
      return this.normalizeGameData(gameData);
    } catch (error: any) {
      console.error('Join game error:', error?.response?.data || error);
      throw error;
    }
  }

  async resignGame(gameId: string): Promise<Game> {
    try {
      const { data } = await this.api.post<{ success: boolean; data: any }>(`/games/${gameId}/resign`);
      
      let gameData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          gameData = data.data;
        } else if ('game' in data) {
          gameData = data.game;
        } else {
          gameData = data;
        }
      }
      
      if (!gameData) {
        throw new Error('Invalid response from server');
      }
      
      return this.normalizeGameData(gameData);
    } catch (error: any) {
      console.error('Resign game error:', error?.response?.data || error);
      throw error;
    }
  }

  // Tournaments
  async createTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    const { data } = await this.api.post('/tournaments', tournament);
    return this.normalizeResponse<Tournament>(data, 'tournament');
  }

  async getTournaments(params?: { status?: string }): Promise<Tournament[]> {
    const { data } = await this.api.get('/tournaments', { params });
    return this.normalizeArrayResponse<Tournament>(data, 'tournaments');
  }

  async getTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.get(`/tournaments/${tournamentId}`);
    const tournament = this.normalizeResponse<Tournament>(data, 'tournament');
    // Ensure participants array exists
    if (!tournament.participants) {
      tournament.participants = [];
    }
    return tournament;
  }

  async joinTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.post(`/tournaments/${tournamentId}/join`);
    return this.normalizeResponse<Tournament>(data, 'tournament');
  }

  async leaveTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.post(`/tournaments/${tournamentId}/leave`);
    return this.normalizeResponse<Tournament>(data, 'tournament');
  }

  // Ratings
  async getLeaderboard(timeControl?: string, limit?: number): Promise<Rating[]> {
    const params: any = {};
    // Backend expects timeControl to be a valid value: 'blitz', 'rapid', 'classical', 'bullet'
    // Don't pass 'all' as it causes backend errors - pass a valid timeControl or omit
    if (timeControl && timeControl !== 'all') {
      params.timeControl = timeControl;
    }
    if (limit) {
      params.limit = limit;
    }
    
    try {
      const { data } = await this.api.get('/ratings/leaderboard', { 
        params,
        timeout: 5000, // 5 second timeout
      });
      // Backend returns { success: true, data: [...] }
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data && Array.isArray(data.data)) {
          return data.data;
        }
        if (Array.isArray(data)) {
          return data;
        }
        // Try to find leaderboard array in response
        if ('leaderboard' in data && Array.isArray(data.leaderboard)) {
          return data.leaderboard;
        }
      }
      return [];
    } catch (error: any) {
      // Don't log errors for leaderboard - it's optional and backend might have issues
      // Just return empty array silently
      return [];
    }
  }

  async getUserRating(userId?: string, timeControl?: string): Promise<Rating> {
    try {
      const params: any = {};
      if (timeControl) {
        params.timeControl = timeControl;
      }
      // If userId is provided, use it; otherwise use empty string to get current user's rating
      const url = userId ? `/ratings/${userId}` : '/ratings';
      const { data } = await this.api.get(url, { params });
      return this.normalizeResponse<Rating>(data, 'rating');
    } catch (error: any) {
      console.error('Get user rating error:', error?.response?.data || error);
      // Return default rating if error occurs
      return {
        userId: userId || '',
        rating: 1200,
        peakRating: 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        category: (timeControl as 'blitz' | 'rapid' | 'classical' | 'bullet') || 'blitz',
      };
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const { data } = await this.api.get('/notifications');
    return this.normalizeArrayResponse<Notification>(data, 'notifications');
  }

  async getUnreadCount(): Promise<number> {
    const { data } = await this.api.get('/notifications/unread/count');
    return this.normalizeResponse<number>(data, 'count') || 0;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.api.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.api.put('/notifications/read/all');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.api.delete(`/notifications/${notificationId}`);
  }

  // Chat
  async sendMessage(receiverId: string, message: string): Promise<ChatMessage> {
    const { data } = await this.api.post('/chat', {
      receiverId,
      message,
    });
    return this.normalizeResponse<ChatMessage>(data, 'message');
  }

  async getConversations(): Promise<ChatMessage[]> {
    const { data } = await this.api.get('/chat/conversations');
    return this.normalizeArrayResponse<ChatMessage>(data, 'conversations');
  }

  async getConversation(userId: string, limit?: number): Promise<ChatMessage[]> {
    const { data } = await this.api.get(`/chat/conversations/${userId}`, {
      params: { limit },
    });
    return this.normalizeArrayResponse<ChatMessage>(data, 'messages');
  }

  // Friends
  async sendFriendRequest(userId: string): Promise<FriendRequest> {
    const { data } = await this.api.post('/friends/request', { userId });
    return this.normalizeResponse<FriendRequest>(data, 'request');
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    const { data } = await this.api.get('/friends/requests');
    return this.normalizeArrayResponse<FriendRequest>(data, 'requests');
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await this.api.put(`/friends/requests/${requestId}/accept`);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await this.api.delete(`/friends/requests/${requestId}`);
  }

  async getFriends(): Promise<User[]> {
    const { data } = await this.api.get('/friends/list');
    return this.normalizeArrayResponse<User>(data, 'friends');
  }

  // Matchmaking
  async joinMatchmakingQueue(timeControl: { initial: number; increment: number }): Promise<MatchmakingQueue> {
    try {
      // Backend expects timeControl as a string: 'blitz', 'rapid', 'classical', 'bullet'
      // Convert timeControl object to string based on initial time
      let timeControlStr: string;
      if (timeControl.initial <= 60) {
        timeControlStr = 'bullet';
      } else if (timeControl.initial <= 300) {
        timeControlStr = 'blitz';
      } else if (timeControl.initial <= 600) {
        timeControlStr = 'rapid';
      } else {
        timeControlStr = 'classical';
      }

      const { data } = await this.api.post('/matchmaking/queue', { timeControl: timeControlStr });
      
      // Backend returns: { success: true, data: { matched: boolean, game?, queuePosition?, ... } }
      let queueData: any;
      if (data && typeof data === 'object') {
        if ('success' in data && data.success && 'data' in data) {
          queueData = data.data;
        } else {
          queueData = data;
        }
      }
      
      // Return a MatchmakingQueue-like object
      return {
        userId: '', // Will be set by backend
        timeControl: timeControl,
        queuedAt: new Date().toISOString(),
        ...queueData,
      };
    } catch (error: any) {
      console.error('Join matchmaking error:', error?.response?.data || error);
      throw error;
    }
  }

  async leaveMatchmakingQueue(): Promise<void> {
    await this.api.delete('/matchmaking/queue');
  }

  async getMatchmakingStatus(): Promise<MatchmakingQueue | null> {
    const { data } = await this.api.get('/matchmaking/queue/status');
    const queue = this.normalizeResponse<MatchmakingQueue | null>(data, 'queue');
    return queue || null;
  }

  // Statistics
  async getStatistics(userId?: string): Promise<Statistics> {
    const { data } = await this.api.get(`/statistics/${userId || ''}`);
    return this.normalizeResponse<Statistics>(data, 'statistics');
  }

  // Groups
  async createGroup(group: Partial<Group>): Promise<Group> {
    const { data } = await this.api.post('/groups', group);
    return this.normalizeResponse<Group>(data, 'group');
  }

  async getGroups(): Promise<Group[]> {
    const { data } = await this.api.get('/groups');
    return this.normalizeArrayResponse<Group>(data, 'groups');
  }

  async getGroup(groupId: string): Promise<Group> {
    const { data } = await this.api.get(`/groups/${groupId}`);
    const group = this.normalizeResponse<Group>(data, 'group');
    // Ensure members array exists
    if (!group.members) {
      group.members = [];
    }
    return group;
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const { data } = await this.api.put(`/groups/${groupId}`, updates);
    return this.normalizeResponse<Group>(data, 'group');
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.api.delete(`/groups/${groupId}`);
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    await this.api.post(`/groups/${groupId}/members`, { userId });
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.api.delete(`/groups/${groupId}/members/${userId}`);
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    const { data } = await this.api.get(`/groups/${groupId}/members`);
    return this.normalizeArrayResponse<User>(data, 'members');
  }

  // Search
  async search(query: string, type?: string): Promise<any> {
    const { data } = await this.api.get('/search', {
      params: { q: query, type },
    });
    return data;
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const { data } = await this.api.get('/search/users', {
        params: { q: query },
      });
      // Backend returns { success: true, data: [...] }
      if (data && typeof data === 'object') {
        if ('data' in data && Array.isArray(data.data)) {
          return data.data;
        }
        if ('success' in data && data.success && 'data' in data && Array.isArray(data.data)) {
          return data.data;
        }
      }
      return [];
    } catch (error: any) {
      console.error('Search users error:', error?.response?.data || error);
      return [];
    }
  }

  // Activity
  async getActivityFeed(): Promise<any[]> {
    try {
      const { data } = await this.api.get('/activity/feed');
      const activities = this.normalizeArrayResponse<any>(data, 'activities');
      return Array.isArray(activities) ? activities.filter(item => item != null) : [];
    } catch (error) {
      console.error('Failed to load activity feed:', error);
      return [];
    }
  }

  async getMyActivity(): Promise<any[]> {
    const { data } = await this.api.get('/activity/my');
    return this.normalizeArrayResponse<any>(data, 'activities');
  }

  async getUserActivity(userId: string, params?: { limit?: number }): Promise<any[]> {
    const { data } = await this.api.get(`/activity/user/${userId}`, { params });
    return this.normalizeArrayResponse<any>(data, 'activities');
  }

  // Game Replay
  async getReplay(gameId: string): Promise<Game> {
    const { data } = await this.api.get(`/replay/${gameId}`);
    return this.normalizeResponse<Game>(data, 'replay');
  }

  // Analysis
  async analyzeGame(gameId: string, analysisData: any): Promise<any> {
    const { data } = await this.api.post('/analysis/analyze', { gameId, ...analysisData });
    return data;
  }

  async getGameAnalysis(gameId: string): Promise<any> {
    const { data } = await this.api.get(`/analysis/${gameId}`);
    return data;
  }

  async getMyAnalyses(): Promise<any[]> {
    const { data } = await this.api.get('/analysis/my');
    return this.normalizeArrayResponse<any>(data, 'analyses');
  }

  // Files
  async uploadFile(file: File, metadata?: any): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    const { data } = await this.api.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async getMyFiles(params?: { limit?: number }): Promise<any[]> {
    const { data } = await this.api.get('/files/my', { params });
    return this.normalizeArrayResponse<any>(data, 'files');
  }

  async getFile(fileId: string): Promise<any> {
    const { data } = await this.api.get(`/files/${fileId}`);
    return data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.api.delete(`/files/${fileId}`);
  }

  // Reports
  async createReport(report: { type: string; targetId: string; reason: string; description?: string }): Promise<any> {
    const { data } = await this.api.post('/reports', report);
    return data;
  }

  async getMyReports(): Promise<any[]> {
    const { data } = await this.api.get('/reports/my');
    return this.normalizeArrayResponse<any>(data, 'reports');
  }

  async getReports(params?: { status?: string }): Promise<any[]> {
    const { data } = await this.api.get('/reports', { params });
    return this.normalizeArrayResponse<any>(data, 'reports');
  }

  async updateReportStatus(reportId: string, status: string): Promise<void> {
    await this.api.put(`/reports/${reportId}/status`, { status });
  }

  // Timers
  async getGameTimer(gameId: string): Promise<any> {
    const { data } = await this.api.get(`/timers/${gameId}`);
    return data;
  }

  async startTimer(gameId: string): Promise<void> {
    await this.api.post(`/timers/${gameId}/start`);
  }

  async stopTimer(gameId: string): Promise<void> {
    await this.api.post(`/timers/${gameId}/stop`);
  }

  async pauseTimer(gameId: string): Promise<void> {
    await this.api.post(`/timers/${gameId}/pause`);
  }

  // Tournaments
  async startTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.post(`/tournaments/${tournamentId}/start`);
    return this.normalizeResponse<Tournament>(data, 'tournament');
  }

  async getMyTournaments(): Promise<Tournament[]> {
    const { data } = await this.api.get('/tournaments/my');
    return this.normalizeArrayResponse<Tournament>(data, 'tournaments');
  }

  // Friends
  async removeFriend(friendId: string): Promise<void> {
    await this.api.delete(`/friends/${friendId}`);
  }

  async blockUser(userId: string): Promise<void> {
    await this.api.post(`/friends/block/${userId}`);
  }

  // Chat
  async getChatUnreadCount(): Promise<number> {
    const { data } = await this.api.get('/chat/unread/count');
    return this.normalizeResponse<number>(data, 'count') || 0;
  }

  async markChatMessageRead(messageId: string): Promise<void> {
    await this.api.put(`/chat/${messageId}/read`);
  }

  // Statistics
  async getGlobalStatistics(): Promise<any> {
    const { data } = await this.api.get('/statistics/global');
    return data;
  }

  // Ratings
  async recordRating(ratingData: { gameId: string; whiteRating: number; blackRating: number; result: string }): Promise<void> {
    await this.api.post('/ratings/record', ratingData);
  }
}

export const apiService = new ApiService();
