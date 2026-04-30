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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error, count } = await supabase
      .from('credits_ledger')
      .select(`
        *,
        gig:gigs(id, title)
      `, { count: 'exact' })
      .or(`from_user.eq.${profile.id},to_user.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      history: data,
      pagination: getPaginationMeta({ page, limit, total: count || 0 })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
