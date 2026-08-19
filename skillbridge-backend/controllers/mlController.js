import axios from 'axios';
import supabase from '../utils/supabase.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const getAiRequestUrl = (path) => `${(ML_SERVICE_URL || '').replace(/\/+$/, '')}${path}`;

export const getRecommendedGigs = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, skills')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];

    const { data: openGigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id, title, description, skills_required')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (gigsError) throw gigsError;

    const gigsArray = (openGigs || []).map((gig) => ({
      id: gig.id,
      title: gig.title,
      description: gig.description,
      skills_required: Array.isArray(gig.skills_required) ? gig.skills_required : []
    }));

    const requestUrl = getAiRequestUrl('/api/ml/recommend');
    const requestPayload = {
      user_skills: userSkills,
      open_gigs: gigsArray
    };

    console.log('AI recommendation request:', {
      ML_SERVICE_URL,
      final_request_url: requestUrl,
      method: 'POST',
      timeout_ms: 10000,
      payload: {
        user_skills: requestPayload.user_skills,
        open_gigs_count: requestPayload.open_gigs.length,
        open_gig_ids: requestPayload.open_gigs.map((gig) => gig.id)
      }
    });

    const mlResponse = await axios.post(requestUrl, requestPayload, {
      timeout: 10000
    });

    console.log('AI recommendation response:', {
      status: mlResponse.status,
      body: mlResponse.data
    });

    const recommendations = Array.isArray(mlResponse.data?.recommendations)
      ? mlResponse.data.recommendations
      : [];

    if (recommendations.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    const matchedGigIds = recommendations
      .map((item) => item.gig_id)
      .filter((gigId) => gigId !== undefined && gigId !== null);

    if (matchedGigIds.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    const { data: matchedGigs, error: matchedGigsError } = await supabase
      .from('gigs')
      .select(`
        *,
        creator:profiles!gigs_creator_id_fkey(id, full_name, email, college)
      `)
      .in('id', matchedGigIds);

    if (matchedGigsError) throw matchedGigsError;

    const gigMap = new Map((matchedGigs || []).map((gig) => [gig.id, gig]));
    const hydratedRecommendations = recommendations
      .map((item) => {
        const gig = gigMap.get(item.gig_id);

        if (!gig) {
          return null;
        }

        return {
          ...gig,
          match_score: item.match_score
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      recommendations: hydratedRecommendations
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('AI recommendation axios error:', {
        ML_SERVICE_URL,
        final_request_url: getAiRequestUrl('/api/ml/recommend'),
        method: 'POST',
        code: error.code,
        message: error.message,
        response_status: error.response?.status,
        response_data: error.response?.data
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return res.status(503).json({
          success: false,
          message: 'AI recommendation service is unavailable'
        });
      }

      return res.status(502).json({
        success: false,
        message: 'Failed to get recommendations from AI service'
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};
