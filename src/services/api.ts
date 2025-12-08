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

  // Games
  async createGame(timeControl: { initial: number; increment: number }, gameType: 'online' | 'offline' = 'online'): Promise<Game> {
    const { data } = await this.api.post<{ success: boolean; data: { game: Game } } | { game: Game }>('/games', { 
      gameType,
      timeControl 
    });
    let game: Game;
    if ('data' in data && data.data) {
      game = data.data.game;
    } else {
      game = (data as { game: Game }).game;
    }
    // Ensure moves array exists
    if (!game.moves) {
      game.moves = [];
    }
    return game;
  }

  async getGames(params?: { status?: string; limit?: number }): Promise<Game[]> {
    const { data } = await this.api.get<{ success: boolean; data: { games: Game[] } } | { games: Game[] }>('/games', { params });
    let games: Game[];
    if ('data' in data && data.data) {
      games = data.data.games || [];
    } else {
      games = (data as { games: Game[] }).games || [];
    }
    // Ensure all games have moves array
    return games.map(game => ({
      ...game,
      moves: game.moves || []
    }));
  }

  async getGame(gameId: string): Promise<Game> {
    const { data } = await this.api.get<{ success: boolean; data: { game: Game } } | { game: Game }>(`/games/${gameId}`);
    let game: Game;
    if ('data' in data && data.data) {
      game = data.data.game;
    } else {
      game = (data as { game: Game }).game;
    }
    // Ensure moves array exists
    if (!game.moves) {
      game.moves = [];
    }
    return game;
  }

  async makeMove(gameId: string, move: string): Promise<Game> {
    const { data } = await this.api.post<{ success: boolean; data: { game: Game } } | { game: Game }>(`/games/${gameId}/move`, { move });
    let game: Game;
    if ('data' in data && data.data) {
      game = data.data.game;
    } else {
      game = (data as { game: Game }).game;
    }
    // Ensure moves array exists
    if (!game.moves) {
      game.moves = [];
    }
    return game;
  }

  async joinGame(gameId: string): Promise<Game> {
    const { data } = await this.api.post<{ success: boolean; data: { game: Game } } | { game: Game }>(`/games/${gameId}/join`);
    if ('data' in data && data.data) {
      return data.data.game;
    }
    return (data as { game: Game }).game;
  }

  async resignGame(gameId: string): Promise<Game> {
    const { data } = await this.api.post<{ success: boolean; data: { game: Game } } | { game: Game }>(`/games/${gameId}/resign`);
    if ('data' in data && data.data) {
      return data.data.game;
    }
    return (data as { game: Game }).game;
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
  async getLeaderboard(category?: string, limit?: number): Promise<Rating[]> {
    const { data } = await this.api.get('/ratings/leaderboard', {
      params: { category, limit },
    });
    return this.normalizeArrayResponse<Rating>(data, 'leaderboard');
  }

  async getUserRating(userId?: string): Promise<Rating> {
    const { data } = await this.api.get(`/ratings/${userId || ''}`);
    return this.normalizeResponse<Rating>(data, 'rating');
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
    const { data } = await this.api.post('/matchmaking/queue', { timeControl });
    return this.normalizeResponse<MatchmakingQueue>(data, 'queue');
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
    const { data } = await this.api.get('/search/users', {
      params: { q: query },
    });
    return this.normalizeArrayResponse<User>(data, 'users');
  }

  // Activity
  async getActivityFeed(): Promise<any[]> {
    const { data } = await this.api.get('/activity/feed');
    return this.normalizeArrayResponse<any>(data, 'activities');
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
