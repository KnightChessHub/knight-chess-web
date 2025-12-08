import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance'>(
    'profile'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [gameInvites, setGameInvites] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await apiService.updateUser({ username, email });
      updateUser({ username, email });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <span>Settings</span>
        </h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
              <div className="space-y-4">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <Button onClick={handleSaveProfile} isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-xl font-bold mb-6">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-text-secondary text-sm">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold">Push Notifications</p>
                    <p className="text-text-secondary text-sm">Receive browser push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold">Game Invites</p>
                    <p className="text-text-secondary text-sm">Get notified about game invitations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameInvites}
                      onChange={(e) => setGameInvites(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold">Friend Requests</p>
                    <p className="text-text-secondary text-sm">Get notified about friend requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={friendRequests}
                      onChange={(e) => setFriendRequests(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <Card>
              <h2 className="text-xl font-bold mb-6">Privacy Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="font-semibold mb-2">Profile Visibility</p>
                  <p className="text-text-secondary text-sm mb-4">
                    Control who can see your profile and statistics
                  </p>
                  <select className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Public</option>
                    <option>Friends Only</option>
                    <option>Private</option>
                  </select>
                </div>

                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="font-semibold mb-2">Game History</p>
                  <p className="text-text-secondary text-sm mb-4">
                    Control who can view your game history
                  </p>
                  <select className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Public</option>
                    <option>Friends Only</option>
                    <option>Private</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <h2 className="text-xl font-bold mb-6">Appearance</h2>
              <div className="space-y-4">
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="font-semibold mb-2">Theme</p>
                  <p className="text-text-secondary text-sm mb-4">
                    Choose your preferred theme (Dark theme is currently active)
                  </p>
                  <div className="flex space-x-3">
                    <div className="flex-1 p-4 bg-bg-primary border-2 border-primary rounded-lg cursor-pointer">
                      <p className="font-semibold mb-1">Dark</p>
                      <p className="text-text-secondary text-xs">Active</p>
                    </div>
                    <div className="flex-1 p-4 bg-bg-primary border border-border rounded-lg opacity-50 cursor-not-allowed">
                      <p className="font-semibold mb-1">Light</p>
                      <p className="text-text-secondary text-xs">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-danger/30">
        <h2 className="text-xl font-bold mb-4 text-danger">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-danger/10 rounded-lg">
            <div>
              <p className="font-semibold">Logout</p>
              <p className="text-text-secondary text-sm">Sign out of your account</p>
            </div>
            <Button variant="danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

