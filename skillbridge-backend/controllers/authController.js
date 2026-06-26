import supabase from '../utils/supabase.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const isEmailVerified = (user) => Boolean(user?.email_confirmed_at || user?.confirmed_at);

// Signup
export const signup = async (req, res) => {
  try {
    const { email, password, fullName, college } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    if (!strongPasswordPattern.test(password || '')) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (authError) throw authError;

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: authData.user.id,
        email: normalizedEmail,
        full_name: fullName,
        college: college,
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email before signing in.',
      user: authData.user,
      profile: profileData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) throw error;

    if (!isEmailVerified(data.user)) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before signing in'
      });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    res.json({
      success: true,
      message: 'Login successful',
      session: data.session,
      user: data.user,
      profile: profile
    });

  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Revoke the caller's active auth token on the auth server.
    const { error } = await supabase.auth.admin.signOut(token);
    if (error) throw error;

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({
      success: true,
      user: user,
      profile: profile
    });

  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};
