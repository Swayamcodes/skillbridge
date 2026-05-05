import supabase from '../utils/supabase.js';

const getStatsForProfile = async (profileId) => {
  const [
    postedCompletedRes,
    freelancerCompletedRes,
    creditsEarnedRes,
    moneyEarnedRes
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profileId)
      .eq('status', 'completed'),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('freelancer_id', profileId)
      .eq('status', 'completed'),
    supabase
      .from('credits_ledger')
      .select('amount')
      .eq('to_user', profileId)
      .eq('type', 'earned'),
    supabase
      .from('transactions')
      .select('amount')
      .eq('freelancer_id', profileId)
      .eq('type', 'paid')
      .eq('status', 'completed')
  ]);

  if (postedCompletedRes.error) throw postedCompletedRes.error;
  if (freelancerCompletedRes.error) throw freelancerCompletedRes.error;
  if (creditsEarnedRes.error) throw creditsEarnedRes.error;
  if (moneyEarnedRes.error) throw moneyEarnedRes.error;

  const totalCreditsEarned = (creditsEarnedRes.data || []).reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0
  );

  const totalMoneyEarned = (moneyEarnedRes.data || []).reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );

  return {
    gigs_posted_completed: postedCompletedRes.count || 0,
    gigs_completed_as_freelancer: freelancerCompletedRes.count || 0,
    total_credits_earned: totalCreditsEarned,
    total_money_earned: totalMoneyEarned
  };
};

export const getUserStats = async (req, res) => {
  try {
    const authUserId = req.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profileId = profile.id;
    const stats = await getStatsForProfile(profileId);

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfileStats = async (req, res) => {
  try {
    const { profileId } = req.params;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const stats = await getStatsForProfile(profile.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get profile stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
