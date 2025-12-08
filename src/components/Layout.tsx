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
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  ];

  const moreNavItems = [
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Update dropdown position
  useEffect(() => {
    if (moreMenuOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [moreMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        moreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(target)
      ) {
        setMoreMenuOpen(false);
      }
    };

    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreMenuOpen]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top Navigation */}
      <nav className="glass-nav sticky top-0 z-50" style={{ position: 'relative', zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8" style={{ position: 'relative' }}>
          <div className="flex items-center justify-between h-16 min-h-[4rem] gap-2" style={{ position: 'relative' }}>
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 flex-shrink-0 min-w-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl text-white font-bold leading-none">♘</span>
              </div>
              <span className="hidden xs:inline text-lg sm:text-xl font-semibold text-text-primary tracking-tight truncate">KnightChess</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl" style={{ overflow: 'visible', position: 'relative' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 font-medium whitespace-nowrap flex-shrink-0 ${
                      isActive(item.path)
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-text-secondary hover:glass-light hover:text-text-primary hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm xl:text-base">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* More Menu Dropdown */}
              <div className="relative flex-shrink-0 more-menu-container">
                <button
                  ref={moreButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMoreMenuOpen(!moreMenuOpen);
                  }}
                  className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 font-medium whitespace-nowrap ${
                    moreNavItems.some(item => isActive(item.path))
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-text-secondary hover:glass-light hover:text-text-primary hover:scale-105'
                  } ${moreMenuOpen ? 'bg-primary text-white' : ''}`}
                >
                  <span className="font-medium text-sm xl:text-base">More</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Right Side Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Link
                to="/search"
                className="p-2 text-text-secondary hover:text-text-primary hover:glass-light rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </Link>

              <Link
                to="/notifications"
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
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
                className="flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 glass-light hover:glass rounded-xl transition-all duration-300 hover:scale-105 flex-shrink-0"
              >
                <div className="w-8 h-8 xl:w-9 xl:h-9 bg-primary rounded-full flex items-center justify-center text-xs xl:text-sm font-bold text-white flex-shrink-0 shadow-lg shadow-primary/30">
                  {(user?.username || 'U')[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden xl:block text-text-primary font-semibold text-sm truncate max-w-[100px]">{user?.username}</span>
              </Link>

              <Link
                to="/settings"
                className="p-2 text-text-secondary hover:text-text-primary hover:glass-light rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                onClick={logout}
                className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button & Quick Actions */}
            <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
              {/* Quick Actions for Mobile */}
              <Link
                to="/search"
                className="p-2 text-text-secondary hover:text-text-primary hover:glass-light rounded-lg transition-colors flex items-center justify-center"
                title="Search"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
              </Link>

              <Link
                to="/notifications"
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors flex items-center justify-center"
                title="Notifications"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-text-secondary hover:text-text-primary hover:glass-light rounded-lg transition-colors flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border animate-slide-up max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="py-4 space-y-2">
                {/* Mobile Nav Items */}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium mx-2 ${
                        isActive(item.path)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'text-text-secondary hover:glass-light hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                {/* More Nav Items in Mobile */}
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium mx-2 ${
                        isActive(item.path)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'text-text-secondary hover:glass-light hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Mobile User Actions */}
                <div className="pt-4 mt-4 border-t border-border space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 glass-light hover:glass rounded-xl transition-all duration-300 mx-2"
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg shadow-primary/30">
                      {(user?.username || 'U')[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{user?.username || 'User'}</p>
                      <p className="text-text-secondary text-sm">View Profile</p>
                    </div>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:glass-light hover:text-text-primary rounded-xl transition-all duration-300 mx-2"
                  >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-all duration-300 mx-2"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden glass-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 px-0.5 ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More Button in Bottom Nav */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 px-0.5 ${
              moreNavItems.some(item => isActive(item.path))
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center">More</span>
          </button>
        </div>
      </nav>

      {/* Dropdown Portal */}
      {moreMenuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={moreMenuRef}
          className="fixed rounded-xl py-2 overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '14rem',
            backgroundColor: '#1f1f1f',
            border: '2px solid rgba(5, 150, 105, 0.4)',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            zIndex: 10000,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-bg-hover cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '2.75rem'
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>,
        document.body
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-20 lg:pb-6" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        {children}
      </main>
    </div>
  );
}

