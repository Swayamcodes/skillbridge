import supabase from '../utils/supabase.js';

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, college, year, bio, skills, reputation_score, avatar_url')
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
