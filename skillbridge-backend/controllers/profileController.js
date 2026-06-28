import supabase from '../utils/supabase.js';

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, college, year, bio, skills, reputation_score, avatar_url, credits')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, profile: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { skills, bio, year } = req.body;

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
        year
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
