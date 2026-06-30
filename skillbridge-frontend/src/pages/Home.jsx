import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Coins,
  Compass,
  FileText,
  FolderKanban,
  IndianRupee,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import { GigCardSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Home = () => {
  const { profile, refreshProfile } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [stats, setStats] = useState({
    gigs_posted_completed: 0,
    gigs_completed_as_freelancer: 0,
    total_credits_earned: 0,
    total_money_earned: 0
  });
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchRecommendations();
    fetchUserStats();
    fetchUnreadMessages();
    refreshProfile?.();
  }, []);

  useEffect(() => {
    const refreshStats = () => {
      fetchUserStats();
      fetchUnreadMessages();
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
      const matchedRecommendations = Array.isArray(response.data?.recommendations)
        ? response.data.recommendations.filter((gig) => Number(gig.match_score) > 0)
        : [];

      setRecommendations(matchedRecommendations);
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

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar showCredits />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Welcome Section */}
        <div className="mb-10 overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 px-6 py-8 text-white sm:px-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`,
                backgroundSize: '64px 64px',
              }}
            />
            <div className="relative">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                Marketplace Home
              </p>
              <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Welcome back, <span className="text-emerald-100">{profile?.full_name}</span>
              </h2>
              <p className="mt-3 text-sm font-medium text-emerald-50/75 sm:text-base">{profile?.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-gray-950">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Bot size={20} aria-hidden="true" />
                </span>
                Recommended For You
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Personalized gig suggestions based on the skills in your profile.
              </p>
            </div>
            <Link
              to="/profile"
              className="hidden items-center gap-2 px-1 py-2 text-sm font-semibold text-emerald-700 transition-all hover:translate-x-1 hover:text-emerald-900 sm:inline-flex"
            >
              Update skills
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <GigCardSkeleton key={item} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-8 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <Bot size={26} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">No recommendations yet</h4>
              <p className="mb-5 text-gray-600">
                Complete your profile with skills to see recommendations
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Update Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {recommendations.map((gig) => (
                <div
                  key={gig.id}
                  className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <span className="inline-flex items-center rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      {Math.round((gig.match_score || 0) * 100)}% Match
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Bot size={13} aria-hidden="true" />
                      AI
                    </span>
                  </div>

                  <h4 className="mb-3 text-lg font-semibold leading-snug text-gray-950">{gig.title}</h4>
                  <p className="mb-6 text-sm leading-6 text-gray-600">
                    {truncateText(gig.description)}
                  </p>

                  <Link
                    to={`/gigs/${gig.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    View
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credits Card */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 p-8 text-white shadow-[0_20px_56px_rgba(6,78,59,0.16)]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '64px 64px'
            }}></div>
          </div>
          <div className="relative z-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100/75">Your Balance</p>
            <p className="mb-5 text-5xl font-semibold tracking-tight">{profile?.credits} <span className="text-2xl font-medium text-emerald-100/80">Credits</span></p>
            <Link
              to="/wallet"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-emerald-950 shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Manage Wallet
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="mb-6 text-2xl font-semibold tracking-tight text-gray-950">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/gigs"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <Search size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">Browse Gigs</h4>
              <p className="text-sm leading-6 text-gray-600">Discover opportunities and earn credits</p>
            </Link>

            <Link
              to="/gigs/post"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <Plus size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">Post a Gig</h4>
              <p className="text-sm leading-6 text-gray-600">Share a project and find collaborators</p>
            </Link>

            <Link
              to="/applications"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <ClipboardList size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">My Applications</h4>
              <p className="text-sm leading-6 text-gray-600">Track your submitted proposals</p>
            </Link>

            <Link
              to="/messages"
              className="group relative rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              {unreadMessages > 0 && (
                <span className="absolute right-5 top-5 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-semibold text-white shadow-sm">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <MessageCircle size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">Messages</h4>
              <p className="text-sm leading-6 text-gray-600">Chat about your active gigs</p>
            </Link>

            <Link
              to="/my-gigs"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <FolderKanban size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">My Gigs</h4>
              <p className="text-sm leading-6 text-gray-600">Manage your posted opportunities</p>
            </Link>

            <Link
              to="/profile"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <UserRound size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">My Profile</h4>
              <p className="text-sm leading-6 text-gray-600">Update your information and skills</p>
            </Link>

            <Link
              to="/wallet"
              className="group rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200">
                <Wallet size={23} aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-950">My Wallet</h4>
              <p className="text-sm leading-6 text-gray-600">View transactions and credit history</p>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="mb-6 text-2xl font-semibold tracking-tight text-gray-950">Your Activity</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <FileText size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="mb-1 text-3xl font-semibold tracking-tight text-gray-950">{stats.gigs_posted_completed || 0}</p>
              <p className="text-sm text-gray-600">Gigs Posted</p>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="mb-1 text-3xl font-semibold tracking-tight text-gray-950">{stats.gigs_completed_as_freelancer || 0}</p>
              <p className="text-sm text-gray-600">Gigs Completed</p>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Coins size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="mb-1 text-3xl font-semibold tracking-tight text-gray-950">{stats.total_credits_earned || 0}</p>
              <p className="text-sm text-gray-600">Credits Earned</p>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <IndianRupee size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="mb-1 text-3xl font-semibold tracking-tight text-gray-950">₹{stats.total_money_earned || 0}</p>
              <p className="text-sm text-gray-600">Money Earned</p>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-12 rounded-xl border border-emerald-900/10 bg-white p-8 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          <h3 className="mb-4 flex items-center gap-3 text-2xl font-semibold tracking-tight text-gray-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Compass size={20} aria-hidden="true" />
            </span>
            Getting Started
          </h3>
          <p className="mb-6 text-gray-600">
            New to Skill Bridge? Here's how to make the most of your campus economy experience:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-700 text-xs font-semibold text-white">1</div>
              <p className="text-sm leading-6 text-gray-700">Complete your profile and showcase your skills</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-700 text-xs font-semibold text-white">2</div>
              <p className="text-sm leading-6 text-gray-700">Browse available gigs or post your own project</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-700 text-xs font-semibold text-white">3</div>
              <p className="text-sm leading-6 text-gray-700">Connect with peers and start building your legacy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
