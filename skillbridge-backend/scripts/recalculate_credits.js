import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const BASE_CREDITS = 100;
const PAGE_SIZE = 1000;

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
  console.log('Recalculating profile credits from credits_ledger ground truth...');

  const [profiles, ledgerEntries] = await Promise.all([
    fetchAll('profiles', 'id, full_name, email, credits', 'created_at'),
    fetchAll('credits_ledger', 'id, from_user, to_user, amount, type, gig_id, created_at', 'created_at')
  ]);

  const earnedByProfile = new Map();
  const spentByProfile = new Map();

  for (const entry of ledgerEntries) {
    const amount = Number(entry.amount || 0);

    if (entry.type === 'earned' && entry.to_user) {
      earnedByProfile.set(entry.to_user, (earnedByProfile.get(entry.to_user) || 0) + amount);
    }

    if (entry.type === 'spent' && entry.from_user) {
      spentByProfile.set(entry.from_user, (spentByProfile.get(entry.from_user) || 0) + amount);
    }
  }

  for (const profile of profiles) {
    const totalEarned = earnedByProfile.get(profile.id) || 0;
    const totalSpent = spentByProfile.get(profile.id) || 0;
    const currentCredits = Number(profile.credits || 0);
    const correctCredits = BASE_CREDITS + totalEarned - totalSpent;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: correctCredits })
      .eq('id', profile.id)
      .select('id, credits')
      .maybeSingle();

    if (error) throw error;

    console.log(JSON.stringify({
      profile_id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      before: currentCredits,
      earned: totalEarned,
      spent: totalSpent,
      after: correctCredits,
      changed: currentCredits !== correctCredits
    }));
  }

  console.log(`Done. Recalculated ${profiles.length} profile credit balances.`);
};

main().catch((error) => {
  console.error('Failed to recalculate credits:', error);
  process.exit(1);
});
