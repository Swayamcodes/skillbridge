import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { GigCardSkeleton } from '../components/Skeletons';
import api from '../services/api';

const Home = () => {
  const { profile, logout, refreshProfile } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [stats, setStats] = useState({
    gigs_posted_completed: 0,
    gigs_completed_as_freelancer: 0,
    total_credits_earned: 0,
    total_money_earned: 0
  });

  useEffect(() => {
    fetchRecommendations();
    fetchUserStats();
    refreshProfile?.();
  }, []);

  useEffect(() => {
    const refreshStats = () => {
      fetchUserStats();
      refreshProfile?.();
    };

    window.addEventListener('focus', refreshStats);
    window.addEventListener('skillbridge:stats-updated', refreshStats);

    return () => {
      window.removeEventListener('focus', refreshStats);
      window.removeEventListener('skillbridge:stats-updated', refreshStats);
    };
  }, [refreshProfile]);

  const fetchRecommendations = async () => {
    setLoadingRecs(true);

    try {
      const response = await api.get('/api/ml/recommended');
      setRecommendations(Array.isArray(response.data?.recommendations) ? response.data.recommendations : []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const truncateText = (text, maxLength = 140) => {
    if (!text) return 'No description available.';
    return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/api/stats/user');
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

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

        <div className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-light flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                  AI
                </span>
                Recommended For You
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Personalized gig suggestions based on the skills in your profile.
              </p>
            </div>
            <Link
              to="/profile"
              className="hidden sm:inline-block text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Update skills →
            </Link>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <GigCardSkeleton key={item} className="bg-white" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg mb-4">
                AI
              </div>
              <h4 className="text-lg font-medium mb-2">No recommendations yet</h4>
              <p className="text-gray-600 mb-5">
                Complete your profile with skills to see recommendations
              </p>
              <Link
                to="/profile"
                className="inline-block bg-emerald-700 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-800 transition-colors"
              >
                Update Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {recommendations.map((gig) => (
                <div
                  key={gig.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                      {Math.round((gig.match_score || 0) * 100)}% Match
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">AI</span>
                  </div>

                  <h4 className="text-lg font-medium mb-3 text-gray-900">{gig.title}</h4>
                  <p className="text-sm text-gray-600 leading-6 mb-6">
                    {truncateText(gig.description)}
                  </p>

                  <Link
                    to={`/gigs/${gig.id}`}
                    className="inline-block bg-gray-900 text-white px-5 py-2 rounded-full text-sm hover:bg-emerald-700 transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
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
              <p className="text-3xl font-light mb-1">{stats.gigs_posted_completed || 0}</p>
              <p className="text-sm text-gray-600">Gigs Posted</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">{stats.gigs_completed_as_freelancer || 0}</p>
              <p className="text-sm text-gray-600">Gigs Completed</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">{stats.total_credits_earned || 0}</p>
              <p className="text-sm text-gray-600">Credits Earned</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
              <p className="text-3xl font-light mb-1">₹{stats.total_money_earned || 0}</p>
              <p className="text-sm text-gray-600">Money Earned</p>
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
