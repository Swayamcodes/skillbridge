import supabase from '../utils/supabase.js';

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        gig:gigs(id, title)
      `)
      .eq('type', 'paid')
      .or(`creator_id.eq.${profile.id},freelancer_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, transactions: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditsHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('credits_ledger')
      .select(`
        *,
        gig:gigs(id, title)
      `)
      .or(`from_user.eq.${profile.id},to_user.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, history: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
