import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Users, UserPlus, Settings, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Group } from '../types';
import { useAuthStore } from '../store/authStore';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    if (!id) return;
    try {
      const data = await apiService.getGroup(id);
      setGroup(data);
    } catch (error) {
      toast.error('Failed to load group');
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!id) return;
    try {
      await apiService.addGroupMember(id, user?._id || '');
      toast.success('Joined group!');
      loadGroup();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join group');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Group not found</p>
        <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
      </div>
    );
  }

  const isOwner = group.owner === user?._id;
  const isMember = group.members.includes(user?._id || '');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/groups')} size="md">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">{group.name}</h1>
            {group.description && (
              <p className="text-text-secondary mt-1">{group.description}</p>
            )}
          </div>
        </div>
        {!isMember && (
          <Button onClick={handleJoinGroup} size="md">
            <UserPlus className="w-4 h-4" />
            Join Group
          </Button>
        )}
      </div>

      {/* Group Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Members</p>
              <p className="text-2xl font-semibold">{group.members.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Status</p>
              <p className="text-lg font-semibold">
                {isOwner ? 'Owner' : isMember ? 'Member' : 'Not a member'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Created</p>
              <p className="text-lg font-semibold">
                {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          {isOwner && (
            <Button variant="ghost" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
        {group.members.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No members yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.members.map((memberId, index) => {
              const isMemberOwner = memberId === group.owner;
              return (
                <div
                  key={memberId}
                  className="p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {memberId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Member {index + 1}</p>
                      {isMemberOwner && (
                        <p className="text-primary text-xs">Owner</p>
                      )}
                    </div>
                    {isOwner && !isMemberOwner && (
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

