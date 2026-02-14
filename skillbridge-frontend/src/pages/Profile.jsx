import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { profile: authProfile, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
const [avgRating, setAvgRating] = useState(0);
const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
  try {
    const [profileRes, reviewsRes] = await Promise.all([
      api.get(`/api/profiles/${authProfile.id}`),
      api.get(`/api/reviews/user/${authProfile.id}`)
    ]);
    setProfile(profileRes.data.profile);
    setReviews(reviewsRes.data.reviews);
    setAvgRating(reviewsRes.data.averageRating);
    setTotalReviews(reviewsRes.data.totalReviews);
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-black shadow-brutal p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile?.full_name}</h1>
              <p className="text-lg">{profile?.college}</p>
              <p>Year {profile?.year}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/profile/edit"
                className="bg-black text-white border-3 border-black px-4 py-2 font-bold hover:bg-white hover:text-black"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="border-3 border-black px-4 py-2 font-bold hover:bg-black hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-2">Email:</p>
            <p>{profile?.email}</p>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-2">Credits:</p>
            <p className="text-2xl">{profile?.credits}</p>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-2">Bio:</p>
            <p>{profile?.bio || 'No bio added yet'}</p>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-2">Skills:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="border-3 border-black px-3 py-1 font-bold"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p>No skills added yet</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-2">Reputation Score:</p>
            <p className="text-xl">{profile?.reputation_score || 0}</p>
          </div>
        </div>

        <div className="border-4 border-black shadow-brutal p-8 mt-6">
  <h2 className="text-2xl font-bold mb-4">
    Reviews ({totalReviews})
    {totalReviews > 0 && (
      <span className="ml-4 text-yellow-600">
        {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
        {' '}({avgRating})
      </span>
    )}
  </h2>

  {reviews.length === 0 ? (
    <p>No reviews yet</p>
  ) : (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-3 border-black p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold">{review.reviewer?.full_name}</p>
              <p className="text-sm">{review.reviewer?.college}</p>
            </div>
            <div className="text-yellow-600 text-xl">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </div>
          </div>
          <p className="mb-2">{review.comment}</p>
          <p className="text-sm text-gray-600">
            For: {review.transaction?.gig?.title}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )}
</div>

        <div className="mt-4">
          <Link
            to="/"
            className="inline-block border-3 border-black px-6 py-3 font-bold hover:bg-black hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;