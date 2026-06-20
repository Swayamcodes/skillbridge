import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const formatTimeAgo = (date) => {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return '';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (elapsedSeconds < 60) return 'Just now';

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications({ showLoading: true });

    const pollingInterval = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => window.clearInterval(pollingInterval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await api.put(`/api/notifications/${notification.id}/read`);

      if (!notification.is_read) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
        setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentState) => !currentState)}
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-emerald-700 text-white text-xs font-medium flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-hidden bg-white rounded-xl border border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[344px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-600">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-600">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                    notification.is_read ? 'bg-white' : 'bg-emerald-50'
                  }`}
                >
                  <span className="block font-medium text-sm text-gray-900">
                    {notification.title}
                  </span>
                  <span className="block mt-1 text-sm text-gray-600 leading-5">
                    {notification.message}
                  </span>
                  <span className="block mt-2 text-xs text-gray-400">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
