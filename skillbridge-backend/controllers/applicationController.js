import supabase from '../utils/supabase.js';
import { getPaginationMeta, getPaginationParams } from '../utils/pagination.js';
import { checkFraudRules } from './fraudController.js';

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error, count } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, title, type, price, credits, status)
      `, { count: 'exact' })
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      applications: data,
      pagination: getPaginationMeta({ page, limit, total: count || 0 })
    });
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
  const rollbackState = {
    gigId: null,
    applicationId: null,
    creatorId: null,
    creditsDeducted: false,
    originalCredits: null,
    creditLedgerId: null,
    transactionId: null,
    applicationAccepted: false,
    gigAssigned: false,
    otherApplicationsRejected: false
  };

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Get application with full details
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, creator_id, type, price, credits, title, status)
      `)
      .eq('id', id)
      .maybeSingle();

    if (applicationError) throw applicationError;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application is no longer pending' });
    }

    if (application.gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    const { data: existingTransactions, error: existingTransactionError } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('gig_id', application.gig.id)
      .in('status', ['escrow', 'completed'])
      .limit(1);

    if (existingTransactionError) throw existingTransactionError;
    if (existingTransactions?.length > 0) {
      return res.status(400).json({ success: false, message: 'Gig already has an active transaction' });
    }

    rollbackState.gigId = application.gig.id;
    rollbackState.applicationId = id;
    rollbackState.creatorId = application.gig.creator_id;

    const { data: claimedApplication, error: claimApplicationError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (claimApplicationError) throw claimApplicationError;
    if (!claimedApplication) {
      return res.status(400).json({ success: false, message: 'Application is no longer pending' });
    }
    rollbackState.applicationAccepted = true;

    // If barter, check creator has enough credits
    if (application.gig.type === 'barter') {
      const { data: creatorProfile, error: creatorProfileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', application.gig.creator_id)
        .single();

      if (creatorProfileError) throw creatorProfileError;

      if (creatorProfile.credits < application.gig.credits) {
        await supabase
          .from('applications')
          .update({ status: 'pending' })
          .eq('id', id);
        rollbackState.applicationAccepted = false;

        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient credits' 
        });
      }

      rollbackState.originalCredits = creatorProfile.credits;

      // Deduct credits from creator (lock in escrow)
      const { error: deductCreditsError } = await supabase
        .from('profiles')
        .update({ 
          credits: creatorProfile.credits - application.gig.credits 
        })
        .eq('id', application.gig.creator_id);
      if (deductCreditsError) throw deductCreditsError;
      rollbackState.creditsDeducted = true;

      // Log credit transaction
      const { data: creditLedger, error: creditLedgerError } = await supabase
        .from('credits_ledger')
        .insert([{
          from_user: application.gig.creator_id,
          to_user: application.applicant_id,
          gig_id: application.gig.id,
          amount: application.gig.credits,
          type: 'spent'
        }])
        .select('id')
        .single();
      if (creditLedgerError) throw creditLedgerError;
      rollbackState.creditLedgerId = creditLedger.id;

      try {
        const fraudResult = await checkFraudRules(application.applicant_id);
        if (fraudResult.is_flagged) {
          console.warn('Fraud check flagged accepted barter applicant:', {
            applicant_id: application.applicant_id,
            reasons: fraudResult.reasons
          });
        }
      } catch (fraudError) {
        console.error('Fraud check failed after barter credit deduction:', fraudError.message);
      }
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

    rollbackState.transactionId = transaction.id;

    // Update gig status and assign
    const { data: assignedGig, error: gigUpdateError } = await supabase
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', application.gig.id)
      .eq('status', 'open')
      .select('id')
      .maybeSingle();
    if (gigUpdateError) throw gigUpdateError;
    if (!assignedGig) {
      throw new Error('Gig is no longer open');
    }
    rollbackState.gigAssigned = true;

    // Reject all other applications
    const { error: rejectOthersError } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', application.gig.id)
      .neq('id', id);
    if (rejectOthersError) throw rejectOthersError;
    rollbackState.otherApplicationsRejected = true;

    res.json({ success: true, message: 'Application accepted and transaction created' });
  } catch (error) {
    console.error('Accept application error:', error);

    try {
      if (rollbackState.otherApplicationsRejected && rollbackState.gigId) {
        await supabase
          .from('applications')
          .update({ status: 'pending' })
          .eq('gig_id', rollbackState.gigId)
          .neq('id', rollbackState.applicationId);
      }

      if (rollbackState.gigAssigned && rollbackState.gigId) {
        await supabase
          .from('gigs')
          .update({ status: 'open', assigned_to: null })
          .eq('id', rollbackState.gigId);
      }

      if (rollbackState.applicationAccepted && rollbackState.applicationId) {
        await supabase
          .from('applications')
          .update({ status: 'pending' })
          .eq('id', rollbackState.applicationId);
      }

      if (rollbackState.transactionId) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', rollbackState.transactionId);
      }

      if (rollbackState.creditLedgerId) {
        await supabase
          .from('credits_ledger')
          .delete()
          .eq('id', rollbackState.creditLedgerId);
      }

      if (rollbackState.creditsDeducted && rollbackState.creatorId) {
        await supabase
          .from('profiles')
          .update({ credits: rollbackState.originalCredits })
          .eq('id', rollbackState.creatorId);
      }
    } catch (rollbackError) {
      console.error('Accept application rollback error:', rollbackError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to accept application safely. No changes were finalized.'
    });
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
