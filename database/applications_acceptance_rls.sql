-- Allow a gig creator to accept or reject applications submitted to their gig.
-- The backend now sends the creator's JWT, so auth.uid() identifies the requester.

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gig creators can update applications" ON applications;

CREATE POLICY "Gig creators can update applications"
ON applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM gigs
    JOIN profiles AS creator_profile
      ON creator_profile.id = gigs.creator_id
    WHERE gigs.id = applications.gig_id
      AND creator_profile.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM gigs
    JOIN profiles AS creator_profile
      ON creator_profile.id = gigs.creator_id
    WHERE gigs.id = applications.gig_id
      AND creator_profile.user_id = auth.uid()
  )
);
