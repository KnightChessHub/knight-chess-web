import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Users, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Group } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const newGroup = await apiService.createGroup({
        name: groupName,
        description: groupDescription,
      });
      toast.success('Group created successfully!');
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      loadGroups();
      navigate(`/groups/${newGroup._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Groups</span>
          </h1>
          <p className="text-text-secondary">Create and manage chess groups</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full glass-strong">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                label="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
                autoFocus
              />
              <Input
                label="Description (Optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
              />
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setGroupName('');
                    setGroupDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No groups yet</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Group</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const isOwner = group.owner === user?._id;
            const isMember = group.members.includes(user?._id || '');

            return (
              <Card
                key={group._id}
                hover
                onClick={() => navigate(`/groups/${group._id}`)}
                className="cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                      {group.description && (
                        <p className="text-text-secondary text-sm line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded">
                        Owner
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-text-secondary flex-shrink-0" />
                         <span className="text-text-secondary">
                           {(group.members || []).length} member{(group.members || []).length !== 1 ? 's' : ''}
                         </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/groups/${group._id}`);
                      }}
                    >
                      {isMember ? 'View' : 'Join'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

