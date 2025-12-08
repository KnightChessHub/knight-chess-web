import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useNotificationStore } from '../store/notificationStore';
import Card from '../components/Card';
import Button from '../components/Button';
import { Bell, Check, CheckCheck, Trash2, Gamepad2, Users, Trophy, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Notification } from '../types';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, setNotifications, markAsRead, markAllAsRead, setUnreadCount } =
    useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      markAsRead(id);
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(notifications.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'game_invite':
        return <Gamepad2 className="w-5 h-5 text-primary" />;
      case 'friend_request':
        return <Users className="w-5 h-5 text-secondary" />;
      case 'tournament':
        return <Trophy className="w-5 h-5 text-accent" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5 text-text-secondary" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
            <Bell className="w-8 h-8 text-primary" />
            <span>Notifications</span>
          </h1>
          <p className="text-text-secondary">
            {unreadNotifications.length} unread • {notifications.length} total
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Unread</h2>
          <div className="space-y-3">
            {unreadNotifications.map((notification) => (
              <Card
                key={notification._id}
                hover
                onClick={() => handleNotificationClick(notification)}
                className="border-l-4 border-l-primary"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                      <p className="text-text-secondary">{notification.message}</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification._id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-secondary">Read</h2>
          <div className="space-y-3">
            {readNotifications.map((notification) => (
              <Card
                key={notification._id}
                hover
                onClick={() => handleNotificationClick(notification)}
                className="opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 text-text-secondary">
                        {notification.title}
                      </h3>
                      <p className="text-text-tertiary">{notification.message}</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary text-lg mb-2">No notifications</p>
            <p className="text-text-tertiary">You're all caught up!</p>
          </div>
        </Card>
      )}
    </div>
  );
}

