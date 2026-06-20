import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import NotificationBell from './NotificationBell';

const Navbar = ({ showCredits = false, action }) => {
  const { profile, logout } = useContext(AuthContext);

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
