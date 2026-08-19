export const adjustProfileCredits = async (
  db,
  {
    profileId,
    delta,
    minCredits = Number.NEGATIVE_INFINITY,
    maxRetries = 5
  }
) => {
  const numericDelta = Number(delta || 0);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const { data: profile, error: fetchError } = await db
      .from('profiles')
      .select('id, credits')
      .eq('id', profileId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!profile) {
      const error = new Error('Profile not found');
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }

    const previousCredits = Number(profile.credits || 0);
    const nextCredits = previousCredits + numericDelta;

    if (nextCredits < minCredits) {
      const error = new Error('Insufficient credits');
      error.code = 'INSUFFICIENT_CREDITS';
      error.previousCredits = previousCredits;
      error.nextCredits = nextCredits;
      throw error;
    }

    const { data: updatedProfile, error: updateError } = await db
      .from('profiles')
      .update({ credits: nextCredits })
      .eq('id', profileId)
      .eq('credits', previousCredits)
      .select('id, credits')
      .maybeSingle();

    if (updateError) throw updateError;

    if (updatedProfile) {
      return {
        previousCredits,
        delta: numericDelta,
        nextCredits: Number(updatedProfile.credits || 0),
        attempts: attempt
      };
    }
  }

  const error = new Error('Credit update conflict. Please retry.');
  error.code = 'CREDIT_UPDATE_CONFLICT';
  throw error;
};
