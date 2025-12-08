import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Users, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User, FriendRequest } from '../types';

export default function Friends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiService.getFriends().catch(() => []),
        apiService.getFriendRequests().catch(() => []),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      toast.error('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      toast.success('Friend request accepted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiService.rejectFriendRequest(requestId);
      toast.success('Friend request rejected');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
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
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
          <Users className="w-6 h-6 text-primary flex-shrink-0" />
          <span>Friends</span>
        </h1>
        <p className="text-text-secondary">Manage your friends and connections</p>
      </div>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {request.fromUsername?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{request.fromUsername || 'User'}</p>
                    <p className="text-text-secondary text-sm">Wants to be your friend</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAccept(request._id)}
                    className="min-w-[2.5rem]"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(request._id)}
                    className="min-w-[2.5rem]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Your Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No friends yet</p>
            <p className="text-text-tertiary text-sm">Send friend requests to connect with players</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {friend.username[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{friend.username}</p>
                    <p className="text-text-secondary text-sm">
                      Rating: {friend.rating || 1200}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

