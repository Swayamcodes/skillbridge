import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const PublicProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [stats, setStats] = useState({
    gigs_posted_completed: 0,
    gigs_completed_as_freelancer: 0,
    total_credits_earned: 0,
    total_money_earned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const refreshProfileStats = () => {
      fetchProfile();
    };

    window.addEventListener('focus', refreshProfileStats);
    window.addEventListener('skillbridge:stats-updated', refreshProfileStats);

    return () => {
      window.removeEventListener('focus', refreshProfileStats);
      window.removeEventListener('skillbridge:stats-updated', refreshProfileStats);
    };
  }, [id]);

  const fetchProfile = async () => {
    try {
      const [profileRes, reviewsRes, statsRes] = await Promise.all([
        api.get(`/api/profiles/${id}`),
        api.get(`/api/reviews/user/${id}`),
        api.get(`/api/stats/user/${id}`)
      ]);
      setProfile(profileRes.data.profile);
      setReviews(reviewsRes.data.reviews);
      setAvgRating(reviewsRes.data.averageRating);
      setTotalReviews(reviewsRes.data.totalReviews);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-light mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">This user profile could not be found</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to="/gigs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          ← Back to Gigs
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-8">
          {/* Cover with gradient */}
          <div className="h-40 bg-gradient-to-r from-emerald-600 to-emerald-800"></div>
          
          <div className="px-8 pb-8">
            {/* Profile Avatar & Info */}
            <div className="flex items-start gap-6 -mt-16 mb-8 relative z-10">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-5xl font-light text-emerald-700 flex-shrink-0">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              
              {/* Name & College */}
              <div className="pt-16">
                <h1 className="text-3xl font-light mb-2">{profile?.full_name}</h1>
                <p className="text-gray-600 text-lg">{profile?.college}</p>
                <p className="text-sm text-gray-500">Year {profile?.year}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{profile?.credits}</p>
                <p className="text-sm text-gray-600">Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{totalReviews}</p>
                <p className="text-sm text-gray-600">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light mb-1">{profile?.reputation_score || 0}</p>
                <p className="text-sm text-gray-600">Reputation</p>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <span>📝</span> About
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {profile?.bio || 'This user hasn\'t added a bio yet.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-light mb-1">{stats.gigs_posted_completed || 0}</p>
                <p className="text-xs text-gray-600">Gigs Posted</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-light mb-1">{stats.gigs_completed_as_freelancer || 0}</p>
                <p className="text-xs text-gray-600">Gigs Completed</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-light mb-1 text-emerald-700">{stats.total_credits_earned || 0}</p>
                <p className="text-xs text-gray-600">Credits Earned</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-light mb-1 text-emerald-700">₹{stats.total_money_earned || 0}</p>
                <p className="text-xs text-gray-600">Money Earned</p>
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <span>⚡</span> Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm border border-emerald-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills listed yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light flex items-center gap-3">
              <span>⭐</span> Reviews
            </h2>
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
                <span className="text-yellow-600 text-xl">
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {Number(avgRating || 0).toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-gray-600">No reviews yet</p>
              <p className="text-sm text-gray-500 mt-1">This user hasn't received any reviews</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewer?.full_name}</p>
                      <p className="text-sm text-gray-500">{review.reviewer?.college}</p>
                    </div>
                    <div className="text-yellow-500 text-lg">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      For: <span className="font-medium">{review.transaction?.gig?.title}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
