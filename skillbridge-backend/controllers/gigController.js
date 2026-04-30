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
      .single();

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

    rollbackState.transactionId = transaction.id;
    rollbackState.gigId = id;
    rollbackState.freelancerId = transaction.freelancer_id;

    // Release payment/credits
    if (transaction.type === 'barter') {
      // Add credits to freelancer
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
          credits: freelancer.credits + transaction.credits
        })
        .eq('id', transaction.freelancer_id);
      if (updateCreditsError) throw updateCreditsError;
      rollbackState.freelancerCreditUpdated = true;

      // Log credit transaction
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
    } else {
      // For paid gigs, add to freelancer's wallet balance
      const { data: freelancer, error: freelancerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', transaction.freelancer_id)
        .single();
      if (freelancerError) throw freelancerError;

      // Add wallet_balance column value (we'll create this column)
      const currentBalance = freelancer.wallet_balance || 0;
      rollbackState.originalWalletBalance = currentBalance;
      
      const { error: walletUpdateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: currentBalance + transaction.amount
        })
        .eq('id', transaction.freelancer_id);
      if (walletUpdateError) throw walletUpdateError;
      rollbackState.freelancerWalletUpdated = true;
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

    // Update transaction status
    const { error: transactionUpdateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);
    if (transactionUpdateError) throw transactionUpdateError;
    rollbackState.transactionCompleted = true;

    // Update gig status
    const { error: gigUpdateError } = await supabase
      .from('gigs')
      .update({ status: 'completed' })
      .eq('id', id);
    if (gigUpdateError) throw gigUpdateError;
    rollbackState.gigCompleted = true;

    res.json({ success: true, message: 'Gig completed successfully' });
  } catch (error) {
    console.error('Complete gig error:', error);

    try {
      if (rollbackState.gigCompleted && rollbackState.gigId) {
        await supabase
          .from('gigs')
          .update({ status: 'assigned' })
          .eq('id', rollbackState.gigId);
      }

      if (rollbackState.transactionCompleted && rollbackState.transactionId) {
        await supabase
          .from('transactions')
          .update({ status: 'escrow', completed_at: null })
          .eq('id', rollbackState.transactionId);
      }

      if (rollbackState.creditLedgerId) {
        await supabase
          .from('credits_ledger')
          .delete()
          .eq('id', rollbackState.creditLedgerId);
      }

      if (rollbackState.freelancerCreditUpdated && rollbackState.freelancerId) {
        await supabase
          .from('profiles')
          .update({ credits: rollbackState.originalFreelancerCredits })
          .eq('id', rollbackState.freelancerId);
      }

      if (rollbackState.freelancerWalletUpdated && rollbackState.freelancerId) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: rollbackState.originalWalletBalance })
          .eq('id', rollbackState.freelancerId);
      }
    } catch (rollbackError) {
      console.error('Complete gig rollback error:', rollbackError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to complete gig safely. No changes were finalized.'
    });
  }
};
