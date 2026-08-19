-- Allow creators to delete their own open gigs and their gig applications.
-- Run this in Supabase SQL editor if the policies are not already present.

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete own open gigs" ON gigs;

CREATE POLICY "Users can delete own open gigs"
ON gigs
FOR DELETE
TO authenticated
USING (
  status = 'open'
  AND creator_id IN (
    SELECT id
    FROM profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Gig creators can delete applications for open gigs" ON applications;

CREATE POLICY "Gig creators can delete applications for open gigs"
ON applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM gigs
    JOIN profiles AS creator_profile
      ON creator_profile.id = gigs.creator_id
    WHERE gigs.id = applications.gig_id
      AND gigs.status = 'open'
      AND creator_profile.user_id = auth.uid()
  )
);
