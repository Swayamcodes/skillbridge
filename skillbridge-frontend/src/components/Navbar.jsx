import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import NotificationBell from './NotificationBell';
import api from '../services/api';

const Navbar = ({ showCredits = false, action }) => {
  const { profile, logout } = useContext(AuthContext);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await api.get('/api/chat/conversations');
        const totalUnread = (response.data.conversations || [])
          .reduce((total, conversation) => total + (conversation.unread_count || 0), 0);
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
    window.addEventListener('focus', fetchUnreadMessages);
    window.addEventListener('skillbridge:messages-read', fetchUnreadMessages);

    return () => {
      window.removeEventListener('focus', fetchUnreadMessages);
      window.removeEventListener('skillbridge:messages-read', fetchUnreadMessages);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
        <Link to="/dashboard" className="text-xl font-light tracking-wide shrink-0">
          Skill bridge
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <Link
            to="/dashboard"
            className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/gigs"
            className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Browse Gigs
          </Link>
          <Link
            to="/messages"
            className="relative hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Messages
            {unreadMessages > 0 && (
              <span className="absolute -right-4 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-medium text-white">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>
          {action}
          {showCredits && (
            <div className="hidden md:block text-sm text-gray-600">
              <span className="font-medium">{profile?.credits || 0}</span> Credits
            </div>
          )}
          <NotificationBell />
          <button
            type="button"
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
