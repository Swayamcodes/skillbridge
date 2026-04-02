import { Link } from 'react-router-dom';

const Navbar = ({ links = [], credits, showCredits = false, onLogout, actionLabel, actionTo }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-light tracking-wide">
          Skill bridge
        </Link>

        <div className="flex items-center gap-4">
          {showCredits && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{credits || 0}</span> Credits
            </div>
          )}

          <Link
            to="/profile"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Profile
          </Link>

          {links.map((link) => (
            <Link
              key={`${link.to}-${link.label}`}
              to={link.to}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {actionTo && actionLabel && (
            <Link
              to={actionTo}
              className="bg-emerald-700 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-800 transition-all hover:scale-105"
            >
              {actionLabel}
            </Link>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
