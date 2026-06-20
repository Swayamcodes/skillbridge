import axios from 'axios';
import supabase from '../utils/supabase.js';
import { getPaginationMeta, getPaginationParams } from '../utils/pagination.js';
import { checkFraudRules } from './fraudController.js';

const MODERATION_SERVICE_URL = 'http://localhost:5001/api/moderate';

const moderateContent = async (text) => {
  if (!text || !String(text).trim()) {
    return { is_safe: true, flagged_words: [] };
  }

  try {
    const response = await axios.post(
      MODERATION_SERVICE_URL,
      { text },
      { timeout: 10000 }
    );

    return {
      is_safe: response.data?.is_safe !== false,
      flagged_words: Array.isArray(response.data?.flagged_words) ? response.data.flagged_words : []
    };
  } catch (error) {
    console.error('Moderation service unavailable, allowing request:', error.message);
    return { is_safe: true, flagged_words: [] };
  }
};

export const createGig = async (req, res) => {
  try {
    const { title, description, type, price, credits, skillsRequired, deadline } = req.body;
    const userId = req.user.id;

    try {
      const moderationResult = await moderateContent(`${title || ''} ${description || ''}`);
      if (!moderationResult.is_safe) {
        return res.status(400).json({
          success: false,
          message: 'Content contains inappropriate language',
          flagged_words: moderationResult.flagged_words
        });
      }
    } catch (error) {
      console.error('Moderation pre-check failed, continuing with gig creation:', error.message);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

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
    const { page, limit, offset } = getPaginationParams(req.query);

    const { data, error, count } = await supabase
      .from('gigs')
      .select(`
        *,
        creator:profiles!gigs_creator_id_fkey(id, full_name, email, college)
      `, { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      gigs: data,
      pagination: getPaginationMeta({ page, limit, total: count || 0 })
    });
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

    const moderationResult = await moderateContent(message);
    if (!moderationResult.is_safe) {
      return res.status(400).json({
        success: false,
        message: 'Application message contains inappropriate language',
        flagged_words: moderationResult.flagged_words
      });
    }

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

    console.log('Application created:', {
      application_id: data.id,
      gig_id: data.gig_id,
      applicant_id: data.applicant_id,
      status: data.status
    });

    try {
      const { data: creatorProfile, error: creatorProfileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', gig.creator_id)
        .single();

      if (creatorProfileError) throw creatorProfileError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: creatorProfile.user_id,
          type: 'new_application',
          title: 'New Application',
          message: `Someone applied to your gig "${gig.title}"`,
          link: `/gigs/${gig.id}/applicants`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create new application notification:', notificationError);
    }

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
  const rollbackState = {
    transactionId: null,
    gigId: null,
    freelancerId: null,
    transactionStatusBeforeUpdate: null,
    gigStatusBeforeUpdate: null,
    freelancerCreditUpdated: false,
    originalFreelancerCredits: null,
    freelancerWalletUpdated: false,
    originalWalletBalance: null,
    creditLedgerId: null,
    transactionCompleted: false,
    gigCompleted: false
  };

  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Complete gig requested:', { gig_id: id, auth_user_id: userId });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      console.warn('Complete gig failed: profile not found', { gig_id: id, auth_user_id: userId });
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (gigError) throw gigError;
    if (!gig) {
      console.warn('Complete gig failed: gig not found', { gig_id: id, profile_id: profile.id });
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    console.log('Complete gig loaded gig:', {
      gig_id: id,
      creator_id: gig.creator_id,
      assigned_to: gig.assigned_to,
      status: gig.status,
      type: gig.type,
      requester_profile_id: profile.id
    });

    if (gig.creator_id !== profile.id) {
      console.warn('Complete gig forbidden: requester is not creator', {
        gig_id: id,
        creator_id: gig.creator_id,
        requester_profile_id: profile.id
      });
      return res.status(403).json({ success: false, message: 'Only creator can mark as complete' });
    }

    if (gig.status !== 'assigned') {
      console.warn('Complete gig rejected: gig is not assigned', {
        gig_id: id,
        status: gig.status
      });
      return res.status(400).json({ success: false, message: 'Gig is not assigned' });
    }

    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('gig_id', id)
      .eq('status', 'escrow');

    if (transactionError) throw transactionError;
    if ((transactions || []).length > 1) {
      console.error('Complete gig failed: multiple active escrow transactions found', {
        gig_id: id,
        transaction_ids: transactions.map((item) => item.id)
      });
      return res.status(409).json({
        success: false,
        message: 'Multiple active escrow transactions found for this gig. Please resolve duplicate transactions before completing.'
      });
    }

    const transaction = transactions?.[0];
    if (!transaction) {
      console.warn('Complete gig failed: active escrow transaction not found', { gig_id: id });
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    console.log('Complete gig loaded escrow transaction:', {
      gig_id: id,
      transaction_id: transaction.id,
      transaction_type: transaction.type,
      creator_id: transaction.creator_id,
      freelancer_id: transaction.freelancer_id,
      amount: transaction.amount,
      credits: transaction.credits
    });

    if (transaction.creator_id !== gig.creator_id || transaction.freelancer_id !== gig.assigned_to) {
      console.error('Complete gig failed: transaction does not match gig assignment', {
        gig_id: id,
        transaction_id: transaction.id,
        gig_creator_id: gig.creator_id,
        gig_assigned_to: gig.assigned_to,
        transaction_creator_id: transaction.creator_id,
        transaction_freelancer_id: transaction.freelancer_id
      });
      throw new Error('Transaction does not match gig assignment');
    }

    rollbackState.transactionId = transaction.id;
    rollbackState.gigId = id;
    rollbackState.freelancerId = transaction.freelancer_id;
    rollbackState.transactionStatusBeforeUpdate = transaction.status;
    rollbackState.gigStatusBeforeUpdate = gig.status;

    if (transaction.type === 'barter') {
      console.log('Complete gig releasing barter credits:', {
        gig_id: id,
        transaction_id: transaction.id,
        freelancer_id: transaction.freelancer_id,
        credits: transaction.credits
      });

      const { data: freelancer, error: freelancerError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', transaction.freelancer_id)
        .single();
      if (freelancerError) throw freelancerError;

      rollbackState.originalFreelancerCredits = freelancer.credits;

      const { error: updateCreditsError } = await supabase
        .from('profiles')
        .update({
          credits: Number(freelancer.credits || 0) + Number(transaction.credits || 0)
        })
        .eq('id', transaction.freelancer_id);
      if (updateCreditsError) throw updateCreditsError;
      rollbackState.freelancerCreditUpdated = true;

      console.log('Complete gig updated freelancer credits:', {
        freelancer_id: transaction.freelancer_id,
        previous_credits: freelancer.credits,
        added_credits: transaction.credits
      });

      const { data: creditLedger, error: creditLedgerError } = await supabase
        .from('credits_ledger')
        .insert([{
          from_user: transaction.creator_id,
          to_user: transaction.freelancer_id,
          gig_id: id,
          amount: transaction.credits,
          type: 'earned'
        }])
        .select('id')
        .single();
      if (creditLedgerError) throw creditLedgerError;
      rollbackState.creditLedgerId = creditLedger.id;

      console.log('Complete gig inserted earned credits ledger entry:', {
        gig_id: id,
        ledger_id: creditLedger.id,
        from_user: transaction.creator_id,
        to_user: transaction.freelancer_id,
        amount: transaction.credits
      });
    } else if (transaction.type === 'paid') {
      console.log('Complete gig releasing paid wallet balance:', {
        gig_id: id,
        transaction_id: transaction.id,
        freelancer_id: transaction.freelancer_id,
        amount: transaction.amount
      });

      const { data: freelancer, error: freelancerError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', transaction.freelancer_id)
        .single();
      if (freelancerError) throw freelancerError;

      const currentBalance = Number(freelancer.wallet_balance || 0);
      rollbackState.originalWalletBalance = currentBalance;

      const { error: walletUpdateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: currentBalance + Number(transaction.amount || 0)
        })
        .eq('id', transaction.freelancer_id);
      if (walletUpdateError) throw walletUpdateError;
      rollbackState.freelancerWalletUpdated = true;

      console.log('Complete gig updated freelancer wallet balance:', {
        freelancer_id: transaction.freelancer_id,
        previous_wallet_balance: currentBalance,
        added_amount: transaction.amount
      });
    } else {
      console.error('Complete gig failed: unsupported transaction type', {
        gig_id: id,
        transaction_id: transaction.id,
        transaction_type: transaction.type
      });
      throw new Error('Unsupported transaction type');
    }

    try {
      const creatorFraudResult = await checkFraudRules(transaction.creator_id);
      if (creatorFraudResult.is_flagged) {
        console.warn('Fraud check flagged gig creator after completion:', {
          creator_id: transaction.creator_id,
          reasons: creatorFraudResult.reasons
        });
      }
    } catch (fraudError) {
      console.error('Fraud check failed for gig creator after completion:', fraudError.message);
    }

    try {
      const freelancerFraudResult = await checkFraudRules(transaction.freelancer_id);
      if (freelancerFraudResult.is_flagged) {
        console.warn('Fraud check flagged freelancer after completion:', {
          freelancer_id: transaction.freelancer_id,
          reasons: freelancerFraudResult.reasons
        });
      }
    } catch (fraudError) {
      console.error('Fraud check failed for freelancer after completion:', fraudError.message);
    }

    console.log('Complete gig updating transaction status to completed:', {
      transaction_id: transaction.id,
      gig_id: id
    });

    const { error: transactionUpdateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);
    if (transactionUpdateError) throw transactionUpdateError;
    rollbackState.transactionCompleted = true;

    console.log('Complete gig updating gig status to completed:', { gig_id: id });

    const { error: gigUpdateError } = await supabase
      .from('gigs')
      .update({ status: 'completed' })
      .eq('id', id);
    if (gigUpdateError) throw gigUpdateError;
    rollbackState.gigCompleted = true;

    try {
      const { data: freelancerProfile, error: freelancerProfileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', transaction.freelancer_id)
        .single();

      if (freelancerProfileError) throw freelancerProfileError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: freelancerProfile.user_id,
          type: 'gig_completed',
          title: 'Payment Released!',
          message: `Gig "${gig.title}" completed. Payment/credits released.`,
          link: `/gigs/${gig.id}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create gig completion notification:', notificationError);
    }

    console.log('Complete gig succeeded:', {
      gig_id: id,
      transaction_id: transaction.id,
      transaction_type: transaction.type,
      freelancer_id: transaction.freelancer_id
    });

    res.json({ success: true, message: 'Gig completed and payment/credits released' });
  } catch (error) {
    console.error('Complete gig error:', {
      message: error.message,
      stack: error.stack,
      rollbackState
    });

    try {
      console.warn('Complete gig rollback started:', rollbackState);

      if (rollbackState.gigCompleted && rollbackState.gigId) {
        await supabase
          .from('gigs')
          .update({ status: rollbackState.gigStatusBeforeUpdate || 'assigned' })
          .eq('id', rollbackState.gigId);
        console.warn('Complete gig rollback restored gig status:', {
          gig_id: rollbackState.gigId,
          status: rollbackState.gigStatusBeforeUpdate || 'assigned'
        });
      }

      if (rollbackState.transactionCompleted && rollbackState.transactionId) {
        await supabase
          .from('transactions')
          .update({
            status: rollbackState.transactionStatusBeforeUpdate || 'escrow',
            completed_at: null
          })
          .eq('id', rollbackState.transactionId);
        console.warn('Complete gig rollback restored transaction status:', {
          transaction_id: rollbackState.transactionId,
          status: rollbackState.transactionStatusBeforeUpdate || 'escrow'
        });
      }

      if (rollbackState.creditLedgerId) {
        await supabase
          .from('credits_ledger')
          .delete()
          .eq('id', rollbackState.creditLedgerId);
        console.warn('Complete gig rollback deleted credit ledger entry:', {
          ledger_id: rollbackState.creditLedgerId
        });
      }

      if (rollbackState.freelancerCreditUpdated && rollbackState.freelancerId) {
        await supabase
          .from('profiles')
          .update({ credits: rollbackState.originalFreelancerCredits })
          .eq('id', rollbackState.freelancerId);
        console.warn('Complete gig rollback restored freelancer credits:', {
          freelancer_id: rollbackState.freelancerId,
          credits: rollbackState.originalFreelancerCredits
        });
      }

      if (rollbackState.freelancerWalletUpdated && rollbackState.freelancerId) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: rollbackState.originalWalletBalance })
          .eq('id', rollbackState.freelancerId);
        console.warn('Complete gig rollback restored freelancer wallet balance:', {
          freelancer_id: rollbackState.freelancerId,
          wallet_balance: rollbackState.originalWalletBalance
        });
      }

      console.warn('Complete gig rollback finished:', rollbackState);
    } catch (rollbackError) {
      console.error('Complete gig rollback error:', rollbackError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to complete gig safely. No changes were finalized.'
    });
  }
};
