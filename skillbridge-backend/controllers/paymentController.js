import Razorpay from 'razorpay';
import supabase from '../utils/supabase.js';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const { gigId } = req.body;
    const userId = req.user.id;

    // Get gig details
    const { data: gig } = await supabase
      .from('gigs')
      .select('*, creator:profiles!gigs_creator_id_fkey(user_id)')
      .eq('id', gigId)
      .single();

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This is not a paid gig' });
    }

    // Check if user is the creator
    if (gig.creator.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only gig creator can make payment' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(gig.price * 100), // Convert to paise
      currency: 'INR',
      receipt: `gig_${Date.now()}`,
      notes: {
        gigId: gigId,
        creatorId: gig.creator_id,
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const rollbackState = {
    gigId: null,
    applicationId: null,
    transactionId: null,
    applicationAccepted: false,
    gigAssigned: false,
    rejectedOtherApplications: false
  };

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      gigId,
      applicationId 
    } = req.body;
    const userId = req.user.id;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;
    if (!currentProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Load the Razorpay order so we can verify the amount server-side.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // Get gig and application details
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    if (gigError) throw gigError;
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Only the gig owner can finalize payment for an applicant.
    if (gig.creator_id !== currentProfile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify payment for this gig' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    if (gig.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This gig is not a paid gig' });
    }

    const expectedAmount = Math.round(gig.price * 100);
    if (order.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Order amount does not match gig price' });
    }

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (applicationError) throw applicationError;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig_id !== gigId) {
      return res.status(400).json({ success: false, message: 'Application does not belong to this gig' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application is no longer pending' });
    }

    rollbackState.gigId = gigId;
    rollbackState.applicationId = applicationId;

    // Create transaction with payment details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([{
        gig_id: gigId,
        creator_id: gig.creator_id,
        freelancer_id: application.applicant_id,
        type: 'paid',
        amount: gig.price,
        payment_id: razorpay_payment_id,
        status: 'escrow',
      }])
      .select()
      .single();

    if (txError) throw txError;
    rollbackState.transactionId = transaction.id;

    // Update application status
    const { error: applicationUpdateError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId);
    if (applicationUpdateError) throw applicationUpdateError;
    rollbackState.applicationAccepted = true;

    // Update gig status
    const { error: gigUpdateError } = await supabase
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', gigId);
    if (gigUpdateError) throw gigUpdateError;
    rollbackState.gigAssigned = true;

    // Reject other applications
    const { error: rejectOthersError } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', gigId)
      .neq('id', applicationId);
    if (rejectOthersError) throw rejectOthersError;
    rollbackState.rejectedOtherApplications = true;

    res.json({
      success: true,
      message: 'Payment successful and gig assigned',
      transaction
    });
  } catch (error) {
    console.error('Verification error:', error);

    try {
      if (rollbackState.rejectedOtherApplications && rollbackState.gigId) {
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
    } catch (rollbackError) {
      console.error('Payment verification rollback error:', rollbackError);
    }

    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};
