import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  FolderKanban,
  IndianRupee,
  MessageCircle,
  PenLine,
  Plus,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import { GigCardSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const MyGigs = () => {
  const { refreshProfile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('posted');
  const [postedGigs, setPostedGigs] = useState([]);
  const [assignedGigs, setAssignedGigs] = useState([]);
  const [unreadCountsByGig, setUnreadCountsByGig] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingGigId, setDeletingGigId] = useState(null);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const [postedRes, assignedRes] = await Promise.all([
        api.get('/api/gigs/my-posted'),
        api.get('/api/gigs/my-assigned')
      ]);
      setPostedGigs(postedRes.data.gigs);
      setAssignedGigs(assignedRes.data.gigs);

      try {
        const conversationsRes = await api.get('/api/chat/conversations');
        setUnreadCountsByGig(
          (conversationsRes.data.conversations || []).reduce((counts, conversation) => ({
            ...counts,
            [conversation.gig_id]: conversation.unread_count || 0
          }), {})
        );
      } catch (chatError) {
        console.error('Error fetching chat unread counts:', chatError);
      }
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (gigId) => {
    if (!window.confirm('Are you sure the work is complete?')) return;

    try {
      await api.put(`/api/gigs/${gigId}/complete`);
      await fetchGigs();
      refreshProfile?.();
      window.dispatchEvent(new Event('skillbridge:stats-updated'));
      alert('Payment released!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete gig');
    }
  };

  const handleDelete = async (gigId) => {
    if (!window.confirm('Are you sure you want to delete this gig? This cannot be undone.')) return;

    setDeletingGigId(gigId);

    try {
      await api.delete(`/api/gigs/${gigId}`);
      await fetchGigs();
      alert('Gig deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete gig');
    } finally {
      setDeletingGigId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-700/20', icon: CheckCircle2 },
      assigned: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300/70', icon: Users },
      completed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300/70', icon: CheckCircle2 },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: XCircle }
    };
    return badges[status] || badges.open;
  };

  const GigCard = ({ gig, isPosted }) => {
    const statusBadge = getStatusBadge(gig.status);
    const StatusIcon = statusBadge.icon;
    const unreadCount = unreadCountsByGig[gig.id] || 0;
    
    return (
      <div className="flex h-full flex-col rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_45px_rgba(16,24,40,0.09)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link 
              to={`/gigs/${gig.id}`} 
              className="mb-2 block line-clamp-2 text-xl font-semibold leading-snug text-gray-950 transition-colors hover:text-emerald-800"
            >
              {gig.title}
            </Link>
            <p className="line-clamp-2 text-sm leading-6 text-gray-600">{gig.description}</p>
          </div>
          <div className="flex-shrink-0">
            {gig.type === 'paid' ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] whitespace-nowrap">
                <IndianRupee size={14} aria-hidden="true" />
                {gig.price}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 whitespace-nowrap">
                <Coins size={14} aria-hidden="true" />
                {gig.credits} Credits
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
            <StatusIcon size={13} aria-hidden="true" />
            {gig.status}
          </span>
        </div>

        {isPosted && gig.assigned_to && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <div className="rounded-lg bg-emerald-50 p-0.5 ring-1 ring-emerald-700/10">
              <Avatar profile={gig.assigned} size="sm" className="h-8 w-8 text-sm" />
            </div>
            <span>
              Assigned to:{' '}
              <Link
                to={`/profile/${gig.assigned?.id}`}
                className="font-semibold text-gray-900 transition-colors hover:text-emerald-800 hover:underline"
              >
                {gig.assigned?.full_name}
              </Link>
            </span>
          </div>
        )}

        {!isPosted && gig.creator && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <div className="rounded-lg bg-emerald-50 p-0.5 ring-1 ring-emerald-700/10">
              <Avatar profile={gig.creator} size="sm" className="h-8 w-8 text-sm" />
            </div>
            <span>
              Posted by:{' '}
              <Link
                to={`/profile/${gig.creator?.id}`}
                className="font-semibold text-gray-900 transition-colors hover:text-emerald-800 hover:underline"
              >
                {gig.creator?.full_name}
              </Link>
            </span>
          </div>
        )}

        {gig.skills_required && gig.skills_required.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {gig.skills_required.slice(0, 3).map((skill, index) => (
              <span key={index} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {skill}
              </span>
            ))}
            {gig.skills_required.length > 3 && (
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                +{gig.skills_required.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-emerald-900/10 pt-4">
          <Link
            to={`/gigs/${gig.id}`}
            className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            View Details
          </Link>
          {isPosted && gig.status === 'assigned' && (
            <button
              type="button"
              onClick={() => handleComplete(gig.id)}
              className="flex-1 whitespace-nowrap rounded-lg bg-gray-950 px-4 py-2 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Mark Complete
            </button>
          )}
          {isPosted && gig.status === 'open' && (
            <button
              type="button"
              onClick={() => handleDelete(gig.id)}
              disabled={deletingGigId === gig.id}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {deletingGigId === gig.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
          {isPosted && (
            <Link
              to={`/gigs/${gig.id}/applicants`}
              className="flex-1 rounded-lg border border-emerald-700/30 bg-white px-4 py-2 text-center text-sm font-semibold text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Applicants
            </Link>
          )}
          {gig.status === 'assigned' && (
            <Link
              to="/messages"
              state={{ gigId: gig.id, otherUserId: isPosted ? gig.assigned?.id : gig.creator?.id }}
              aria-label="Open chat"
              title="Chat"
              className="relative inline-flex h-9 w-10 flex-none items-center justify-center rounded-lg border border-emerald-700/30 bg-white text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <MessageCircle size={17} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F4]">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="mb-8">
            <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Gigs</h1>
            <p className="text-gray-600">Manage gigs you've posted and gigs assigned to you</p>
          </div>

          <div className="mb-8 inline-flex gap-2 rounded-xl border border-emerald-900/10 bg-white p-2 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all">
              <PenLine size={16} aria-hidden="true" />
              Posted by Me
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-emerald-50">
              <CheckCircle2 size={16} aria-hidden="true" />
              Assigned to Me
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <GigCardSkeleton key={index} className="bg-white shadow-[0_12px_30px_rgba(16,24,40,0.05)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gray-950">My Gigs</h1>
          <p className="text-gray-600">Manage gigs you've posted and gigs assigned to you</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 inline-flex flex-wrap gap-2 rounded-xl border border-emerald-900/10 bg-white p-2 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
          <button
            onClick={() => setActiveTab('posted')}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all ${
              activeTab === 'posted' 
                ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <PenLine size={16} aria-hidden="true" />
            Posted by Me ({postedGigs.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all ${
              activeTab === 'assigned' 
                ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)]' 
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Assigned to Me ({assignedGigs.length})
          </button>
        </div>

        {/* Posted Gigs Tab */}
        {activeTab === 'posted' && (
          <div>
            {postedGigs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <PenLine size={30} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-950">No gigs posted yet</h3>
                <p className="mb-6 text-gray-600">Create your first gig and start collaborating with peers</p>
                <Link
                  to="/gigs/post"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  <Plus size={17} aria-hidden="true" />
                  Post Your First Gig
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {postedGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} isPosted={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assigned Gigs Tab */}
        {activeTab === 'assigned' && (
          <div>
            {assignedGigs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-900/20 bg-white p-12 text-center shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <UserCheck size={30} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-950">No gigs assigned yet</h3>
                <p className="mb-6 text-gray-600">Apply to gigs and get accepted to see them here</p>
                <Link
                  to="/gigs"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  <FolderKanban size={17} aria-hidden="true" />
                  Browse Available Gigs
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {assignedGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} isPosted={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-12 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          <h3 className="mb-4 font-semibold text-gray-950">Summary</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-emerald-700/20 bg-emerald-50 p-4 text-center">
              <p className="mb-1 text-2xl font-semibold tracking-tight text-emerald-800">{postedGigs.length}</p>
              <p className="text-sm font-medium text-emerald-800">Posted</p>
            </div>
            <div className="rounded-lg border border-blue-300/70 bg-blue-50 p-4 text-center">
              <p className="mb-1 text-2xl font-semibold tracking-tight text-blue-800">{assignedGigs.length}</p>
              <p className="text-sm font-medium text-blue-800">Assigned</p>
            </div>
            <div className="rounded-lg border border-amber-300/70 bg-amber-50 p-4 text-center">
              <p className="mb-1 text-2xl font-semibold tracking-tight text-amber-800">
                {postedGigs.filter(g => g.status === 'open').length}
              </p>
              <p className="text-sm font-medium text-amber-800">Open</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="mb-1 text-2xl font-semibold tracking-tight text-gray-800">
                {[...postedGigs, ...assignedGigs].filter(g => g.status === 'completed').length}
              </p>
              <p className="text-sm font-medium text-gray-700">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyGigs;
