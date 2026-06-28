-- Required for Supabase Realtime message subscriptions to deliver only rows
-- the authenticated user is allowed to SELECT.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Users can view their messages'
  ) THEN
    CREATE POLICY "Users can view their messages"
    ON messages FOR SELECT
    USING (
      auth.uid() = (SELECT user_id FROM profiles WHERE id = sender_id) OR
      auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Users can mark received messages as read'
  ) THEN
    CREATE POLICY "Users can mark received messages as read"
    ON messages FOR UPDATE
    USING (
      auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
    )
    WITH CHECK (
      auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
    );
  END IF;
END
$$;
