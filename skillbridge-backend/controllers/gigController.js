import supabase from '../utils/supabase.js';

export const createGig = async (req, res) => {
  try {
    const { title, description, type, price, credits, skillsRequired, deadline } = req.body;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const gigData = {
      creator_id: profile.id,
      title,
      description,
      type,
      skills_required: skillsRequired,
      deadline,
      status: 'open'
    };

    if (type === 'paid') {
      gigData.price = price;
    } else {
      gigData.credits = credits;
    }

    const { data, error } = await supabase
      .from('gigs')
      .insert([gigData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, gig: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllGigs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        creator:profiles!gigs_creator_id_fkey(id, full_name, email, college)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, gigs: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGigById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        creator:profiles!gigs_creator_id_fkey(id, full_name, email, college, skills, reputation_score)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, gig: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyToGig = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { data: gig } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .single();

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    if (gig.creator_id === profile.id) {
      return res.status(400).json({ success: false, message: 'Cannot apply to your own gig' });
    }

    const { data: existing } = await supabase
      .from('applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', profile.id)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this gig' });
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        gig_id: id,
        applicant_id: profile.id,
        message,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, application: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGigApplicants = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Check if user is gig creator
    const { data: gig } = await supabase
      .from('gigs')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(id, full_name, email, college, year, skills, reputation_score)
      `)
      .eq('gig_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, applicants: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getMyPostedGigs = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        assigned:profiles!gigs_assigned_to_fkey(id, full_name, email)
      `)
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, gigs: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAssignedGigs = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        creator:profiles!gigs_creator_id_fkey(id, full_name, email, college)
      `)
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, gigs: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeGig = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Get gig with transaction
    const { data: gig } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .single();

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Only creator can mark as complete' });
    }

    if (gig.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Gig is not assigned' });
    }

    // Get transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('gig_id', id)
      .eq('status', 'escrow')
      .single();

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Release payment/credits
    if (transaction.type === 'barter') {
      // Add credits to freelancer
      const { data: freelancer } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', transaction.freelancer_id)
        .single();

      await supabase
        .from('profiles')
        .update({
          credits: freelancer.credits + transaction.credits
        })
        .eq('id', transaction.freelancer_id);

      // Log credit transaction
      await supabase
        .from('credits_ledger')
        .insert([{
          from_user: transaction.creator_id,
          to_user: transaction.freelancer_id,
          gig_id: id,
          amount: transaction.credits,
          type: 'earned'
        }]);
    } else {
      // For paid gigs, add to freelancer's wallet balance
      const { data: freelancer } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', transaction.freelancer_id)
        .single();

      // Add wallet_balance column value (we'll create this column)
      const currentBalance = freelancer.wallet_balance || 0;
      
      await supabase
        .from('profiles')
        .update({
          wallet_balance: currentBalance + transaction.amount
        })
        .eq('id', transaction.freelancer_id);
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update gig status
    await supabase
      .from('gigs')
      .update({ status: 'completed' })
      .eq('id', id);

    res.json({ success: true, message: 'Gig completed successfully' });
  } catch (error) {
    console.error('Complete gig error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
