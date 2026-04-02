import supabase from '../utils/supabase.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const normalizeSkill = (skill = '') => skill.trim().toLowerCase();

const getLocalMatchResults = (gig, applicants) => {
  const requiredSkills = new Set((gig.skills_required || []).map(normalizeSkill).filter(Boolean));

  return applicants.map((application) => {
    const applicantSkills = new Set(
      (application.applicant?.skills || []).map(normalizeSkill).filter(Boolean)
    );
    const matchedSkills = [...requiredSkills].filter((skill) => applicantSkills.has(skill));
    const missingSkills = [...requiredSkills].filter((skill) => !applicantSkills.has(skill));
    const matchScore = requiredSkills.size
      ? Number(((matchedSkills.length / requiredSkills.size) * 100).toFixed(2))
      : 0;

    return {
      ...application,
      match_score: matchScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
    };
  });
};

const rankApplicantsWithFastApi = async (gig, applicants) => {
  const payload = {
    gig: {
      id: gig.id,
      title: gig.title,
      description: gig.description || '',
      skills_required: gig.skills_required || [],
    },
    applicants: applicants.map((application) => ({
      id: application.applicant?.id,
      full_name: application.applicant?.full_name || '',
      skills: application.applicant?.skills || [],
      bio: application.applicant?.bio || '',
      year: application.applicant?.year || null,
      reputation_score: application.applicant?.reputation_score || 0,
    })),
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/match-applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  const result = await response.json();
  const scoreMap = new Map(
    (result.results || []).map((item) => [
      item.applicant_id,
      {
        match_score: item.match_score,
        matched_skills: item.matched_skills || [],
        missing_skills: item.missing_skills || [],
      },
    ])
  );

  return applicants
    .map((application) => ({
      ...application,
      ...(scoreMap.get(application.applicant?.id) || {
        match_score: 0,
        matched_skills: [],
        missing_skills: gig.skills_required || [],
      }),
    }))
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
};

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, title, type, price, credits, status)
      `)
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, applications: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGigApplicants = async (req, res) => {
  try {
    const { gigId } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Check if user is gig creator
    const { data: gig } = await supabase
      .from('gigs')
      .select('id, creator_id, title, description, skills_required')
      .eq('id', gigId)
      .single();

    if (gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(id, full_name, email, college, year, skills, bio, reputation_score)
      `)
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    try {
      const rankedApplicants = await rankApplicantsWithFastApi(gig, data || []);
      res.json({ success: true, applicants: rankedApplicants, source: 'fastapi' });
    } catch (aiError) {
      console.error('FastAPI matcher unavailable, using local fallback:', aiError.message);
      const fallbackApplicants = getLocalMatchResults(gig, data || []).sort(
        (a, b) => (b.match_score || 0) - (a.match_score || 0)
      );
      res.json({ success: true, applicants: fallbackApplicants, source: 'local-fallback' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Get application with full details
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(id, creator_id, type, price, credits, title)
      `)
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If barter, check creator has enough credits
    if (application.gig.type === 'barter') {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', application.gig.creator_id)
        .single();

      if (creatorProfile.credits < application.gig.credits) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient credits' 
        });
      }

      // Deduct credits from creator (lock in escrow)
      await supabase
        .from('profiles')
        .update({ 
          credits: creatorProfile.credits - application.gig.credits 
        })
        .eq('id', application.gig.creator_id);

      // Log credit transaction
      await supabase
        .from('credits_ledger')
        .insert([{
          from_user: application.gig.creator_id,
          to_user: application.applicant_id,
          gig_id: application.gig.id,
          amount: application.gig.credits,
          type: 'spent'
        }]);
    }

    // Create transaction record
    const transactionData = {
      gig_id: application.gig.id,
      creator_id: application.gig.creator_id,
      freelancer_id: application.applicant_id,
      type: application.gig.type,
      status: 'escrow'
    };

    if (application.gig.type === 'paid') {
      transactionData.amount = application.gig.price;
    } else {
      transactionData.credits = application.gig.credits;
    }

    const { data: transaction, error: transactionError } = await supabase
  .from('transactions')
  .insert([transactionData])
  .select()
  .single();

if (transactionError) {
  console.error('Transaction error:', transactionError);
  throw transactionError;
}

console.log('Transaction created:', transaction);

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id);

    // Update gig status and assign
    await supabase
      .from('gigs')
      .update({
        status: 'assigned',
        assigned_to: application.applicant_id
      })
      .eq('id', application.gig.id);

    // Reject all other applications
    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('gig_id', application.gig.id)
      .neq('id', id);

    res.json({ success: true, message: 'Application accepted and transaction created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data: application } = await supabase
      .from('applications')
      .select('*, gig:gigs(creator_id)')
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.gig.creator_id !== profile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', id);

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
