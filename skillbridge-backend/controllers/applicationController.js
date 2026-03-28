import supabase from '../utils/supabase.js';

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, title, type, price, credits, status)
      `)
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, applications: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGigApplicants = async (req, res) => {
  try {
    const { gigId } = req.params;
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
      .eq('id', gigId)
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
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, applicants: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Get application with full details
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, creator_id, type, price, credits, title)
      `)
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If barter, check creator has enough credits
    if (application.gig.type === 'barter') {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', application.gig.creator_id)
        .single();

      if (creatorProfile.credits < application.gig.credits) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient credits' 
        });
      }

      // Deduct credits from creator (lock in escrow)
      await supabase
        .from('profiles')
        .update({ 
          credits: creatorProfile.credits - application.gig.credits 
        })
        .eq('id', application.gig.creator_id);

      // Log credit transaction
      await supabase
        .from('credits_ledger')
        .insert([{
          from_user: application.gig.creator_id,
          to_user: application.applicant_id,
          gig_id: application.gig.id,
          amount: application.gig.credits,
          type: 'spent'
        }]);
    }

    // Create transaction record
    const transactionData = {
      gig_id: application.gig.id,
      creator_id: application.gig.creator_id,
      freelancer_id: application.applicant_id,
      type: application.gig.type,
      status: 'escrow'
    };

    if (application.gig.type === 'paid') {
      transactionData.amount = application.gig.price;
    } else {
      transactionData.credits = application.gig.credits;
    }

    const { data: transaction, error: transactionError } = await supabase
  .from('transactions')
  .insert([transactionData])
  .select()
  .single();

if (transactionError) {
  console.error('Transaction error:', transactionError);
  throw transactionError;
}

console.log('Transaction created:', transaction);

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id);

    // Update gig status and assign
    await supabase
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', application.gig.id);

    // Reject all other applications
    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', application.gig.id)
      .neq('id', id);

    res.json({ success: true, message: 'Application accepted and transaction created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data: application } = await supabase
      .from('applications')
      .select('*, gig:gigs(creator_id)')
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', id);

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
