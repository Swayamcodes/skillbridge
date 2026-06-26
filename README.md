# SkillBridge Quick Run Guide

This project has 4 main folders:

- `skillbridge-frontend` - React + Vite frontend
- `skillbridge-backend` - Node.js + Express backend
- `skillbridge-ai` - Flask AI service
- `database` - SQL files for database setup/updates

## 1. Frontend

Open a terminal in `skillbridge-frontend` and run:

```powershell
cd skillbridge-frontend
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

If needed, create/update env values for the frontend:

```env
VITE_API_URL=http://localhost:5000
```

## 2. Backend

Open a terminal in `skillbridge-backend` and run:

```powershell
cd skillbridge-backend
npm install
npm run dev
```

Or for normal start:

```powershell
npm start
```

Default local URL: `http://localhost:5000`

Backend uses `.env`. Make sure these values exist:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## 3. AI Service

Open a terminal in `skillbridge-ai` and run:

```powershell
cd skillbridge-ai
Remove-Item -Recurse -Force venv
py -3.11 -m venv venv
.\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Default local URL: `http://localhost:5001`

Health check:

```powershell
Invoke-WebRequest http://localhost:5001/health
```

## 4. Database

The `database` folder contains SQL files. Run them in your Supabase SQL editor or PostgreSQL client:

```text
database/notifications_user_fk.sql
database/notifications_rls.sql
database/applications_acceptance_rls.sql
```

## 5. Recommended Terminal Setup

Use 3 terminals at the same time:

```powershell
Terminal 1:
cd skillbridge-backend
npm run dev
```

```powershell
Terminal 2:
cd skillbridge-ai
venv\Scripts\activate
python app.py
```

```powershell
Terminal 3:
cd skillbridge-frontend
npm run dev
```

## 6. Run Order

Start in this order:

1. `skillbridge-backend`
2. `skillbridge-ai`
3. `skillbridge-frontend`

Then open the frontend in your browser.
