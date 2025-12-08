import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Trophy,
  MessageSquare,
  LogOut,
  Bell,
  Search,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect } from 'react';
import { apiService } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await apiService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, setUnreadCount]);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/games', icon: Trophy, label: 'Games' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top Navigation */}
      <nav className="bg-bg-secondary border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 min-h-[4rem]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl text-white font-bold leading-none">♘</span>
              </div>
              <span className="text-xl font-semibold text-text-primary tracking-tight leading-tight">KnightChess</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary text-white font-medium'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/search"
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </Link>

              <Link
                to="/notifications"
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-text-primary font-medium">{user?.username}</span>
              </Link>

              <Link
                to="/settings"
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                onClick={logout}
                className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-bg-secondary border-t border-border fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}

