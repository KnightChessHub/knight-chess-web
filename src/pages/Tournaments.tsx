import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trophy, Users, Calendar, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Tournament } from '../types';

export default function Tournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'finished'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, [filter]);

  const loadTournaments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await apiService.getTournaments(params);
      setTournaments(data);
    } catch (error) {
      toast.error('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (tournamentId: string) => {
    try {
      await apiService.joinTournament(tournamentId);
      toast.success('Joined tournament!');
      loadTournaments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join tournament');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary flex-shrink-0" />
            <span>Tournaments</span>
          </h1>
          <p className="text-text-secondary text-lg">Compete in chess tournaments</p>
        </div>
        <Button onClick={() => navigate('/tournaments/new')} size="lg">
          <Plus className="w-5 h-5" />
          Create Tournament
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {(['all', 'upcoming', 'active', 'finished'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className="transition-all duration-300"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tournaments */}
      {tournaments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No tournaments found</p>
            <Button onClick={() => navigate('/tournaments/new')}>Create Tournament</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament, index) => (
            <Card key={tournament._id} hover onClick={() => navigate(`/tournaments/${tournament._id}`)} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold mb-2">{tournament.name || 'Unnamed Tournament'}</h3>
                  {tournament.description && (
                    <p className="text-text-secondary text-sm line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <span className="text-text-secondary">
                      {(tournament.participants || []).length} / {tournament.maxParticipants || 0} players
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <span className="text-text-secondary">
                      {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>

                  {tournament.prizePool && (
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <span className="text-text-secondary font-semibold">${tournament.prizePool} Prize Pool</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      tournament.status === 'active'
                        ? 'bg-bg-tertiary text-text-primary'
                        : tournament.status === 'upcoming'
                        ? 'bg-bg-tertiary text-text-secondary'
                        : 'bg-text-tertiary/20 text-text-tertiary'
                    }`}
                  >
                    {tournament.status.toUpperCase()}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tournament.status === 'upcoming' || tournament.status === 'registration') {
                        handleJoin(tournament._id);
                      } else {
                        navigate(`/tournaments/${tournament._id}`);
                      }
                    }}
                  >
                    {tournament.status === 'upcoming' || tournament.status === 'registration'
                      ? 'Join'
                      : 'View'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

