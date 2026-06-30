import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Coins,
  FileText,
  IndianRupee,
  MessageCircle,
  PenLine,
  Send,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Users,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useContext(AuthContext);
  
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [error, setError] = useState('');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchGig();
  }, [id]);

  const fetchGig = async () => {
    try {
      const response = await api.get(`/api/gigs/${id}`);
      setGig(response.data.gig);

      try {
        const conversationsResponse = await api.get('/api/chat/conversations');
        const currentConversation = (conversationsResponse.data.conversations || [])
          .find((conversation) => conversation.gig_id === id);
        setChatUnreadCount(currentConversation?.unread_count || 0);
      } catch (chatError) {
        console.error('Error fetching chat unread count:', chatError);
      }
    } catch (error) {
      console.error('Error fetching gig:', error);
      setError('Gig not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setError('');

    try {
      await api.post(`/api/gigs/${id}/apply`, {
        message: applicationMessage
      });
      navigate('/applications', { state: { message: 'Application submitted successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure the work is complete?')) return;

    try {
      await api.put(`/api/gigs/${id}/complete`);
      alert('Payment released!');
      await fetchGig();
      refreshProfile?.();
      window.dispatchEvent(new Event('skillbridge:stats-updated'));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete gig';
      setError(message);
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this gig? This cannot be undone.')) return;

    setDeleting(true);
    setError('');

    try {
      const response = await api.delete(`/api/gigs/${id}`);
      navigate('/gigs', {
        state: { message: response.data?.message || 'Gig deleted successfully' }
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete gig';
      setError(message);
      alert(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      await api.post(`/api/reviews`, {
        gigId: id,
        rating: rating,
        comment: reviewComment
      });
      setShowReviewForm(false);
      setReviewComment('');
      setRating(5);
      fetchGig();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-700/20', icon: CheckCircle2 },
      assigned: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300/70', icon: Users },
      completed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300/70', icon: CheckCircle2 },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: AlertCircle }
    };
    return badges[status] || badges.open;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-900/10 bg-white px-10 py-8 shadow-[0_16px_38px_rgba(16,24,40,0.06)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (error && !gig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4">
        <div className="max-w-md rounded-xl border border-emerald-900/10 bg-white p-12 text-center shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <AlertCircle size={30} aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-950">Gig Not Found</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link 
            to="/gigs" 
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Gigs
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = gig?.creator?.id === profile?.id;
  const chatOtherUserId = isCreator ? gig?.assigned_to : (gig?.creator_id || gig?.creator?.id);
  const canChat = Boolean(
    gig?.status === 'assigned'
    && (isCreator || gig?.assigned_to === profile?.id)
    && chatOtherUserId
  );
  const statusBadge = getStatusBadge(gig?.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Back Button */}
        <Link
          to="/gigs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-emerald-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Gigs
        </Link>

        {/* Main Content Card */}
        <div className="overflow-hidden rounded-xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          {/* Header Section */}
          <div className="border-b border-emerald-900/10 p-6 sm:p-8">
            <div className="mb-3 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                    <StatusIcon size={13} aria-hidden="true" />
                    {gig.status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    {gig.type === 'paid' ? <IndianRupee size={13} aria-hidden="true" /> : <Coins size={13} aria-hidden="true" />}
                    {gig.type === 'paid' ? 'Paid' : 'Skill Credits'}
                  </span>
                </div>
                <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-4xl">
                  {gig.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Posted by</span>
                  <Avatar profile={gig.creator} size="sm" className="h-8 w-8 text-sm" />
                  <Link 
                    to={`/profile/${gig.creator?.id}`} 
                    className="font-semibold text-emerald-700 transition-colors hover:text-emerald-900 hover:underline"
                  >
                    {gig.creator?.full_name}
                  </Link>
                  <span>from {gig.creator?.college}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                {gig.type === 'paid' ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-xl font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)]">
                    <IndianRupee size={20} aria-hidden="true" />
                    {gig.price}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/20 bg-emerald-50 px-6 py-3 text-xl font-semibold text-emerald-800">
                    <Coins size={20} aria-hidden="true" />
                    {gig.credits} Credits
                  </div>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                  <StatusIcon size={15} aria-hidden="true" />
                  {gig.status}
                </span>
              </div>
            </div>

            {/* Creator Notice */}
            {isCreator && (
              <div className="mb-4 rounded-xl border border-emerald-700/20 bg-emerald-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-700" aria-hidden="true" />
                    <p className="font-semibold text-emerald-950">This is your gig</p>
                  </div>
                  <Link
                    to={`/gigs/${id}/applicants`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                  >
                    <Users size={16} aria-hidden="true" />
                    View Applicants
                  </Link>
                </div>
                {gig.status === 'open' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {deleting ? 'Deleting...' : 'Delete Gig'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {canChat && (
              <div className="mb-4 rounded-xl border border-emerald-900/10 bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-950">Project chat</p>
                    <p className="text-sm text-gray-600">Message the other party about this gig.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/messages', { state: { gigId: id, otherUserId: chatOtherUserId } })}
                    className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,0.14)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    Message
                    {chatUnreadCount > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                        {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isCreator && gig.status === 'assigned' && (
              <div className="rounded-xl border border-emerald-900/10 bg-gray-50 p-5">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-950">
                  <CheckCircle2 size={19} className="text-emerald-700" aria-hidden="true" />
                  Complete this Gig
                </h2>
                <p className="mb-4 text-gray-700">
                  Mark this gig as complete to release{' '}
                  <span className="font-semibold text-emerald-700">
                    {gig.type === 'paid' ? `₹${gig.price}` : `${gig.credits} credits`}
                  </span>{' '}
                  to the freelancer.
                </p>
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Complete & Release Payment
                </button>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="border-b border-emerald-900/10 p-6 sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-950">
              <FileText size={19} className="text-emerald-700" aria-hidden="true" />
              Description
            </h2>
            <div className="rounded-xl border border-emerald-900/10 bg-gray-50/80 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700 sm:text-base">{gig.description}</p>
            </div>
          </div>

          {/* Skills Required */}
          <div className="border-b border-emerald-900/10 p-6 sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-950">
              <Tags size={19} className="text-emerald-700" aria-hidden="true" />
              Skills Required
            </h2>
            <div className="flex flex-wrap gap-2">
              {gig.skills_required?.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Deadline */}
          {gig.deadline && (
            <div className="border-b border-emerald-900/10 p-6 sm:p-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-950">
                <CalendarDays size={19} className="text-emerald-700" aria-hidden="true" />
                Deadline
              </h2>
              <p className="text-gray-700">
                {new Date(gig.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Application Form */}
          {!isCreator && gig.status === 'open' && (
            <div className="bg-gray-50 p-6 sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-950">
                <PenLine size={19} className="text-emerald-700" aria-hidden="true" />
                Apply for this Gig
              </h2>
              
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleApply}>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Your Message
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Explain why you're a good fit for this gig..."
                    className="w-full resize-none rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700/40 focus:ring-4 focus:ring-emerald-700/10"
                    rows="5"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={applying}
                  className="w-full rounded-lg bg-emerald-700 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {applying ? (
                    <span className="flex items-center justify-center">
                      <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Send size={17} aria-hidden="true" />
                      Submit Application
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Review Section */}
          {gig.status === 'completed' && (isCreator || gig.assigned_to === profile?.id) && (
            <div className="border-t border-amber-200 bg-amber-50 p-6 sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-950">
                <Star size={19} className="text-amber-600" aria-hidden="true" />
                Leave a Review
              </h2>
              
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(180,83,9,0.16)] transition-all hover:-translate-y-0.5 hover:bg-amber-700"
                >
                  <PenLine size={17} aria-hidden="true" />
                  Write Review
                </button>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-4xl transition-all hover:-translate-y-0.5 ${star <= rating ? 'text-amber-500' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Comment</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience working on this gig..."
                      className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-700 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigDetail;
