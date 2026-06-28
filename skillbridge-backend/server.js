import 'dotenv/config';


console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import gigRoutes from './routes/gig.js';
import applicationRoutes from './routes/application.js';
import paymentRoutes from './routes/payment.js';
import walletRoutes from './routes/wallet.js';
import reviewRoutes from './routes/review.js';
import mlRoutes from './routes/ml.js';
import statsRoutes from './routes/stats.js';
import notificationRoutes from './routes/notification.js';
import chatRoutes from './routes/chat.js';



const app = express();



app.use(cors());
app.use(express.json());

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
app.use('/api/ml', mlRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
