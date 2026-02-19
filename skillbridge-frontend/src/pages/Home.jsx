import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { profile, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header/Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-light tracking-wide">Skill bridge</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{profile?.credits}</span> Credits
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-light mb-2">
            Welcome back, <span className="text-emerald-700">{profile?.full_name}</span>
          </h2>
          <p className="text-gray-600">{profile?.email}</p>
        </div>

        {/* Credits Card */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm mb-2 uppercase tracking-wide">Your Balance</p>
            <p className="text-5xl font-light mb-4">{profile?.credits} <span className="text-2xl">Credits</span></p>
            <Link
              to="/wallet"
              className="inline-block bg-white text-emerald-900 px-6 py-2 rounded-full text-sm hover:bg-gray-100 transition-all hover:scale-105"
            >
              Manage Wallet →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-light mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/gigs"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">🔍</span>
              </div>
              <h4 className="text-lg font-medium mb-2">Browse Gigs</h4>
              <p className="text-sm text-gray-600">Discover opportunities and earn credits</p>
            </Link>

            <Link
              to="/gigs/post"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">✨</span>
              </div>
              <h4 className="text-lg font-medium mb-2">Post a Gig</h4>
              <p className="text-sm text-gray-600">Share a project and find collaborators</p>
            </Link>

            <Link
              to="/applications"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="text-lg font-medium mb-2">My Applications</h4>
              <p className="text-sm text-gray-600">Track your submitted proposals</p>
            </Link>

            <Link
              to="/my-gigs"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">📁</span>
              </div>
              <h4 className="text-lg font-medium mb-2">My Gigs</h4>
              <p className="text-sm text-gray-600">Manage your posted opportunities</p>
            </Link>

            <Link
              to="/profile"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="text-lg font-medium mb-2">My Profile</h4>
              <p className="text-sm text-gray-600">Update your information and skills</p>
            </Link>

            <Link
              to="/wallet"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="text-lg font-medium mb-2">My Wallet</h4>
              <p className="text-sm text-gray-600">View transactions and credit history</p>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-2xl font-light mb-6">Your Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">0</p>
              <p className="text-sm text-gray-600">Gigs Posted</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">0</p>
              <p className="text-sm text-gray-600">Gigs Completed</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">0</p>
              <p className="text-sm text-gray-600">Active Applications</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">0.0</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl p-8 border border-gray-200">
          <h3 className="text-2xl font-light mb-4">Getting Started</h3>
          <p className="text-gray-600 mb-6">
            New to Skill Bridge? Here's how to make the most of your campus economy experience:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">1</div>
              <p className="text-sm text-gray-700">Complete your profile and showcase your skills</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">2</div>
              <p className="text-sm text-gray-700">Browse available gigs or post your own project</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">3</div>
              <p className="text-sm text-gray-700">Connect with peers and start building your legacy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;