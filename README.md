# SkillBridge

SkillBridge is a campus-focused freelancing and skill-exchange platform where students can post work, apply to gigs, collaborate through chat, pay with either money or barter credits, and build reputation through completed work and reviews. In plain terms, it works like a trusted student marketplace: a student who needs help posts a gig, other students apply, the creator accepts one applicant, the platform tracks the gig through escrow and completion, and AI features help recommend relevant gigs, block inappropriate content, flag suspicious credit behavior, and calculate reputation.

## 1. Project Purpose

The purpose of SkillBridge is to help students discover trustworthy peer-to-peer work opportunities inside a college-style community. It combines a gig marketplace, profile portfolios, applications, payments, barter credits, chat, notifications, reviews, and AI-assisted safety/recommendation features into one full-stack application. For a non-technical evaluator, the key idea is simple: SkillBridge connects students who need tasks done with students who have the skills to do them. For a technical evaluator, the project demonstrates a React frontend, Express API, Supabase database/auth/storage, Razorpay payment integration, and a separate Flask AI microservice.

## 2. Architecture Diagram

```text
User Browser
    |
    v
Frontend: React + Vite + Tailwind
Deployed on Vercel
    |
    | HTTPS API calls with Supabase JWT in Authorization header
    v
Backend: Express.js API
Deployed on Railway
    |
    | Supabase client queries, writes, auth checks, storage uploads
    v
Database/Auth/Storage: Supabase
Postgres tables, Supabase Auth users, avatar storage, RLS policies
    ^
    |
    | Backend calls AI endpoints for recommendations/moderation
    v
AI Service: Flask + scikit-learn + better-profanity
Deployed on Railway
```

Requested simplified view:

```text
Frontend (React/Vercel) <-> Backend (Express/Railway) <-> Database (Supabase)
                                      <->
                              AI Service (Flask/Railway)
```

### What Each Part Does

- Frontend: Shows the user interface, route protection, dashboard, profiles, gig pages, wallet, chat, reviews, and notifications.
- Backend: Owns business rules such as signup, gig creation, accepting applications, payment verification, credit transfers, fraud checks, reputation updates, and API security.
- Supabase: Stores persistent data, manages auth users, stores avatars, and enforces Row Level Security for protected tables.
- AI service: Runs lightweight machine-learning and text-safety logic separately from the main backend.

## 3. How Each AI Feature Actually Works

### A. Skill Matching

Plain English:

Skill matching compares a student's listed skills against open gig titles, descriptions, and required skills. It gives higher scores to gigs whose wording is more similar to the student's skills, then returns the best matches for the dashboard recommendation section.

Step by step:

1. The logged-in user opens the dashboard.
2. The frontend calls `GET /api/ml/recommended`.
3. The Express backend loads the current user's profile from the `profiles` table.
4. It reads `profile.skills`, for example `["React", "UI design", "Node.js"]`.
5. The backend loads all open gigs from the `gigs` table with `status = 'open'`.
6. For each gig, the backend sends this data to the Flask AI service:
   - `user_skills`: the current user's skill list.
   - `open_gigs`: gig `id`, `title`, `description`, and `skills_required`.
7. The Flask service combines the user skills into one text string.
8. For each gig, the Flask service combines the title, description, and required skills into one text string.
9. `TfidfVectorizer` converts those text strings into TF-IDF vectors. This gives more weight to meaningful terms and less weight to common words.
10. `cosine_similarity` compares the user's vector with each gig vector.
11. The service sorts gigs by similarity score from highest to lowest.
12. It returns at most 10 recommendations.
13. The backend hydrates those IDs back into full gig records from Supabase.
14. The frontend displays them in the dashboard AI recommendations area.

Technical detail:

- AI route: `POST /api/ml/recommend` in `skillbridge-ai/app.py`.
- Backend route: `GET /api/ml/recommended` in `skillbridge-backend/routes/ml.js`.
- Algorithm: `TfidfVectorizer -> cosine_similarity`.
- Output shape from AI service:

```json
{
  "recommendations": [
    {
      "gig_id": "uuid-or-id",
      "match_score": 0.5342,
      "title": "Build a landing page"
    }
  ]
}
```

- UI location: the authenticated dashboard at `/dashboard`, implemented in `skillbridge-frontend/src/pages/Home.jsx`.
- The frontend filters out meaningless zero-score recommendations so users do not see `0%` matches.

### B. Content Moderation

Plain English:

Content moderation checks user-written text before it is saved. If the text contains profanity, the request is rejected and the user is told the content is inappropriate.

What triggers it:

- Posting a gig: the backend checks the gig title and description.
- Applying to a gig: the backend checks the application message.
- Sending a chat message: the backend checks the chat content.

Step by step:

1. A user submits gig text, an application message, or a chat message.
2. The Express backend sends the text to the Flask endpoint `POST /api/moderate`.
3. The AI service calls `better-profanity`.
4. `better-profanity` checks whether the text contains words from its profanity list.
5. It also returns a censored version of the text and a list of flagged words.
6. If the text is safe, the backend continues with the normal insert.
7. If the text is flagged, the backend returns `400 Bad Request` and does not save the content.

Technical detail:

- AI route: `POST /api/moderate`.
- AI module: `skillbridge-ai/moderation.py`.
- Library: `better-profanity`.
- Return fields:
  - `is_safe`: `true` or `false`.
  - `cleaned_text`: censored version of the text.
  - `flagged_words`: unique flagged words found in the submitted text.
- Backend behavior:
  - Gig title/description flagged: returns `Content contains inappropriate language`.
  - Application message flagged: returns `Application message contains inappropriate language`.
  - Chat message flagged: returns `Message contains inappropriate content`.
- Current fail-open behavior: if the moderation service is unavailable, the backend logs the failure and allows the request. This keeps the app usable during AI service downtime, but it means production safety depends on keeping the AI service healthy.

### C. Fraud Detection

Plain English:

Fraud detection watches for suspicious barter-credit behavior. It does not use a black-box model; it uses explicit rules that are easy to explain during evaluation.

Exact rules:

1. `credits_earned_gt_5x_spent`
   - The system totals credits a profile has earned from `credits_ledger` entries where:
     - `to_user = profile_id`
     - `type = 'earned'`
   - It totals credits spent where:
     - `from_user = profile_id`
     - `type = 'spent'`
   - If `creditsEarned > 5 * creditsSpent`, the user is flagged.

2. `new_account_large_transaction`
   - The system calculates account age in days from `profiles.created_at`.
   - It looks at the most recent credit ledger transaction amount.
   - If `accountAge < 7` and `latestTransactionAmount > 200`, the user is flagged.

When the rules run:

- After a barter gig application is accepted and credits are deducted from the creator.
- After a gig is completed, the backend checks both the creator and the freelancer.

Where flagged data goes:

- Table: `fraud_alerts`.
- Inserted fields:
  - `user_id`: the profile ID that triggered the rule.
  - `alert_type`: currently `rule_triggered`.
  - `details`: JSON containing the rule name and values that triggered it.

Technical detail:

- Controller: `skillbridge-backend/controllers/fraudController.js`.
- Main function: `checkFraudRules(userId)`.
- Data source: `profiles` and `credits_ledger`.
- Output if flagged:

```json
{
  "is_flagged": true,
  "reasons": [
    {
      "rule": "new_account_large_transaction",
      "values": {
        "account_age": 2,
        "latest_transaction": 250
      }
    }
  ]
}
```

### D. Reputation Scoring

Plain English:

Reputation is a numeric score based on two ideas: how many gigs a person has completed and how well others rated them. More completed work increases the score, and better average reviews increase it too.

Exact formula:

```text
reputation_score = (completed_gigs * 10) + (average_rating * 20)
```

Where:

- `completed_gigs` is the count of completed `transactions` where the profile was either the creator or freelancer.
- `average_rating` is the average of all `reviews.rating` rows where `reviewee_id = profile_id`.
- If there are no reviews, `average_rating = 0`.

Examples:

- 0 completed gigs, no reviews: `(0 * 10) + (0 * 20) = 0`.
- 3 completed gigs, 4.5 average rating: `(3 * 10) + (4.5 * 20) = 120`.
- 10 completed gigs, 5.0 average rating: `(10 * 10) + (5 * 20) = 200`.

When it recalculates:

- After a gig is marked completed, for both the creator and freelancer.
- After a new review is created, for the reviewee.
- It can also be recalculated manually using backend scripts.

Technical detail:

- Utility: `skillbridge-backend/utils/reputation.js`.
- Formula function: `calculateReputationScore`.
- Update function: `updateReputationScore(profileId)`.
- Script support:
  - `skillbridge-backend/scripts/recalculate_reputation_scores.js`
  - `skillbridge-backend/scripts/verify_reputation_scores.js`

## 4. Complete User Flow

1. A visitor lands on `/`, the public landing page.
2. The visitor signs up at `/signup` using email, password, full name, and college.
3. The backend creates a Supabase Auth user.
4. The backend creates a matching row in `profiles`.
5. The user logs in at `/login`.
6. The frontend stores the Supabase session token in local storage.
7. Authenticated API calls include `Authorization: Bearer <token>`.
8. The user completes or edits their profile at `/profile/setup` or `/profile/edit`.
9. The user adds skills, bio, year, availability, category, portfolio links, social links, phone number, and optionally an avatar.
10. Another user can view the public portfolio profile at `/profile/:id`.
11. A user posts a gig at `/gigs/post`.
12. The backend checks the title and description with content moderation.
13. If safe, the backend inserts the gig into `gigs` with `status = 'open'`.
14. Other users browse open gigs at `/gigs`.
15. A user opens a gig detail page at `/gigs/:id`.
16. The user applies with an application message.
17. The backend moderates the application message.
18. If safe, the backend inserts a row into `applications` with `status = 'pending'`.
19. The gig creator views applicants at `/gigs/:id/applicants`.
20. If the gig is barter-based, the creator can accept an applicant directly.
21. When a barter application is accepted:
    - The application changes from `pending` to `accepted`.
    - Creator credits are deducted using a compare-and-swap update.
    - A `credits_ledger` row is inserted with `type = 'spent'`.
    - A `transactions` row is created with `status = 'escrow'`.
    - The gig changes to `status = 'assigned'`.
    - Other pending applications are rejected.
    - Fraud checks may run.
22. If the gig is paid, the creator first creates a Razorpay order.
23. After payment, the backend verifies the Razorpay signature and order details.
24. If payment is valid:
    - The application is accepted.
    - The gig is assigned.
    - A paid `transactions` row is created with `status = 'escrow'`.
    - Other applications are rejected.
25. Once a gig is assigned, the creator and freelancer can chat at `/messages`.
26. Chat messages are moderated before insertion into `messages`.
27. Supabase Realtime can deliver new message inserts to the frontend.
28. When work is finished, the creator marks the gig complete.
29. The backend verifies the requester is the creator and the gig is assigned.
30. For barter gigs:
    - Credits are released to the freelancer.
    - A `credits_ledger` row is inserted with `type = 'earned'`.
31. For paid gigs:
    - The freelancer's `wallet_balance` is increased.
32. The transaction changes to `status = 'completed'`.
33. The gig changes to `status = 'completed'`.
34. Fraud checks run again.
35. Reputation scores recalculate for both parties.
36. Each party can leave a review.
37. Creating a review updates the reviewee's reputation score.
38. Notifications are created for important events such as applications, acceptance, completion, messages, and reviews.
39. The wallet page shows paid transaction history and barter-credit history.
40. The dashboard shows personal stats and AI-recommended gigs.

## 5. Database Schema

The project uses Supabase Postgres. Supabase Auth also maintains `auth.users`; application-specific user data lives in `profiles`.

### `profiles`

Stores public and private profile information for each authenticated user.

Columns used by the application:

- `id`: primary key, profile ID used throughout app relationships.
- `user_id`: foreign key to `auth.users.id`.
- `email`: user's email.
- `full_name`: display name.
- `college`: college or institution.
- `year`: academic year.
- `bio`: profile description.
- `skills`: array of user skills.
- `reputation_score`: calculated score.
- `avatar_url`: public avatar image URL from Supabase Storage.
- `credits`: barter credit balance.
- `wallet_balance`: money earned from paid gigs.
- `created_at`: profile creation timestamp.
- `availability_status`: `available`, `busy`, or `unavailable`.
- `category`: freelancer/service category.
- `portfolio_links`: JSON array of `{ title, url }`.
- `social_links`: JSON object with `linkedin`, `github`, and `instagram`.
- `phone_number`: only shown to self or active gig counterparties.

Relationships:

- `profiles.user_id -> auth.users.id`.
- Referenced by gigs, applications, transactions, reviews, messages, and credit ledger entries.

### `gigs`

Stores posted work opportunities.

Columns used by the application:

- `id`: primary key.
- `creator_id`: profile ID of the user who posted the gig.
- `title`: gig title.
- `description`: gig details.
- `type`: `paid` or `barter`.
- `price`: money amount for paid gigs.
- `credits`: credit amount for barter gigs.
- `skills_required`: array of required skills.
- `deadline`: due date.
- `status`: usually `open`, `assigned`, or `completed`.
- `assigned_to`: profile ID of accepted freelancer.
- `created_at`: creation timestamp.

Relationships:

- `gigs.creator_id -> profiles.id`.
- `gigs.assigned_to -> profiles.id`.
- One gig can have many applications.
- One accepted gig gets a transaction.
- Messages are grouped by gig.

### `applications`

Stores applications submitted by freelancers to gigs.

Columns used by the application:

- `id`: primary key.
- `gig_id`: gig being applied to.
- `applicant_id`: profile ID of applicant.
- `message`: application message.
- `status`: `pending`, `accepted`, or `rejected`.
- `created_at`: application timestamp.

Relationships:

- `applications.gig_id -> gigs.id`.
- `applications.applicant_id -> profiles.id`.

### `transactions`

Tracks accepted gig value while the gig is in escrow and after completion.

Columns used by the application:

- `id`: primary key.
- `gig_id`: related gig.
- `creator_id`: profile ID of gig creator.
- `freelancer_id`: profile ID of accepted freelancer.
- `type`: `paid` or `barter`.
- `amount`: paid gig amount.
- `credits`: barter gig credit amount.
- `payment_id`: Razorpay payment ID for paid gigs.
- `status`: `escrow` or `completed`.
- `created_at`: transaction creation timestamp.
- `completed_at`: timestamp set when the gig is completed.

Relationships:

- `transactions.gig_id -> gigs.id`.
- `transactions.creator_id -> profiles.id`.
- `transactions.freelancer_id -> profiles.id`.
- Reviews are attached to completed transactions.

### `reviews`

Stores ratings and comments after gig completion.

Columns used by the application:

- `id`: primary key.
- `transaction_id`: completed transaction being reviewed.
- `reviewer_id`: profile ID of reviewer.
- `reviewee_id`: profile ID of person being reviewed.
- `rating`: numeric rating.
- `comment`: written review.
- `created_at`: review timestamp.

Relationships:

- `reviews.transaction_id -> transactions.id`.
- `reviews.reviewer_id -> profiles.id`.
- `reviews.reviewee_id -> profiles.id`.

### `credits_ledger`

Stores credit movement history for barter gigs.

Columns used by the application:

- `id`: primary key.
- `from_user`: profile ID sending/spending credits.
- `to_user`: profile ID receiving/earning credits.
- `gig_id`: related gig.
- `amount`: number of credits.
- `type`: `spent` or `earned`.
- `created_at`: ledger timestamp.

Relationships:

- `credits_ledger.from_user -> profiles.id`.
- `credits_ledger.to_user -> profiles.id`.
- `credits_ledger.gig_id -> gigs.id`.

### `fraud_alerts`

Stores rule-based fraud flags.

Columns used by the application:

- `id`: primary key.
- `user_id`: profile ID that triggered the alert.
- `alert_type`: currently `rule_triggered`.
- `details`: JSON object with rule name and trigger values.
- `created_at`: alert timestamp.

Relationships:

- `fraud_alerts.user_id -> profiles.id`.

### `notifications`

Stores user notifications.

Columns used by the application:

- `id`: primary key.
- `user_id`: Supabase Auth user ID, not profile ID.
- `type`: event type, such as `new_application`, `application_accepted`, `new_message`, `gig_completed`, or `new_review`.
- `title`: notification title.
- `message`: notification body.
- `link`: frontend route to open.
- `is_read`: boolean read state.
- `created_at`: notification timestamp.

Relationships:

- `notifications.user_id -> auth.users.id`.

### `messages`

Stores chat messages between the creator and assigned freelancer for a gig.

Columns used by the application:

- `id`: primary key.
- `gig_id`: related gig.
- `sender_id`: sender profile ID.
- `receiver_id`: receiver profile ID.
- `content`: message text.
- `created_at`: message timestamp.
- `read_at`: timestamp set when receiver marks messages as read.

Relationships:

- `messages.gig_id -> gigs.id`.
- `messages.sender_id -> profiles.id`.
- `messages.receiver_id -> profiles.id`.

### Supabase Storage: `avatars`

Stores uploaded profile avatar images.

- Path pattern: `<auth_user_id>/<timestamp>.<extension>`.
- The public URL is stored in `profiles.avatar_url`.

### Important RLS Policies

The `database/` folder contains SQL policy patches for production safety:

- `applications_acceptance_rls.sql`: lets gig creators update applications for their own gigs.
- `gigs_delete_rls.sql`: lets creators delete their own open gigs and related applications.
- `messages_rls.sql`: lets only message sender/receiver view messages and lets receivers mark messages as read.
- `notifications_rls.sql`: lets users view/update their own notifications.
- `notifications_user_fk.sql`: ensures notification `user_id` references `auth.users.id`.
- `profile_freelancer_fields.sql`: adds portfolio, social, availability, category, and phone fields.

## 6. Full API Endpoint List

### Express Backend

Base URL locally: `http://localhost:5000`.

#### Health

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | No | Confirms the SkillBridge API is running. |

#### Auth

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | No | Create Supabase Auth user and profile. |
| POST | `/api/auth/login` | No | Sign in and return session, user, and profile. |
| POST | `/api/auth/logout` | Token expected | Sign out current token. |
| GET | `/api/auth/me` | Token expected | Return current auth user and profile. |

#### Profiles

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/profiles/upload-avatar` | Yes | Upload avatar image to Supabase Storage. |
| GET | `/api/profiles/:id` | Optional token | Get profile by profile ID. Phone number is hidden unless allowed. |
| PUT | `/api/profiles/:id` | Yes | Update own profile fields. |

#### Gigs

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/gigs` | Yes | Create a gig after moderation. |
| GET | `/api/gigs` | No | List open gigs with pagination. |
| GET | `/api/gigs/my-posted` | Yes | List gigs posted by current user. |
| GET | `/api/gigs/my-assigned` | Yes | List gigs assigned to current user. |
| GET | `/api/gigs/:id` | No | Get one gig and creator profile. |
| POST | `/api/gigs/:id/apply` | Yes | Apply to an open gig after moderation. |
| GET | `/api/gigs/:id/applicants` | Yes | Creator views applicants for a gig. |
| PUT | `/api/gigs/:id/complete` | Yes | Creator marks assigned gig as completed. |
| DELETE | `/api/gigs/:id` | Yes | Creator deletes own open gig. |

#### Applications

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/applications/my-applications` | Yes | List current user's submitted applications. |
| GET | `/api/applications/:gigId/applicants` | Yes | Creator views applicants for a gig. |
| PUT | `/api/applications/:id/accept` | Yes | Accept a barter application and create escrow transaction. |
| PUT | `/api/applications/:id/reject` | Yes | Reject an application. |

#### Payments

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/payment/create-order` | Yes | Create Razorpay order for a paid gig/application. |
| POST | `/api/payment/verify` | Yes | Verify Razorpay signature, accept application, and create transaction. |

#### Wallet

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/wallet/transactions` | Yes | List paid transactions involving current user. |
| GET | `/api/wallet/credits-history` | Yes | List earned/spent credit ledger entries. |

#### Reviews

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/reviews` | Yes | Create a review for a completed gig transaction. |
| GET | `/api/reviews/user/:userId` | No | Get reviews received by a profile. |

#### AI / ML Proxy

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/ml/recommended` | Yes | Get AI-recommended gigs for current user. |

#### Stats

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/stats/user` | Yes | Get stats for current user's profile. |
| GET | `/api/stats/user/:profileId` | No | Get public stats for another profile. |

#### Notifications

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/notifications` | Yes | Get latest notifications and unread count. |
| PUT | `/api/notifications/read-all` | Yes | Mark all current user's notifications as read. |
| PUT | `/api/notifications/:id/read` | Yes | Mark one notification as read. |

#### Chat

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/chat/conversations` | Yes | Get current user's gig conversations. |
| PUT | `/api/chat/:gigId/read` | Yes | Mark received messages in a gig as read. |
| GET | `/api/chat/:gigId?otherUserId=:id` | Yes | Get messages with the other party for a gig. |
| POST | `/api/chat/:gigId` | Yes | Send a moderated chat message. |

### Flask AI Service

Base URL locally: `http://localhost:5001`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check. |
| POST | `/api/ml/recommend` | Rank open gigs by skill similarity. |
| POST | `/api/moderate` | Check text for profanity and return moderation result. |

## 7. Environment Variables Needed

### Frontend: `skillbridge-frontend`

Used by Vite and browser-side code.

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Purpose:

- `VITE_API_URL`: Express backend URL.
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: anon key used for password reset and Realtime chat subscriptions.

### Backend: `skillbridge-backend`

Used by Express, Supabase, Razorpay, and backend scripts.

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

Purpose:

- `PORT`: Express server port.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_KEY`: Supabase anon key for normal client operations.
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`: service role key for admin scripts and reputation updates.
- `RAZORPAY_KEY_ID`: public Razorpay key returned to frontend order flow.
- `RAZORPAY_KEY_SECRET`: private key used to create orders and verify signatures.

Implementation note:

- The backend currently calls the AI service through constants set to `http://localhost:5001/api/...` inside `mlController.js`, `gigController.js`, and `chatController.js`. For production deployment where the AI service is on Railway, these should be replaced with an environment variable such as `AI_SERVICE_URL`.

### AI Service: `skillbridge-ai`

The current Flask app does not require custom environment variables in code. It runs locally on port `5001` when started directly.

Recommended production variables:

```env
PORT=5001
```

If deployed on Railway, the process should bind to Railway's provided port or be started with a command that respects Railway's environment. The app code currently uses `app.run(host="0.0.0.0", port=5001, debug=True)` only when run directly.

## 8. Deployment Architecture

### Production Layout

```text
Vercel
  Hosts the React frontend.
  Uses VITE_API_URL to call the Railway backend.

Railway Service 1
  Hosts the Express backend.
  Connects to Supabase.
  Connects to Razorpay.
  Calls the Flask AI service.

Railway Service 2
  Hosts the Flask AI service.
  Provides /api/ml/recommend and /api/moderate.

Supabase
  Hosts Postgres database.
  Hosts Supabase Auth users.
  Hosts avatar images in Storage.
  Enforces Row Level Security policies.

Razorpay
  Handles paid gig order creation and payment verification.
```

### Request Flow in Production

1. A user opens the Vercel frontend.
2. The frontend calls the Railway Express API using `VITE_API_URL`.
3. Protected requests include a Supabase JWT.
4. Express validates the token with Supabase Auth.
5. For RLS-protected writes, Express creates a request-scoped Supabase client with the user's JWT.
6. Express reads/writes Supabase tables.
7. For recommendations and moderation, Express calls the Flask AI Railway service.
8. For paid gigs, Express calls Razorpay and verifies payment signatures.
9. Supabase stores all durable project data.

### Why the Architecture Is Split

- React on Vercel gives fast static hosting and a clean user experience.
- Express on Railway keeps secrets and business rules out of the browser.
- Supabase provides managed authentication, Postgres, storage, and realtime database events.
- Flask isolates Python ML libraries from the JavaScript backend.
- Razorpay handles real payment order and signature verification instead of the app inventing payment security.

## Local Development

### Frontend

```bash
cd skillbridge-frontend
npm install
npm run dev
```

Default local URL: `http://localhost:5173`.

### Backend

```bash
cd skillbridge-backend
npm install
npm run dev
```

Default local URL: `http://localhost:5000`.

### AI Service

```bash
cd skillbridge-ai
pip install -r requirements.txt
python app.py
```

Default local URL: `http://localhost:5001`.

## Key Project Capabilities to Defend

- Full-stack authentication through Supabase Auth.
- Protected frontend routes and token-based backend authorization.
- Gig marketplace with posting, browsing, applications, acceptance, assignment, and completion.
- Two compensation models:
  - Paid gigs through Razorpay.
  - Barter gigs through credits.
- Escrow-style transaction state before release on completion.
- Credit ledger for auditable barter history.
- AI skill matching with TF-IDF and cosine similarity.
- AI-supported profanity moderation for user-generated text.
- Rule-based fraud detection stored in `fraud_alerts`.
- Reputation formula that is simple, explainable, and recalculated after real events.
- Realtime-capable chat backed by Supabase `messages`.
- Notifications for important workflow events.
- Profile portfolios with skills, reviews, avatar, links, and public stats.

## Important Implementation Notes

- `profiles.id` is the main application user ID for gigs, applications, messages, reviews, transactions, and credits.
- `auth.users.id` is the Supabase authentication user ID.
- `notifications.user_id` intentionally stores `auth.users.id`, not `profiles.id`.
- The backend uses `req.supabase = createAuthenticatedClient(token)` so Supabase RLS policies can evaluate `auth.uid()` correctly during protected writes.
- Barter credit updates use a compare-and-swap helper so concurrent requests do not overwrite balances.
- Reputation and credit verification scripts exist for maintenance and defense demos.
- AI recommendations are explainable because they use text similarity rather than an opaque model.

