import supabase from '../utils/supabase.js';
import { updateReputationScore } from '../utils/reputation.js';

export const createReview = async (req, res) => {
  try {
    const db = req.supabase || supabase;
    const { gigId, rating, comment } = req.body;
    const userId = req.user.id;
    const traceId = `${gigId}-${Date.now()}`;

    // Get reviewer profile
    const { data: reviewerProfile, error: reviewerProfileError } = await db
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (reviewerProfileError) throw reviewerProfileError;
    if (!reviewerProfile) {
      return res.status(404).json({ success: false, message: 'Reviewer profile not found' });
    }

    // Get gig and transaction
    const { data: gig, error: gigError } = await db
      .from('gigs')
      .select('*, creator_id, assigned_to')
      .eq('id', gigId)
      .maybeSingle();

    if (gigError) throw gigError;
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Gig must be completed to review' });
    }

    // Get transaction
    const { data: transaction, error: transactionError } = await db
      .from('transactions')
      .select('*')
      .eq('gig_id', gigId)
      .eq('status', 'completed')
      .maybeSingle();

    if (transactionError) throw transactionError;
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
    const { data: existing, error: existingReviewError } = await db
      .from('reviews')
      .select('*')
      .eq('transaction_id', transaction.id)
      .eq('reviewer_id', reviewerProfile.id)
      .maybeSingle();

    if (existingReviewError) throw existingReviewError;
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this gig' });
    }

    // Create review
    const { data, error } = await db
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
    try {
      await updateReputationScore(revieweeId, {
        trace: {
          trace_id: traceId,
          source: 'createReview',
          review_id: data.id,
          transaction_id: transaction.id
        }
      });
    } catch (reputationError) {
      console.error('Failed to update reviewee reputation score after review:', {
        trace_id: traceId,
        review_id: data.id,
        reviewee_id: revieweeId,
        message: reputationError.message,
        details: reputationError.details,
        hint: reputationError.hint,
        code: reputationError.code
      });
    }

    try {
      const { data: revieweeProfile, error: revieweeProfileError } = await db
        .from('profiles')
        .select('user_id')
        .eq('id', revieweeId)
        .single();

      if (revieweeProfileError) throw revieweeProfileError;

      const { error: notificationError } = await db
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
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, college, avatar_url),
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
