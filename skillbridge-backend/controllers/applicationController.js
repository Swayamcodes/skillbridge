import supabase from '../utils/supabase.js';
import { getPaginationMeta, getPaginationParams } from '../utils/pagination.js';
import { checkFraudRules } from './fraudController.js';
import { adjustProfileCredits } from '../utils/credits.js';

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
        applicant:profiles!applications_applicant_id_fkey(id, full_name, email, college, year, skills, reputation_score, avatar_url)
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
  const db = req.supabase || supabase;
  const rollbackState = {
    gigId: null,
    applicationId: null,
    creatorId: null,
    creditsDeducted: false,
    creditDelta: null,
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
    const traceId = `${id}-${Date.now()}`;

    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Get application with full details
    const { data: application, error: applicationError } = await db
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

    console.log('Accept application fetched:', {
      trace_id: traceId,
      application_id: application.id,
      application_status: application.status,
      gig_id: application.gig?.id,
      gig_status: application.gig?.status,
      applicant_id: application.applicant_id,
      requester_profile_id: profile.id
    });

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (application.status !== 'pending') {
      if (application.status === 'accepted') {
        const { data: acceptedTransaction, error: acceptedTransactionError } = await db
          .from('transactions')
          .select('id')
          .eq('gig_id', application.gig.id)
          .eq('freelancer_id', application.applicant_id)
          .in('status', ['escrow', 'completed'])
          .maybeSingle();

        if (acceptedTransactionError) throw acceptedTransactionError;

        if (
          application.gig.status === 'assigned' &&
          acceptedTransaction
        ) {
          console.log('Accept application idempotent success:', {
            trace_id: traceId,
            application_id: application.id,
            transaction_id: acceptedTransaction.id
          });
          return res.json({
            success: true,
            message: 'Application was already accepted',
            alreadyAccepted: true
          });
        }

        return res.status(409).json({
          success: false,
          message: 'Application acceptance is already being processed. Please refresh.'
        });
      }

      return res.status(400).json({ success: false, message: 'Application is no longer pending' });
    }

    if (application.gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    const { data: existingTransactions, error: existingTransactionError } = await db
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

    console.log('Accept application before claim:', {
      trace_id: traceId,
      application_id: id,
      expected_status: 'pending'
    });

    const { data: claimedApplication, error: claimApplicationError } = await db
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (claimApplicationError) throw claimApplicationError;
    if (!claimedApplication) {
      const { data: latestApplication, error: latestApplicationError } = await db
        .from('applications')
        .select('id, status')
        .eq('id', id)
        .maybeSingle();

      if (latestApplicationError) throw latestApplicationError;

      console.warn('Accept application claim missed:', {
        trace_id: traceId,
        application_id: id,
        fetched_status: application.status,
        latest_status: latestApplication?.status
      });

      if (latestApplication?.status === 'accepted') {
        return res.status(409).json({
          success: false,
          message: 'Application acceptance is already being processed. Please refresh.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Application cannot be accepted because its status is "${latestApplication?.status || 'unknown'}"`
      });
    }
    rollbackState.applicationAccepted = true;

    console.log('Accept application after claim:', {
      trace_id: traceId,
      application_id: id,
      application_status: 'accepted'
    });

    // If barter, check creator has enough credits
    if (application.gig.type === 'barter') {
      let creditAdjustment;

      try {
        creditAdjustment = await adjustProfileCredits(db, {
          profileId: application.gig.creator_id,
          delta: -Number(application.gig.credits || 0),
          minCredits: 0
        });
      } catch (creditError) {
        if (creditError.code === 'INSUFFICIENT_CREDITS') {
          console.warn('Accept application rejected for insufficient credits:', {
            trace_id: traceId,
            gig_id: application.gig.id,
            application_id: id,
            creator_id: application.gig.creator_id,
            previous_credits: creditError.previousCredits,
            attempted_next_credits: creditError.nextCredits,
            required_credits: application.gig.credits
          });

          await db
            .from('applications')
            .update({ status: 'pending' })
            .eq('id', id);
          rollbackState.applicationAccepted = false;

          return res.status(400).json({
            success: false,
            message: 'Insufficient credits'
          });
        }

        throw creditError;
      }

      if (!creditAdjustment) {
        await db
          .from('applications')
          .update({ status: 'pending' })
          .eq('id', id);
        rollbackState.applicationAccepted = false;

        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient credits' 
        });
      }

      rollbackState.originalCredits = creditAdjustment.previousCredits;
      rollbackState.creditDelta = -Number(application.gig.credits || 0);
      rollbackState.creditsDeducted = true;

      console.log('Accept application deducting creator credits:', {
        trace_id: traceId,
        gig_id: application.gig.id,
        application_id: id,
        creator_id: application.gig.creator_id,
        previous_credits: creditAdjustment.previousCredits,
        deducted_credits: application.gig.credits,
        next_credits: creditAdjustment.nextCredits,
        attempts: creditAdjustment.attempts
      });

      // Log credit transaction
      const { data: creditLedger, error: creditLedgerError } = await db
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

    const { data: transaction, error: transactionError } = await db
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
    const { data: assignedGig, error: gigUpdateError } = await db
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
    const { error: rejectOthersError } = await db
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', application.gig.id)
      .eq('status', 'pending')
      .neq('id', id);
    if (rejectOthersError) throw rejectOthersError;
    rollbackState.otherApplicationsRejected = true;

    console.log('Accept application completed:', {
      trace_id: traceId,
      application_id: id,
      gig_id: application.gig.id,
      transaction_id: transaction.id
    });

    try {
      const { data: applicantProfile, error: applicantProfileError } = await db
        .from('profiles')
        .select('user_id')
        .eq('id', application.applicant_id)
        .single();

      if (applicantProfileError) throw applicantProfileError;

      const { error: notificationError } = await db
        .from('notifications')
        .insert([{
          user_id: applicantProfile.user_id,
          type: 'application_accepted',
          title: 'Application Accepted!',
          message: `You've been accepted for "${application.gig.title}"`,
          link: `/gigs/${application.gig.id}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create application accepted notification:', notificationError);
    }

    res.json({ success: true, message: 'Application accepted and transaction created' });
  } catch (error) {
    console.error('Accept application error:', error);

    try {
      if (rollbackState.otherApplicationsRejected && rollbackState.gigId) {
        await db
          .from('applications')
          .update({ status: 'pending' })
          .eq('gig_id', rollbackState.gigId)
          .eq('status', 'rejected')
          .neq('id', rollbackState.applicationId);
      }

      if (rollbackState.gigAssigned && rollbackState.gigId) {
        await db
          .from('gigs')
          .update({ status: 'open', assigned_to: null })
          .eq('id', rollbackState.gigId);
      }

      if (rollbackState.applicationAccepted && rollbackState.applicationId) {
        await db
          .from('applications')
          .update({ status: 'pending' })
          .eq('id', rollbackState.applicationId);
      }

      if (rollbackState.transactionId) {
        await db
          .from('transactions')
          .delete()
          .eq('id', rollbackState.transactionId);
      }

      if (rollbackState.creditLedgerId) {
        await db
          .from('credits_ledger')
          .delete()
          .eq('id', rollbackState.creditLedgerId);
      }

      if (rollbackState.creditsDeducted && rollbackState.creatorId) {
        await adjustProfileCredits(db, {
          profileId: rollbackState.creatorId,
          delta: -Number(rollbackState.creditDelta || 0)
        });
      }
    } catch (rollbackError) {
      console.error('Accept application rollback error:', rollbackError);
    }

    res.status(500).json({
      success: false,
      message: `Failed to accept application: ${error.message}`
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
      .select('*, gig:gigs(id, creator_id, title)')
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { error: rejectionError } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (rejectionError) throw rejectionError;

    try {
      const { data: applicantProfile, error: applicantProfileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', application.applicant_id)
        .single();

      if (applicantProfileError) throw applicantProfileError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: applicantProfile.user_id,
          type: 'application_rejected',
          title: 'Application Update',
          message: `Your application for "${application.gig.title}" was not selected`,
          link: `/gigs/${application.gig.id}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create application rejected notification:', notificationError);
    }

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
