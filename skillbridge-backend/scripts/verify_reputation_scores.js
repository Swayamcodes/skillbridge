import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const calculateReputationScore = ({ completedGigs, avgRating }) => (
  (Number(completedGigs || 0) * 10) + (Number(avgRating || 0) * 20)
);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY/SUPABASE_KEY in skillbridge-backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name, email, reputation_score')
  .order('created_at', { ascending: true });

if (profilesError) {
  console.error('Failed to fetch profiles:', profilesError);
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log('Current profile reputation score verification:');

for (const profile of profiles || []) {
  const { count: completedGigs, error: completedGigsError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .or(`creator_id.eq.${profile.id},freelancer_id.eq.${profile.id}`)
    .eq('status', 'completed');

  if (completedGigsError) throw completedGigsError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', profile.id);

  if (reviewsError) throw reviewsError;

  const avgRating = reviews?.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  const expected = calculateReputationScore({
    completedGigs: completedGigs || 0,
    avgRating
  });

  console.log(JSON.stringify({
    profile_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    reputation_score: Number(profile.reputation_score || 0),
    completed_count: completedGigs || 0,
    avg_rating: avgRating,
    expected_reputation_score: expected,
    discrepancy: Number(profile.reputation_score || 0) - expected
  }));
}
