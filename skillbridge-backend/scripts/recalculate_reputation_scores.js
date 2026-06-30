import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const PAGE_SIZE = 1000;

const calculateReputationScore = ({ completedGigs, avgRating }) => (
  (Number(completedGigs || 0) * 10) + (Number(avgRating || 0) * 20)
);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY in skillbridge-backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const fetchAll = async (table, select, orderColumn = 'created_at') => {
  const rows = [];
  let from = 0;

  while (true) {
    const query = supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);

    if (orderColumn) {
      query.order(orderColumn, { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
};

const main = async () => {
  console.log('Recalculating reputation scores from completed transactions and received reviews...');

  const [profiles, transactions, reviews] = await Promise.all([
    fetchAll('profiles', 'id, full_name, email, reputation_score', 'created_at'),
    fetchAll('transactions', 'id, creator_id, freelancer_id, status', 'created_at'),
    fetchAll('reviews', 'id, reviewee_id, rating', 'created_at')
  ]);

  const completedByProfile = new Map();
  const ratingsByProfile = new Map();

  for (const transaction of transactions) {
    if (transaction.status !== 'completed') continue;

    if (transaction.creator_id) {
      completedByProfile.set(transaction.creator_id, (completedByProfile.get(transaction.creator_id) || 0) + 1);
    }

    if (transaction.freelancer_id) {
      completedByProfile.set(transaction.freelancer_id, (completedByProfile.get(transaction.freelancer_id) || 0) + 1);
    }
  }

  for (const review of reviews) {
    if (!review.reviewee_id) continue;

    const existing = ratingsByProfile.get(review.reviewee_id) || { total: 0, count: 0 };
    existing.total += Number(review.rating || 0);
    existing.count += 1;
    ratingsByProfile.set(review.reviewee_id, existing);
  }

  let changedCount = 0;
  const reportRows = [];

  for (const profile of profiles) {
    const completedGigs = completedByProfile.get(profile.id) || 0;
    const ratings = ratingsByProfile.get(profile.id) || { total: 0, count: 0 };
    const avgRating = ratings.count > 0 ? ratings.total / ratings.count : 0;
    const before = Number(profile.reputation_score || 0);
    const after = calculateReputationScore({ completedGigs, avgRating });

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ reputation_score: after })
      .eq('id', profile.id)
      .select('id, reputation_score')
      .maybeSingle();

    if (error) throw error;
    if (!updatedProfile) {
      throw new Error(`Reputation update matched no profile: ${profile.id}`);
    }

    const changed = before !== after;
    if (changed) changedCount += 1;

    const row = {
      profile_id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      before,
      completed_gigs: completedGigs,
      review_count: ratings.count,
      avg_rating: avgRating,
      after,
      persisted_after: Number(updatedProfile.reputation_score || 0),
      changed
    };

    reportRows.push(row);
    console.log(JSON.stringify(row));
  }

  const samples = [
    ...reportRows.filter((row) => row.changed),
    ...reportRows.filter((row) => !row.changed)
  ].slice(0, 3);

  console.log('Sample before/after rows:');
  for (const sample of samples) {
    console.log(JSON.stringify(sample));
  }

  console.log(`Done. Recalculated ${profiles.length} profiles. Changed ${changedCount} reputation scores.`);
};

main().catch((error) => {
  console.error('Failed to recalculate reputation scores:', error);
  process.exit(1);
});
