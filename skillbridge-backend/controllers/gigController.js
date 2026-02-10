exports.applyToGig = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Get applicant profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Check if gig exists and is open
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

    // Check if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', profile.id)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this gig' });
    }

    // Create application
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