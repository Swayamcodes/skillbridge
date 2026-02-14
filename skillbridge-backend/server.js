const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();



app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const gigRoutes = require('./routes/gig');
const applicationRoutes = require('./routes/application');
const paymentRoutes = require('./routes/payment');
const walletRoutes = require('./routes/wallet');
const reviewRoutes = require('./routes/review');

app.get('/', (req, res) => {
  res.json({ message: 'SkillBridge API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reviews', reviewRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});