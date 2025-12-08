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

  // Auth
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password,
    });
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  }

  async verifyToken(): Promise<User> {
    const { data } = await this.api.get<{ user: User }>('/auth/verify');
    return data.user;
  }

  // Users
  async getCurrentUser(): Promise<User> {
    const { data } = await this.api.get<{ user: User }>('/users/me');
    return data.user;
  }

  async getUser(userId: string): Promise<User> {
    const { data } = await this.api.get<{ user: User }>(`/users/${userId}`);
    return data.user;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    const { data } = await this.api.put<{ user: User }>('/users/me', updates);
    return data.user;
  }

  // Games
  async createGame(timeControl: { initial: number; increment: number }): Promise<Game> {
    const { data } = await this.api.post<{ game: Game }>('/games', { timeControl });
    return data.game;
  }

  async getGames(params?: { status?: string; limit?: number }): Promise<Game[]> {
    const { data } = await this.api.get<{ games: Game[] }>('/games', { params });
    return data.games;
  }

  async getGame(gameId: string): Promise<Game> {
    const { data } = await this.api.get<{ game: Game }>(`/games/${gameId}`);
    return data.game;
  }

  async makeMove(gameId: string, move: string): Promise<Game> {
    const { data } = await this.api.post<{ game: Game }>(`/games/${gameId}/move`, { move });
    return data.game;
  }

  async joinGame(gameId: string): Promise<Game> {
    const { data } = await this.api.post<{ game: Game }>(`/games/${gameId}/join`);
    return data.game;
  }

  async resignGame(gameId: string): Promise<Game> {
    const { data } = await this.api.post<{ game: Game }>(`/games/${gameId}/resign`);
    return data.game;
  }

  // Tournaments
  async createTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    const { data } = await this.api.post<{ tournament: Tournament }>('/tournaments', tournament);
    return data.tournament;
  }

  async getTournaments(params?: { status?: string }): Promise<Tournament[]> {
    const { data } = await this.api.get<{ tournaments: Tournament[] }>('/tournaments', { params });
    return data.tournaments;
  }

  async getTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.get<{ tournament: Tournament }>(`/tournaments/${tournamentId}`);
    return data.tournament;
  }

  async joinTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.post<{ tournament: Tournament }>(`/tournaments/${tournamentId}/join`);
    return data.tournament;
  }

  async leaveTournament(tournamentId: string): Promise<Tournament> {
    const { data } = await this.api.post<{ tournament: Tournament }>(`/tournaments/${tournamentId}/leave`);
    return data.tournament;
  }

  // Ratings
  async getLeaderboard(category?: string, limit?: number): Promise<Rating[]> {
    const { data } = await this.api.get<{ leaderboard: Rating[] }>('/ratings/leaderboard', {
      params: { category, limit },
    });
    return data.leaderboard;
  }

  async getUserRating(userId?: string): Promise<Rating> {
    const { data } = await this.api.get<{ rating: Rating }>(`/ratings/${userId || ''}`);
    return data.rating;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const { data } = await this.api.get<{ notifications: Notification[] }>('/notifications');
    return data.notifications;
  }

  async getUnreadCount(): Promise<number> {
    const { data } = await this.api.get<{ count: number }>('/notifications/unread/count');
    return data.count;
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
    const { data } = await this.api.post<{ message: ChatMessage }>('/chat', {
      receiverId,
      message,
    });
    return data.message;
  }

  async getConversations(): Promise<ChatMessage[]> {
    const { data } = await this.api.get<{ conversations: ChatMessage[] }>('/chat/conversations');
    return data.conversations;
  }

  async getConversation(userId: string, limit?: number): Promise<ChatMessage[]> {
    const { data } = await this.api.get<{ messages: ChatMessage[] }>(`/chat/conversations/${userId}`, {
      params: { limit },
    });
    return data.messages;
  }

  // Friends
  async sendFriendRequest(userId: string): Promise<FriendRequest> {
    const { data } = await this.api.post<{ request: FriendRequest }>('/friends/request', { userId });
    return data.request;
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    const { data } = await this.api.get<{ requests: FriendRequest[] }>('/friends/requests');
    return data.requests;
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await this.api.put(`/friends/requests/${requestId}/accept`);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await this.api.delete(`/friends/requests/${requestId}`);
  }

  async getFriends(): Promise<User[]> {
    const { data } = await this.api.get<{ friends: User[] }>('/friends/list');
    return data.friends;
  }

  // Matchmaking
  async joinMatchmakingQueue(timeControl: { initial: number; increment: number }): Promise<MatchmakingQueue> {
    const { data } = await this.api.post<{ queue: MatchmakingQueue }>('/matchmaking/queue', { timeControl });
    return data.queue;
  }

  async leaveMatchmakingQueue(): Promise<void> {
    await this.api.delete('/matchmaking/queue');
  }

  async getMatchmakingStatus(): Promise<MatchmakingQueue | null> {
    const { data } = await this.api.get<{ queue: MatchmakingQueue | null }>('/matchmaking/queue/status');
    return data.queue;
  }

  // Statistics
  async getStatistics(userId?: string): Promise<Statistics> {
    const { data } = await this.api.get<{ statistics: Statistics }>(`/statistics/${userId || ''}`);
    return data.statistics;
  }

  // Groups
  async createGroup(group: Partial<Group>): Promise<Group> {
    const { data } = await this.api.post<{ group: Group }>('/groups', group);
    return data.group;
  }

  async getGroups(): Promise<Group[]> {
    const { data } = await this.api.get<{ groups: Group[] }>('/groups');
    return data.groups;
  }

  async getGroup(groupId: string): Promise<Group> {
    const { data } = await this.api.get<{ group: Group }>(`/groups/${groupId}`);
    return data.group;
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    await this.api.post(`/groups/${groupId}/members`, { userId });
  }

  // Search
  async search(query: string, type?: string): Promise<any> {
    const { data } = await this.api.get('/search', {
      params: { q: query, type },
    });
    return data;
  }

  async searchUsers(query: string): Promise<User[]> {
    const { data } = await this.api.get<{ users: User[] }>('/search/users', {
      params: { q: query },
    });
    return data.users;
  }

  // Activity
  async getActivityFeed(): Promise<any[]> {
    const { data } = await this.api.get<{ activities: any[] }>('/activity/feed');
    return data.activities;
  }

  async getMyActivity(): Promise<any[]> {
    const { data } = await this.api.get<{ activities: any[] }>('/activity/my');
    return data.activities;
  }
}

export const apiService = new ApiService();
