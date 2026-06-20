import supabase from '../utils/supabase.js';

export const createReview = async (req, res) => {
  try {
    const { gigId, rating, comment } = req.body;
    const userId = req.user.id;

    // Get reviewer profile
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Get gig and transaction
    const { data: gig } = await supabase
      .from('gigs')
      .select('*, creator_id, assigned_to')
      .eq('id', gigId)
      .single();

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Gig must be completed to review' });
    }

    // Get transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('gig_id', gigId)
      .eq('status', 'completed')
      .single();

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Determine reviewer and reviewee
    let revieweeId;
    if (reviewerProfile.id === transaction.creator_id) {
      // Creator reviewing freelancer
      revieweeId = transaction.freelancer_id;
    } else if (reviewerProfile.id === transaction.freelancer_id) {
      // Freelancer reviewing creator
      revieweeId = transaction.creator_id;
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to review' });
    }

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('*')
      .eq('transaction_id', transaction.id)
      .eq('reviewer_id', reviewerProfile.id)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this gig' });
    }

    // Create review
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        transaction_id: transaction.id,
        reviewer_id: reviewerProfile.id,
        reviewee_id: revieweeId,
        rating: rating,
        comment: comment
      }])
      .select()
      .single();

    if (error) throw error;

    // Update reviewee's reputation score
    await updateReputationScore(revieweeId);

    try {
      const { data: revieweeProfile, error: revieweeProfileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', revieweeId)
        .single();

      if (revieweeProfileError) throw revieweeProfileError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: revieweeProfile.user_id,
          type: 'new_review',
          title: 'New Review Received',
          message: `You received a ${rating}-star review for "${gig.title}"`,
          link: `/profile/${revieweeId}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create new review notification:', notificationError);
    }

    res.status(201).json({ success: true, review: data });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, college),
        transaction:transactions(gig:gigs(title))
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average rating
    const avgRating = data.length > 0 
      ? data.reduce((sum, review) => sum + review.rating, 0) / data.length 
      : 0;

    res.json({ 
      success: true, 
      reviews: data,
      averageRating: avgRating.toFixed(1),
      totalReviews: data.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to update reputation score
async function updateReputationScore(profileId) {
  try {
    // Get all reviews for this user
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', profileId);

    // Get completed gigs count
    const { data: completedGigs, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`creator_id.eq.${profileId},freelancer_id.eq.${profileId}`)
      .eq('status', 'completed');

    // Calculate reputation score
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const reputationScore = (count * 10) + (avgRating * 20);

    // Update profile
    await supabase
      .from('profiles')
      .update({ reputation_score: reputationScore })
      .eq('id', profileId);

  } catch (error) {
    console.error('Error updating reputation:', error);
  }
}
