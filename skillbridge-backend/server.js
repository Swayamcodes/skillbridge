const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const supabase = require('./utils/supabase');

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const gigRoutes = require('./routes/gig');

app.get('/', (req, res) => {
  res.json({ message: 'SkillBridge API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/gigs', gigRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// test route
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    res.json({ success: true, message: 'Database connected!', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});