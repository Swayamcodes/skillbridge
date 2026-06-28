import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY in skillbridge-backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { data, error } = await supabase
  .from('profiles')
  .select('id, full_name, email, credits')
  .order('created_at', { ascending: true });

if (error) {
  console.error('Failed to verify credits:', error);
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log('Current profile credit balances:');

for (const profile of data || []) {
  console.log(JSON.stringify({
    profile_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    credits: profile.credits
  }));
}
