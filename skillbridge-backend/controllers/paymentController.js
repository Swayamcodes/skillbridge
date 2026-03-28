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
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      gigId,
      applicationId 
    } = req.body;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Get gig and application details
    const { data: gig } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

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

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId);

    // Update gig status
    await supabase
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', gigId);

    // Reject other applications
    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', gigId)
      .neq('id', applicationId);

    res.json({
      success: true,
      message: 'Payment successful and gig assigned',
      transaction
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
