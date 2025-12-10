import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import { Activity as ActivityIcon, Trophy, Users, Gamepad2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ActivityItem {
  _id: string;
  type: 'game' | 'tournament' | 'friend' | 'message' | 'achievement';
  title: string;
  description: string;
  userId?: string;
  username?: string;
  link?: string;
  createdAt: string;
}

export default function Activity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await apiService.getActivityFeed();
      setActivities(data);
    } catch (error) {
      // Fallback to simulated data if API fails
      try {
        const [games, tournaments] = await Promise.all([
          apiService.getGames({ limit: 10 }).catch(() => []),
          apiService.getTournaments({ status: 'active' }).catch(() => []),
        ]);

        const activityItems: ActivityItem[] = [
          ...(games || []).slice(0, 5).map((game) => ({
            _id: game?._id || '',
            type: 'game' as const,
            title: 'Game Completed',
            description: `${game?.whitePlayerUsername || 'White'} vs ${game?.blackPlayerUsername || 'Black'}`,
            link: `/games/${game?._id || ''}`,
            createdAt: game?.updatedAt || game?.createdAt || new Date().toISOString(),
          })),
          ...(tournaments || []).slice(0, 3).map((tournament) => ({
            _id: tournament?._id || '',
            type: 'tournament' as const,
            title: 'Tournament Started',
            description: tournament?.name || 'Tournament',
            link: `/tournaments/${tournament?._id || ''}`,
            createdAt: tournament?.startDate || tournament?.createdAt || new Date().toISOString(),
          })),
        ].filter(item => item._id).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setActivities(activityItems);
      } catch (fallbackError) {
        toast.error('Failed to load activity');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-primary" />;
      case 'tournament':
        return <Trophy className="w-5 h-5 text-accent" />;
      case 'friend':
        return <Users className="w-5 h-5 text-secondary" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-success" />;
      default:
        return <ActivityIcon className="w-5 h-5 text-text-secondary" />;
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <ActivityIcon className="w-8 h-8 text-primary" />
          <span>Activity Feed</span>
        </h1>
        <p className="text-text-secondary">Recent activity from your network</p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ActivityIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No recent activity</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card
              key={activity._id}
              hover
              onClick={() => activity.link && navigate(activity.link)}
              className="cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{activity.title}</h3>
                  <p className="text-text-secondary">{activity.description}</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
