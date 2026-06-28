import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import { ProfileSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Profile = () => {
  const { profile: authProfile } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [stats, setStats] = useState({
    gigs_posted_completed: 0,
    gigs_completed_as_freelancer: 0,
    total_credits_earned: 0,
    total_money_earned: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

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
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, reviewsRes, statsRes] = await Promise.all([
        api.get(`/api/profiles/${authProfile.id}`),
        api.get(`/api/reviews/user/${authProfile.id}`),
        api.get('/api/stats/user')
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            â† Back to Dashboard
          </Link>

          <ProfileSkeleton className="bg-white shadow-lg mb-8" />
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
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-8">
          {/* Cover with gradient */}
          <div className="h-40 bg-gradient-to-r from-emerald-600 to-emerald-800 relative">
            {/* Edit Button positioned on cover */}
            <div className="absolute top-6 right-6">
              <Link
                to="/profile/edit"
                className="bg-white text-emerald-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-md"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          
          <div className="px-8 pb-8">
            {/* Profile Avatar & Info */}
            <div className="flex items-start gap-6 -mt-16 mb-8 relative z-10">
              {/* Avatar */}
              <Avatar profile={profile} size="xl" className="bg-white border-4 border-white shadow-lg font-light" />
              
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
                {profile?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
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

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <span>✉️</span> Contact
              </h3>
              <p className="text-gray-700">{profile?.email}</p>
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
                  <p className="text-gray-500 text-sm">No skills added yet. Click "Edit Profile" to add your skills.</p>
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
              <p className="text-sm text-gray-500 mt-1">Complete gigs to start building your reputation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar profile={review.reviewer} size="sm" />
                      <div>
                      <Link
                        to={`/profile/${review.reviewer?.id}`}
                        className="font-medium text-gray-900 hover:text-emerald-700 hover:underline"
                      >
                        {review.reviewer?.full_name}
                      </Link>
                      <p className="text-sm text-gray-500">{review.reviewer?.college}</p>
                      </div>
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

export default Profile;
