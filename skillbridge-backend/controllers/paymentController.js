import Razorpay from 'razorpay';
import supabase from '../utils/supabase.js';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  const db = req.supabase || supabase;

  try {
    const { gigId, applicationId } = req.body;
    const userId = req.user.id;

    if (!gigId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Gig and application are required'
      });
    }

    // Get gig details
    const { data: gig, error: gigError } = await db
      .from('gigs')
      .select('*, creator:profiles!gigs_creator_id_fkey(user_id)')
      .eq('id', gigId)
      .maybeSingle();

    if (gigError) throw gigError;
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

    if (gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('id, gig_id, applicant_id, status')
      .eq('id', applicationId)
      .maybeSingle();

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

    const { data: existingTransactions, error: existingTransactionError } = await db
      .from('transactions')
      .select('id')
      .eq('gig_id', gigId)
      .in('status', ['escrow', 'completed'])
      .limit(1);

    if (existingTransactionError) throw existingTransactionError;
    if (existingTransactions?.length > 0) {
      return res.status(400).json({ success: false, message: 'Gig already has an active transaction' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(gig.price * 100), // Convert to paise
      currency: 'INR',
      receipt: `gig_${Date.now()}`,
      notes: {
        gigId: gigId,
        applicationId: applicationId,
        creatorId: gig.creator_id,
        freelancerId: application.applicant_id
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
  const db = req.supabase || supabase;
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
    const traceId = `${applicationId}-${razorpay_payment_id}`;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const { data: currentProfile, error: profileError } = await db
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
    const { data: gig, error: gigError } = await db
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

    if (gig.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This gig is not a paid gig' });
    }

    const expectedAmount = Math.round(gig.price * 100);
    if (order.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Order amount does not match gig price' });
    }

    if (
      String(order.notes?.gigId) !== String(gigId) ||
      String(order.notes?.applicationId) !== String(applicationId)
    ) {
      return res.status(400).json({ success: false, message: 'Payment order does not match this application' });
    }

    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();

    if (applicationError) throw applicationError;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig_id !== gigId) {
      return res.status(400).json({ success: false, message: 'Application does not belong to this gig' });
    }

    console.log('Paid acceptance fetched:', {
      trace_id: traceId,
      application_id: application.id,
      application_status: application.status,
      gig_id: gig.id,
      gig_status: gig.status,
      applicant_id: application.applicant_id,
      payment_id: razorpay_payment_id
    });

    if (application.status !== 'pending') {
      if (application.status === 'accepted') {
        const { data: existingTransaction, error: existingTransactionError } = await db
          .from('transactions')
          .select('*')
          .eq('gig_id', gigId)
          .eq('freelancer_id', application.applicant_id)
          .eq('payment_id', razorpay_payment_id)
          .maybeSingle();

        if (existingTransactionError) throw existingTransactionError;

        if (existingTransaction) {
          console.log('Paid acceptance idempotent success:', {
            trace_id: traceId,
            application_id: application.id,
            transaction_id: existingTransaction.id
          });
          return res.json({
            success: true,
            message: 'Payment was already verified and application accepted',
            transaction: existingTransaction,
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

    if (gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Gig is no longer open' });
    }

    rollbackState.gigId = gigId;
    rollbackState.applicationId = applicationId;

    console.log('Paid acceptance before claim:', {
      trace_id: traceId,
      application_id: applicationId,
      expected_status: 'pending'
    });

    const { data: claimedApplication, error: applicationUpdateError } = await db
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (applicationUpdateError) throw applicationUpdateError;
    if (!claimedApplication) {
      const { data: latestApplication, error: latestApplicationError } = await db
        .from('applications')
        .select('id, status')
        .eq('id', applicationId)
        .maybeSingle();

      if (latestApplicationError) throw latestApplicationError;

      console.warn('Paid acceptance claim missed:', {
        trace_id: traceId,
        application_id: applicationId,
        fetched_status: application.status,
        latest_status: latestApplication?.status
      });

      return res.status(409).json({
        success: false,
        message: 'Application acceptance is already being processed. Please refresh.'
      });
    }
    rollbackState.applicationAccepted = true;

    console.log('Paid acceptance after claim:', {
      trace_id: traceId,
      application_id: applicationId,
      application_status: 'accepted'
    });

    const { data: assignedGig, error: gigUpdateError } = await db
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', gigId)
      .eq('status', 'open')
      .select('id')
      .maybeSingle();
    if (gigUpdateError) throw gigUpdateError;
    if (!assignedGig) throw new Error('Gig is no longer open');
    rollbackState.gigAssigned = true;

    const { data: existingTransactions, error: existingTransactionError } = await db
      .from('transactions')
      .select('id')
      .eq('gig_id', gigId)
      .in('status', ['escrow', 'completed'])
      .limit(1);

    if (existingTransactionError) throw existingTransactionError;
    if (existingTransactions?.length > 0) {
      throw new Error('Gig already has an active transaction');
    }

    // Create transaction with payment details
    const { data: transaction, error: txError } = await db
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

    // Reject other applications
    const { error: rejectOthersError } = await db
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', gigId)
      .eq('status', 'pending')
      .neq('id', applicationId);
    if (rejectOthersError) throw rejectOthersError;
    rollbackState.rejectedOtherApplications = true;

    console.log('Paid acceptance completed:', {
      trace_id: traceId,
      application_id: applicationId,
      gig_id: gigId,
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
          message: `You've been accepted for "${gig.title}"`,
          link: `/gigs/${gig.id}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create paid application accepted notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Payment successful and gig assigned',
      transaction
    });
  } catch (error) {
    console.error('Verification error:', error);

    try {
      if (rollbackState.rejectedOtherApplications && rollbackState.gigId) {
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
    } catch (rollbackError) {
      console.error('Payment verification rollback error:', rollbackError);
    }

    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};
