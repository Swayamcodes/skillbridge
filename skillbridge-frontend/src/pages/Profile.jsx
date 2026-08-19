import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Coins,
  IndianRupee,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { AuthContext } from '../context/auth';
import Avatar from '../components/Avatar';
import ProfileFreelancerFields, { AvailabilityBadge } from '../components/ProfileFreelancerFields';
import { ProfileSkeleton } from '../components/Skeletons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const formatReputationScore = (score) => Number(score || 0).toFixed(2);

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
      <div className="min-h-screen bg-[#F7F8F4]">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            to="/dashboard"
            className="mb-4 inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-emerald-700 transition-all hover:translate-x-1 hover:text-emerald-900"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>

          <ProfileSkeleton className="mb-8 bg-white shadow-[0_18px_50px_rgba(16,24,40,0.08)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:py-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-emerald-700 transition-all hover:translate-x-1 hover:text-emerald-900"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Dashboard
        </Link>

        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-[0_20px_56px_rgba(16,24,40,0.08)]">
          <div className="relative h-44 overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 sm:h-52">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`,
                backgroundSize: '64px 64px',
              }}
            />
            <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute right-5 top-5 sm:right-7 sm:top-7">
              <Link
                to="/profile/edit"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-[0_12px_30px_rgba(6,78,59,0.16)] transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="px-5 pb-7 sm:px-8 lg:px-10">
            <div className="relative z-10 -mt-24 mb-6 flex flex-col gap-4 sm:-mt-28 sm:flex-row sm:items-end sm:gap-6">
              <Avatar profile={profile} size="xl" className="border-4 border-white bg-white font-light shadow-[0_18px_45px_rgba(16,24,40,0.18)] ring-4 ring-white/70" />

              <div className="min-w-0 flex-1 pb-2 sm:pb-3">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{profile?.full_name}</h1>
                  <AvailabilityBadge status={profile?.availability_status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-emerald-50/85 sm:text-base">
                  <p className="font-medium text-white/90">{profile?.college}</p>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-200 sm:inline-flex" />
                  <p>Year {profile?.year}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-emerald-900/10 pt-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid min-w-[760px] grid-cols-5 gap-3">
                <div className="rounded-xl border border-emerald-900/10 bg-gradient-to-br from-white to-emerald-50/60 p-3.5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Coins size={16} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-gray-950">{profile?.credits}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">Credits</p>
                </div>
                <div className="rounded-xl border border-emerald-900/10 bg-gradient-to-br from-white to-emerald-50/60 p-3.5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Trophy size={16} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-gray-950">{formatReputationScore(profile?.reputation_score)}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">Reputation</p>
                </div>
                <div className="rounded-xl border border-emerald-900/10 bg-gradient-to-br from-white to-emerald-50/60 p-3.5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Star size={16} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-gray-950">{totalReviews}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">Reviews</p>
                </div>
                <div className="rounded-xl border border-emerald-900/10 bg-white p-3.5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <Briefcase size={16} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-gray-950">{stats.gigs_completed_as_freelancer || 0}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">Completed Gigs</p>
                </div>
                <div className="rounded-xl border border-emerald-900/10 bg-white p-3.5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <IndianRupee size={16} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-emerald-800">₹{stats.total_money_earned || 0}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">Money Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)] sm:p-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">About</p>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gray-950">Creator profile</h2>
              <p className="text-base leading-8 text-gray-700">
                {profile?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
              </p>
            </section>

            <section className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)] sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Skills</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-950">What I can help with</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile?.category && (
                  <span className="rounded-xl border border-gray-900 bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                    {profile.category}
                  </span>
                )}
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-xl border border-emerald-700/15 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition-colors hover:border-emerald-700/30 hover:bg-emerald-100"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills added yet. Click "Edit Profile" to add your skills.</p>
                )}
              </div>
            </section>
          </div>

          <section className="self-start rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-[0_16px_38px_rgba(16,24,40,0.06)] lg:sticky lg:top-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Professional Information</p>
            <ProfileFreelancerFields profile={profile} />
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_16px_38px_rgba(16,24,40,0.06)] sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Reviews</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Reputation notes</h2>
                </div>
                {totalReviews > 0 && (
                  <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 shadow-sm">
                    <span className="text-lg text-yellow-600">
                      {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {Number(avgRating || 0).toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-900/20 bg-emerald-50/50 px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
                    <MessageCircle size={24} aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-gray-800">No reviews yet</p>
                  <p className="mt-1 text-sm text-gray-500">Complete gigs to start building your reputation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_14px_35px_rgba(16,24,40,0.07)]">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar profile={review.reviewer} size="sm" />
                          <div>
                          <Link
                            to={`/profile/${review.reviewer?.id}`}
                            className="font-semibold text-gray-950 transition-colors hover:text-emerald-700 hover:underline"
                          >
                            {review.reviewer?.full_name}
                          </Link>
                          <p className="text-sm text-gray-500">{review.reviewer?.college}</p>
                          </div>
                        </div>
                        <div className="text-lg leading-none text-yellow-500">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <p className="mb-4 text-sm leading-7 text-gray-700">{review.comment}</p>
                      <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-gray-600">
                          For: <span className="font-semibold text-gray-800">{review.transaction?.gig?.title}</span>
                        </p>
                        <p className="text-xs font-medium text-gray-500">
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
        </section>
      </div>
    </div>
  );
};

export default Profile;
