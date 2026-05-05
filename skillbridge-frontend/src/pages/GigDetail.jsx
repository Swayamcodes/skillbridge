import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useContext(AuthContext);
  
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [error, setError] = useState('');

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
      open: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '🟢' },
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '✓' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '🔒' }
    };
    return badges[status] || badges.open;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (error && !gig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-light mb-2">Gig Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            to="/gigs" 
            className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
          >
            ← Back to Gigs
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = gig?.creator?.id === profile?.id;
  const statusBadge = getStatusBadge(gig?.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header/Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-light tracking-wide">Skill bridge</Link>
          <div className="flex items-center gap-4">
            <Link to="/gigs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Browse Gigs
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to="/gigs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          ← Back to Gigs
        </Link>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-light mb-3">{gig.title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>Posted by</span>
                  <Link 
                    to={`/profile/${gig.creator?.id}`} 
                    className="font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    {gig.creator?.full_name}
                  </Link>
                  <span>from {gig.creator?.college}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 items-end">
                {gig.type === 'paid' ? (
                  <div className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium text-xl">
                    ₹{gig.price}
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 border-2 border-emerald-200 px-6 py-3 rounded-lg font-medium text-xl">
                    {gig.credits} Credits
                  </div>
                )}
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} inline-flex items-center gap-1.5`}>
                  <span>{statusBadge.icon}</span>
                  <span className="uppercase">{gig.status}</span>
                </span>
              </div>
            </div>

            {/* Creator Notice */}
            {isCreator && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700">✨</span>
                    <p className="font-medium text-emerald-900">This is your gig</p>
                  </div>
                  <Link
                    to={`/gigs/${id}/applicants`}
                    className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-800 transition-colors"
                  >
                    View Applicants
                  </Link>
                </div>
              </div>
            )}

            {isCreator && gig.status === 'assigned' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-medium mb-2 text-gray-900">
                  <span>âœ“</span> Complete this Gig
                </h2>
                <p className="text-gray-700 mb-4">
                  Mark this gig as complete to release{' '}
                  <span className="font-medium text-emerald-700">
                    {gig.type === 'paid' ? `₹${gig.price}` : `${gig.credits} credits`}
                  </span>{' '}
                  to the freelancer.
                </p>
                <button
                  onClick={handleComplete}
                  className="bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-medium"
                >
                  Complete & Release Payment
                </button>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <span>📝</span> Description
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
          </div>

          {/* Skills Required */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <span>⚡</span> Skills Required
            </h2>
            <div className="flex flex-wrap gap-2">
              {gig.skills_required?.map((skill, index) => (
                <span
                  key={index}
                  className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm border border-emerald-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Deadline */}
          {gig.deadline && (
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <span>📅</span> Deadline
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
            <div className="p-8 bg-gray-50">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <span>✍️</span> Apply for this Gig
              </h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleApply}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Explain why you're a good fit for this gig..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    rows="5"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={applying}
                  className="w-full bg-emerald-700 text-white rounded-lg py-3 font-medium hover:bg-emerald-800 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {applying ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Review Section */}
          {gig.status === 'completed' && (isCreator || gig.assigned_to === profile?.id) && (
            <div className="p-8 bg-yellow-50 border-t border-yellow-200">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <span>⭐</span> Leave a Review
              </h2>
              
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Write Review
                </button>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-4xl transition-colors ${star <= rating ? 'text-yellow-500' : 'text-gray-300'} hover:scale-110`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience working on this gig..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
