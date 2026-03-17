# SkillBridge - Campus Freelance & Skill Exchange Platform

## 📋 Project Overview

SkillBridge is a campus-exclusive, peer-to-peer freelance and skill exchange platform designed specifically for college students. It enables students to post gigs, apply for opportunities, and exchange skills using either real money (via Razorpay) or a credit-based barter system.

**Key Features:**
- 💰 Dual economy: Paid gigs (Razorpay) + Barter gigs (credits)
- 🎓 Campus-only access with email verification
- 🔒 Secure escrow system for payments and credits
- ⭐ Review and rating system
- 📊 Wallet and transaction history
- 🔍 Advanced search and filtering
- 🎨 Neo-brutalist UI design (black & white theme)

---

## 🛠️ Tech Stack

### **Frontend**
- **React.js** (Vite) - UI framework
- **JavaScript** - Programming language
- **Tailwind CSS** - Styling framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP requests

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase SDK** - Database client

### **Database & Services**
- **Supabase (PostgreSQL)** - Database, Auth, Storage, Realtime
- **pgvector** - Vector embeddings storage (for AI features)
- **Razorpay** - Payment gateway

### **Deployment**
- **Vercel** - Frontend hosting
- **Railway** - Backend hosting
- **Supabase Cloud** - Database hosting

---

## 📁 Project Structure

```
skillbridge/
├── skillbridge-frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Home.jsx (Dashboard)
│   │   │   ├── Profile.jsx
│   │   │   ├── PublicProfile.jsx
│   │   │   ├── Gigs.jsx
│   │   │   ├── PostGig.jsx
│   │   │   ├── GigDetail.jsx
│   │   │   ├── GigApplicants.jsx
│   │   │   ├── MyGigs.jsx
│   │   │   ├── MyApplications.jsx
│   │   │   └── Wallet.jsx
│   │   ├── context/         # React context (AuthContext)
│   │   ├── services/        # API services
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── .env                 # Environment variables
│   └── package.json
│
└── skillbridge-backend/
    ├── controllers/         # Business logic
    │   ├── authController.js
    │   ├── profileController.js
    │   ├── gigController.js
    │   ├── applicationController.js
    │   ├── paymentController.js
    │   ├── walletController.js
    │   └── reviewController.js
    ├── routes/              # API routes
    │   ├── auth.js
    │   ├── profile.js
    │   ├── gig.js
    │   ├── application.js
    │   ├── payment.js
    │   ├── wallet.js
    │   └── review.js
    ├── middleware/          # Express middleware
    │   └── authMiddleware.js
    ├── utils/               # Helper utilities
    │   └── supabase.js
    ├── server.js            # Express server
    ├── .env                 # Environment variables
    └── package.json
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd skillbridge
```

### **2. Frontend Setup**

```bash
cd skillbridge-frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### **3. Backend Setup**

```bash
cd skillbridge-backend
npm install
```

Create `.env` file:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### **4. Database Setup**

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema (provided in `database-schema.sql`)
3. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### **5. Run the Application**

**Terminal 1 (Backend):**
```bash
cd skillbridge-backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd skillbridge-frontend
npm run dev
```

Visit: `http://localhost:5173`

---

## 📊 Database Schema

### **Main Tables**

**profiles**
- User information, skills, credits, wallet balance, reputation score

**gigs**
- Posted opportunities (paid or barter)
- Includes title, description, type, price/credits, skills required, status

**applications**
- Student applications to gigs
- Status: pending, accepted, rejected

**transactions**
- Financial/credit transactions
- Tracks escrow and completion status

**reviews**
- Peer reviews with ratings (1-5 stars) and comments

**credits_ledger**
- Immutable log of all credit movements

**messages**
- Chat messages between users (for future implementation)

**notifications**
- System notifications (for future implementation)

---

## 🔐 Authentication Flow

1. User signs up with college email (e.g., `student@university.edu`)
2. Email verification (optional, can be disabled in Supabase)
3. Profile creation with skills and bio
4. JWT token stored in `localStorage`
5. Protected routes check for valid token

---

## 💳 Payment Flow (Paid Gigs)

1. Creator posts paid gig (e.g., ₹500)
2. Freelancer applies
3. Creator accepts → **Razorpay payment popup**
4. Payment processed → Money held in **escrow** (transaction status: `escrow`)
5. Work completed → Creator marks as complete
6. Money released to freelancer's **wallet**
7. Both parties leave reviews

**Test Cards (Razorpay Test Mode):**
- Success: `4111 1111 1111 1111`
- Failure: `4111 1111 1111 1112`

---

## 🪙 Credit Flow (Barter Gigs)

1. Creator posts barter gig (e.g., 50 credits)
2. Freelancer applies
3. Creator accepts → **Credits deducted** from creator (held in escrow)
4. Work completed → Creator marks as complete
5. Credits **released** to freelancer
6. Credits ledger updated

**Default Credits:** Every new user starts with 100 free credits

---

## 🎯 Key Features Explained

### **Dual Role System**
Every user can both:
- Post gigs (act as creator/buyer)
- Apply to gigs (act as freelancer/seller)
- No separate accounts needed

### **Escrow System**
- **Paid gigs:** Money held until work completion
- **Barter gigs:** Credits locked until work completion
- Prevents fraud and ensures fairness

### **Review System**
- Both creator and freelancer can review each other
- Ratings (1-5 stars) + written comments
- Calculates average rating and reputation score
- Prevents duplicate reviews

### **Search & Filter**
- Search by title, description, skills
- Filter by type (paid/barter)
- Filter by skill tags (clickable)
- Sort by: newest, oldest, price (high/low)

### **My Gigs Dashboard**
- Tab 1: Gigs I Posted (open/assigned/completed)
- Tab 2: Gigs Assigned to Me
- Quick action buttons (view, manage applicants)

---

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### **Profiles**
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update profile

### **Gigs**
- `POST /api/gigs` - Create gig
- `GET /api/gigs` - Get all open gigs
- `GET /api/gigs/:id` - Get gig by ID
- `GET /api/gigs/my-posted` - Get my posted gigs
- `GET /api/gigs/my-assigned` - Get gigs assigned to me
- `POST /api/gigs/:id/apply` - Apply to gig
- `GET /api/gigs/:id/applicants` - Get gig applicants
- `PUT /api/gigs/:id/complete` - Mark gig as complete

### **Applications**
- `GET /api/applications/my-applications` - Get my applications
- `PUT /api/applications/:id/accept` - Accept application
- `PUT /api/applications/:id/reject` - Reject application

### **Payments**
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

### **Wallet**
- `GET /api/wallet/transactions` - Get payment history
- `GET /api/wallet/credits-history` - Get credit history

### **Reviews**
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews

---

## 🎨 Design System

### **Neo-Brutalism Theme**
- **Colors:** Black (`#000000`) and White (`#FFFFFF`)
- **Borders:** Thick 3-4px black borders
- **Shadows:** Offset shadows (4px down, 4px right)
- **Typography:** Bold, geometric fonts
- **Corners:** Sharp edges (no rounded corners)

### **Tailwind Classes Used**
- `border-3` / `border-4` - Thick borders
- `shadow-brutal` - Custom offset shadow
- `font-bold` - Bold text throughout
- `hover:bg-black hover:text-white` - Inverted hover states

---

## 🧪 Testing Guide

### **Manual Testing Checklist**

**User Flow 1: Paid Gig**
1. Sign up as User A
2. Complete profile with skills
3. Post paid gig (₹500)
4. Sign up as User B
5. Apply to gig
6. Login as User A → Accept application
7. Enter test card details in Razorpay popup
8. Mark gig as complete
9. Check User B's wallet balance increased
10. Both users leave reviews

**User Flow 2: Barter Gig**
1. User A posts barter gig (50 credits)
2. User B applies
3. User A accepts → Check User A credits reduced to 50
4. User A marks complete → Check User B credits increased to 150
5. Both leave reviews

**Edge Cases to Test**
- Cannot apply to own gig
- Cannot review same gig twice
- Cannot accept applicant without sufficient credits (barter)
- Gig status changes correctly (open → assigned → completed)
- Search and filters work together

---

## 🚀 Deployment

### **Frontend (Vercel)**
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### **Backend (Railway)**
1. Push code to GitHub
2. Create new Railway project
3. Connect GitHub repository
4. Add environment variables
5. Deploy

### **Database (Supabase)**
- Already cloud-hosted
- Update connection strings in `.env` files

---

## 📝 Environment Variables Reference

### **Frontend (.env)**
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### **Backend (.env)**
```env
PORT=5000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (use service_role key)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

---

## 🐛 Common Issues & Solutions

**Issue: "email rate limit exceeded"**
- Solution: Disable email confirmation in Supabase Auth settings

**Issue: CORS errors**
- Solution: Check `cors()` middleware in `server.js`

**Issue: Payment popup not opening**
- Solution: Check Razorpay script loaded, check API keys in `.env`

**Issue: Reviews not saving**
- Solution: Check RLS policies on `reviews` table

**Issue: Credits not deducting**
- Solution: Check `acceptApplication` function in `applicationController.js`

---

## 📚 Future Enhancements (Not Implemented)

- **AI Skill Matching:** OpenAI embeddings for semantic gig matching
- **Real-time Chat:** Supabase Realtime for messaging
- **Notifications:** In-app notification system
- **Gamification:** Points and badges for achievements
- **Buy Credits:** Purchase credits with Razorpay
- **Admin Dashboard:** Manage users, resolve disputes
- **Mobile App:** React Native version

---

## 👥 Contributors

- [Your Name] - Full Stack Developer

---

## 📄 License

This project is developed as a final year academic project.

---

## 📧 Contact

For queries or support, contact: shindeswayam2004@gmail.com

---

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Razorpay for payment gateway
- Tailwind CSS for styling framework
- React.js and Node.js communities

---

**Built with ❤️ for students, by students**
