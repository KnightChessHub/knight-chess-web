import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search as SearchIcon, User, Trophy, Gamepad2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User as UserType, Game, Tournament } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'users' | 'games' | 'tournaments'>('all');
  const [users, setUsers] = useState<UserType[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
      setGames([]);
      setTournaments([]);
      setHasSearched(false);
    }
  }, [query, searchType]);

  const performSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (searchType === 'all' || searchType === 'users') {
        try {
          const usersData = await apiService.searchUsers(query);
          setUsers(usersData);
        } catch (error) {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }

      if (searchType === 'all' || searchType === 'games') {
        try {
          const gamesData = await apiService.getGames();
          const filtered = gamesData.filter(
            (g) =>
              g.whitePlayerUsername?.toLowerCase().includes(query.toLowerCase()) ||
              g.blackPlayerUsername?.toLowerCase().includes(query.toLowerCase())
          );
          setGames(filtered);
        } catch (error) {
          setGames([]);
        }
      } else {
        setGames([]);
      }

      if (searchType === 'all' || searchType === 'tournaments') {
        try {
          const tournamentsData = await apiService.getTournaments();
          const filtered = tournamentsData.filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
          );
          setTournaments(filtered);
        } catch (error) {
          setTournaments([]);
        }
      } else {
        setTournaments([]);
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await apiService.sendFriendRequest(userId);
      toast.success('Friend request sent');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send friend request');
    }
  };

  const totalResults = users.length + games.length + tournaments.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <SearchIcon className="w-8 h-8 text-primary" />
          <span>Search</span>
        </h1>
        <p className="text-text-secondary">Find users, games, and tournaments</p>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="space-y-4">
          <Input
            placeholder="Search for users, games, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {/* Search Type Filter */}
          <div className="flex space-x-2">
            {(['all', 'users', 'games', 'tournaments'] as const).map((type) => (
              <Button
                key={type}
                variant={searchType === type ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSearchType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && query.trim().length >= 2 && (
        <>
          {totalResults === 0 ? (
            <Card>
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary text-lg mb-2">No results found</p>
                <p className="text-text-tertiary">Try a different search term</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Users Results */}
              {(searchType === 'all' || searchType === 'users') && users.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span>Users ({users.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u) => (
                      <Card key={u._id} hover>
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                            {(u.username || 'U')[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{u.username || 'Unknown'}</p>
                            <p className="text-text-secondary text-sm">Rating: {u.rating || 1200}</p>
                          </div>
                          {u._id !== user?._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendFriendRequest(u._id)}
                            >
                              <User className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Games Results */}
              {(searchType === 'all' || searchType === 'games') && games.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <span>Games ({games.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map((game) => (
                      <Card
                        key={game._id}
                        hover
                        onClick={() => navigate(`/games/${game._id}`)}
                      >
                        <div className="space-y-2">
                          <p className="font-semibold">
                            {game.whitePlayerUsername || 'White'} vs {game.blackPlayerUsername || 'Black'}
                          </p>
                          <p className="text-text-secondary text-sm capitalize">{game.status || 'unknown'}</p>
                          <p className="text-text-tertiary text-xs">
                            {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Tournaments Results */}
              {(searchType === 'all' || searchType === 'tournaments') && tournaments.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span>Tournaments ({tournaments.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.map((tournament) => (
                      <Card
                        key={tournament._id}
                        hover
                        onClick={() => navigate(`/tournaments/${tournament._id}`)}
                      >
                        <div className="space-y-2">
                          <p className="font-semibold">{tournament.name}</p>
                          <p className="text-text-secondary text-sm capitalize">{tournament.status}</p>
                          <p className="text-text-tertiary text-xs">
                            {(tournament.participants || []).length} / {tournament.maxParticipants || 0} participants
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State - No Search */}
      {!hasSearched && (
        <Card>
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary text-lg mb-2">Start searching</p>
            <p className="text-text-tertiary">Enter at least 2 characters to search</p>
          </div>
        </Card>
      )}
    </div>
  );
}

