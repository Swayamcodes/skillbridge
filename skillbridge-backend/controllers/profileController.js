import supabase from '../utils/supabase.js';

const allowedAvailabilityStatuses = ['available', 'busy', 'unavailable'];
const allowedSocialKeys = ['linkedin', 'github', 'instagram'];

const isValidPortfolioLinks = (links) => (
  Array.isArray(links)
  && links.every((link) => (
    link
    && typeof link === 'object'
    && typeof link.title === 'string'
    && typeof link.url === 'string'
  ))
);

const isValidSocialLinks = (links) => (
  links
  && typeof links === 'object'
  && !Array.isArray(links)
  && Object.keys(links).every((key) => (
    allowedSocialKeys.includes(key)
    && (links[key] === '' || typeof links[key] === 'string')
  ))
);

const getRequesterProfile = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) return null;

  const { data: requesterProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  return requesterProfile;
};

const canViewPhoneNumber = async (requesterProfile, targetProfileId) => {
  if (!requesterProfile) return false;
  if (requesterProfile.id === targetProfileId) return true;

  const { data: activeGig, error } = await supabase
    .from('gigs')
    .select('id')
    .eq('status', 'assigned')
    .or(`and(creator_id.eq.${requesterProfile.id},assigned_to.eq.${targetProfileId}),and(creator_id.eq.${targetProfileId},assigned_to.eq.${requesterProfile.id})`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(activeGig);
};

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        college,
        year,
        bio,
        skills,
        reputation_score,
        avatar_url,
        credits,
        wallet_balance,
        created_at,
        availability_status,
        category,
        portfolio_links,
        social_links,
        phone_number
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const requesterProfile = await getRequesterProfile(req);
    const showPhoneNumber = await canViewPhoneNumber(requesterProfile, data.id);
    const profile = {
      ...data,
      phone_number: showPhoneNumber ? data.phone_number : null
    };

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      skills,
      bio,
      year,
      availability_status,
      category,
      portfolio_links,
      social_links,
      phone_number
    } = req.body;

    if (availability_status && !allowedAvailabilityStatuses.includes(availability_status)) {
      return res.status(400).json({ success: false, message: 'Invalid availability status' });
    }

    if (portfolio_links !== undefined && !isValidPortfolioLinks(portfolio_links)) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio links must be an array of { title, url } objects'
      });
    }

    if (social_links !== undefined && !isValidSocialLinks(social_links)) {
      return res.status(400).json({
        success: false,
        message: 'Social links must contain only linkedin, github, and instagram URL fields'
      });
    }

    if (phone_number && !/^[0-9]{7,15}$/.test(phone_number)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Enforce ownership so authenticated users can only edit their own profile.
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (profileError) throw profileError;
    if (!existingProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (existingProfile.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        skills,
        bio,
        year,
        availability_status,
        category,
        portfolio_links,
        social_links,
        phone_number
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, profile: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const db = req.supabase || supabase;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    if (!file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' });
    }

    const extension = file.originalname?.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${req.user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = db.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await db
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', req.user.id);

    if (updateError) throw updateError;

    res.json({ success: true, avatar_url: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
