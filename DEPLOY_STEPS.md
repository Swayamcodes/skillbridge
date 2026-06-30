# SkillBridge Deploy Steps

Deploy in this order so each service can point to the next one.

## 1. Supabase

Keep your existing Supabase project ready first.

Needed values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 2. AI Service on Render

Root directory:

```text
skillbridge-ai
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
gunicorn app:app
```

Environment variables:

```env
BACKEND_URL=https://your-backend-service.onrender.com
```

After deploy, copy the AI service URL. It will look like:

```text
https://your-ai-service.onrender.com
```

## 3. Backend on Render

Root directory:

```text
skillbridge-backend
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
ML_SERVICE_URL=https://your-ai-service.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

Render sets `PORT` automatically.

After deploy, copy the backend URL. It will look like:

```text
https://your-backend-service.onrender.com
```

## 4. Frontend on Vercel

Root directory:

```text
skillbridge-frontend
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variables:

```env
VITE_API_URL=https://your-backend-service.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

After the Vercel deploy finishes, update these if needed:

```env
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend-service.onrender.com
```

`FRONTEND_URL` belongs in the backend Render service. `BACKEND_URL` belongs in the AI Render service.

## Quick Smoke Test

1. Open the Vercel frontend.
2. Sign up or log in.
3. Open dashboard and check that recommended gigs does not error.
4. Post a gig and confirm moderation does not error.
5. Apply to a gig.
6. Accept an applicant.
7. Open chat and send one message.
8. Complete the gig and submit a review.
