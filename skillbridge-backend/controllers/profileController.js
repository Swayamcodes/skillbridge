const supabase = require('../utils/supabase');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, profile: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { skills, bio, year } = req.body;

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