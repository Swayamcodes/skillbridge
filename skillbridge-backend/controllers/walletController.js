import supabase from '../utils/supabase.js';
import { getPaginationMeta, getPaginationParams } from '../utils/pagination.js';

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error, count } = await supabase
      .from('transactions')
      .select(`
        *,
        gig:gigs(id, title)
      `, { count: 'exact' })
      .eq('type', 'paid')
      .or(`creator_id.eq.${profile.id},freelancer_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      transactions: data,
      pagination: getPaginationMeta({ page, limit, total: count || 0 })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { data: spentEntries, error: spentError } = await supabase
      .from('credits_ledger')
      .select(`
        *,
        gig:gigs(id, title)
      `)
      .eq('from_user', profile.id)
      .eq('type', 'spent');

    if (spentError) throw spentError;

    const { data: earnedEntries, error: earnedError } = await supabase
      .from('credits_ledger')
      .select(`
        *,
        gig:gigs(id, title)
      `)
      .eq('to_user', profile.id)
      .eq('type', 'earned');

    if (earnedError) throw earnedError;

    const combinedHistory = [
      ...(spentEntries || []),
      ...(earnedEntries || [])
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const paginatedHistory = combinedHistory.slice(offset, offset + limit);

    res.json({
      success: true,
      history: paginatedHistory,
      pagination: getPaginationMeta({ page, limit, total: combinedHistory.length })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
