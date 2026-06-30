import { adminSupabase } from './supabase.js';

export const calculateReputationScore = ({ completedGigs, avgRating }) => (
  (Number(completedGigs || 0) * 10) + (Number(avgRating || 0) * 20)
);

export const getReputationInputs = async (profileId, db = adminSupabase) => {
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, full_name, reputation_score')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    const error = new Error(`Profile not found for reputation update: ${profileId}`);
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }

  const { data: reviews, error: reviewsError } = await db
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', profileId);

  if (reviewsError) throw reviewsError;

  const { count: completedGigs, error: completedGigsError } = await db
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .or(`creator_id.eq.${profileId},freelancer_id.eq.${profileId}`)
    .eq('status', 'completed');

  if (completedGigsError) throw completedGigsError;

  const reviewRows = reviews || [];
  const avgRating = reviewRows.length > 0
    ? reviewRows.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewRows.length
    : 0;

  return {
    profile,
    completedGigs: completedGigs || 0,
    avgRating,
    reviewCount: reviewRows.length,
    reputationScore: calculateReputationScore({
      completedGigs: completedGigs || 0,
      avgRating
    })
  };
};

export const updateReputationScore = async (profileId, options = {}) => {
  const db = options.db || adminSupabase;
  const trace = options.trace || {};
  const inputs = await getReputationInputs(profileId, db);

  console.log('Reputation score before update:', {
    ...trace,
    profile_id: profileId,
    full_name: inputs.profile.full_name,
    before_reputation_score: inputs.profile.reputation_score,
    completed_gigs: inputs.completedGigs,
    review_count: inputs.reviewCount,
    avg_rating: inputs.avgRating,
    calculated_reputation_score: inputs.reputationScore
  });

  const { data: updatedProfile, error: updateError } = await db
    .from('profiles')
    .update({ reputation_score: inputs.reputationScore })
    .eq('id', profileId)
    .select('id, reputation_score')
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updatedProfile) {
    const error = new Error(`Reputation update matched no profile: ${profileId}`);
    error.code = 'REPUTATION_UPDATE_MISSED';
    throw error;
  }

  console.log('Reputation score after update:', {
    ...trace,
    profile_id: profileId,
    after_reputation_score: updatedProfile.reputation_score
  });

  return {
    ...inputs,
    updatedReputationScore: Number(updatedProfile.reputation_score || 0)
  };
};
