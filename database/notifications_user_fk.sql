-- notifications.user_id stores auth.users.id, not profiles.id.
-- Convert any existing profile IDs before replacing the foreign key.

UPDATE notifications AS notification
SET user_id = profile.user_id
FROM profiles AS profile
WHERE notification.user_id = profile.id;

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
