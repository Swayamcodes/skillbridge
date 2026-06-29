ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available'
CHECK (availability_status IN ('available', 'busy', 'unavailable'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS portfolio_links JSONB DEFAULT '[]';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;
