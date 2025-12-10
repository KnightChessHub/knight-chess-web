import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Trophy, Users, Calendar, Award, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Tournament } from '../types';
import { useAuthStore } from '../store/authStore';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id]);

  const loadTournament = async () => {
    try {
      const data = await apiService.getTournament(id!);
      setTournament(data);
    } catch (error) {
      toast.error('Failed to load tournament');
      navigate('/tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    setIsJoining(true);
    try {
      await apiService.joinTournament(id);
      toast.success('Successfully joined tournament!');
      loadTournament();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join tournament');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to leave this tournament?')) return;

    try {
      await apiService.leaveTournament(id);
      toast.success('Left tournament');
      loadTournament();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to leave tournament');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Tournament not found</p>
        <Button onClick={() => navigate('/tournaments')}>Back to Tournaments</Button>
      </div>
    );
  }

  const participants = tournament.participants || [];
  const isParticipant = participants.includes(user?._id || '');
  const canJoin =
    (tournament.status === 'upcoming' || tournament.status === 'registration') &&
    !isParticipant &&
    participants.length < (tournament.maxParticipants || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/tournaments')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-text-secondary mt-1">{tournament.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {canJoin && (
            <Button onClick={handleJoin} isLoading={isJoining}>
              <Play className="w-4 h-4 mr-2" />
              Join Tournament
            </Button>
          )}
          {isParticipant && tournament.status !== 'finished' && (
            <Button variant="danger" onClick={handleLeave}>
              Leave Tournament
            </Button>
          )}
        </div>
      </div>

      {/* Tournament Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Participants</p>
              <p className="text-2xl font-bold">
                {(tournament.participants || []).length} / {tournament.maxParticipants || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-secondary-light rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Start Date</p>
              <p className="text-lg font-bold">
                {new Date(tournament.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Format</p>
              <p className="text-lg font-bold capitalize">{tournament.format}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Prize Pool */}
      {tournament.prizePool && (
        <Card className="bg-bg-tertiary border-border">
          <div className="flex items-center space-x-4">
            <Award className="w-8 h-8 text-text-secondary" />
            <div>
              <p className="text-text-secondary text-sm">Prize Pool</p>
              <p className="text-3xl font-semibold text-text-primary">${tournament.prizePool}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm mb-1">Status</p>
            <span
                className={`text-lg font-semibold px-3 py-1 rounded ${
                  tournament.status === 'active'
                    ? 'bg-bg-tertiary text-text-primary'
                    : tournament.status === 'upcoming' || tournament.status === 'registration'
                    ? 'bg-warning-light text-warning'
                  : 'bg-text-tertiary/20 text-text-tertiary'
              }`}
            >
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
          {isParticipant && (
            <div className="text-right">
              <p className="text-text-secondary text-sm mb-1">Your Status</p>
              <span className="text-lg font-semibold px-3 py-1 rounded bg-bg-tertiary text-text-secondary border border-border">
                Participating
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Rounds */}
      {tournament.rounds && tournament.rounds.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Rounds</h2>
          <div className="space-y-3">
            {tournament.rounds.map((round, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  round.completed ? 'bg-bg-tertiary' : 'bg-bg-tertiary border border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Round {round.roundNumber}</p>
                    <p className="text-text-secondary text-sm">
                      {round.games.length} games •{' '}
                      {round.completed ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                  {round.completed && (
                    <span className="text-text-secondary text-sm font-semibold">✓ Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Participants List */}
      {(tournament.participants || []).length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((participantId, index) => (
              <div
                key={participantId}
                className="p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-bg-tertiary border border-border rounded-full flex items-center justify-center text-text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">Player {participantId.slice(0, 8)}</p>
                    {participantId === user?._id && (
                      <p className="text-text-secondary text-xs">You</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

