import axios from 'axios';
import supabase from '../utils/supabase.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const MAX_MESSAGE_LENGTH = 1000;

const getDb = (req) => req.supabase || supabase;

const getCurrentProfile = async (db, userId) => {
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, user_id, full_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return profile;
};

const getGig = async (db, gigId) => {
  const { data: gig, error } = await db
    .from('gigs')
    .select('id, title, creator_id, assigned_to')
    .eq('id', gigId)
    .maybeSingle();

  if (error) throw error;
  return gig;
};

const isGigParty = (gig, profileId) => (
  gig?.creator_id === profileId || gig?.assigned_to === profileId
);

const getOtherPartyId = (gig, profileId) => {
  if (gig.creator_id === profileId) return gig.assigned_to;
  if (gig.assigned_to === profileId) return gig.creator_id;
  return null;
};

const moderateMessage = async (content) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/moderate`,
      { text: content },
      { timeout: 10000 }
    );

    return {
      is_safe: response.data?.is_safe !== false,
      flagged_words: Array.isArray(response.data?.flagged_words) ? response.data.flagged_words : []
    };
  } catch (error) {
    console.error('Moderation service unavailable, allowing chat message:', error.message);
    return { is_safe: true, flagged_words: [] };
  }
};

export const getConversation = async (req, res) => {
  try {
    const db = getDb(req);
    const { gigId } = req.params;
    const { otherUserId } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId is required' });
    }

    const profile = await getCurrentProfile(db, req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const gig = await getGig(db, gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (!isGigParty(gig, profile.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to chat on this gig' });
    }

    if (getOtherPartyId(gig, profile.id) !== otherUserId) {
      return res.status(403).json({ success: false, message: 'Can only view messages with the other gig party' });
    }

    const { data: messages, error } = await db
      .from('messages')
      .select('*')
      .eq('gig_id', gigId)
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const db = getDb(req);
    const { gigId } = req.params;
    const { receiverId, content } = req.body;
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'receiverId is required' });
    }

    if (!trimmedContent) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: 'Message content cannot exceed 1000 characters' });
    }

    const senderProfile = await getCurrentProfile(db, req.user.id);
    if (!senderProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const gig = await getGig(db, gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (!isGigParty(gig, senderProfile.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to chat on this gig' });
    }

    const expectedReceiverId = getOtherPartyId(gig, senderProfile.id);
    if (!expectedReceiverId || receiverId !== expectedReceiverId) {
      return res.status(403).json({ success: false, message: 'Receiver must be the other gig party' });
    }

    const { data: receiverProfile, error: receiverProfileError } = await db
      .from('profiles')
      .select('id, user_id')
      .eq('id', receiverId)
      .maybeSingle();

    if (receiverProfileError) throw receiverProfileError;
    if (!receiverProfile) {
      return res.status(404).json({ success: false, message: 'Receiver profile not found' });
    }

    const moderationResult = await moderateMessage(trimmedContent);
    if (!moderationResult.is_safe) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content',
        flagged_words: moderationResult.flagged_words
      });
    }

    const { data: insertedMessage, error: insertError } = await db
      .from('messages')
      .insert([{
        gig_id: gigId,
        sender_id: senderProfile.id,
        receiver_id: receiverId,
        content: trimmedContent
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      const { error: notificationError } = await db
        .from('notifications')
        .insert([{
          user_id: receiverProfile.user_id,
          type: 'new_message',
          title: 'New Message',
          message: `New message regarding "${gig.title}"`,
          link: `/messages?gigId=${gigId}`
        }]);

      if (notificationError) throw notificationError;
    } catch (notificationError) {
      console.error('Failed to create new message notification:', notificationError);
    }

    res.status(201).json({ success: true, message: insertedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const db = getDb(req);
    const { gigId } = req.params;

    const profile = await getCurrentProfile(db, req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const gig = await getGig(db, gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (!isGigParty(gig, profile.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to chat on this gig' });
    }

    const { data: updatedMessages, error } = await db
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('gig_id', gigId)
      .eq('receiver_id', profile.id)
      .is('read_at', null)
      .select('id');

    if (error) throw error;

    res.json({
      success: true,
      markedRead: updatedMessages?.length || 0
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const db = getDb(req);
    const profile = await getCurrentProfile(db, req.user.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { data: messages, error: messagesError } = await db
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    const conversationMap = new Map();
    const unreadCountsByGig = new Map();

    for (const message of messages || []) {
      if (message.receiver_id === profile.id && !message.read_at) {
        unreadCountsByGig.set(
          message.gig_id,
          (unreadCountsByGig.get(message.gig_id) || 0) + 1
        );
      }

      if (!conversationMap.has(message.gig_id)) {
        conversationMap.set(message.gig_id, {
          gig_id: message.gig_id,
          other_profile_id: message.sender_id === profile.id ? message.receiver_id : message.sender_id,
          last_message: message
        });
      }
    }

    const { data: assignedGigs, error: assignedGigsError } = await db
      .from('gigs')
      .select('id, title, creator_id, assigned_to')
      .eq('status', 'assigned')
      .or(`creator_id.eq.${profile.id},assigned_to.eq.${profile.id}`);

    if (assignedGigsError) throw assignedGigsError;

    for (const gig of assignedGigs || []) {
      const otherPartyId = getOtherPartyId(gig, profile.id);

      if (otherPartyId && !conversationMap.has(gig.id)) {
        conversationMap.set(gig.id, {
          gig_id: gig.id,
          other_profile_id: otherPartyId,
          last_message: null
        });
      }
    }

    const conversationSeeds = Array.from(conversationMap.values());
    if (conversationSeeds.length === 0) {
      return res.json({ success: true, conversations: [] });
    }

    const gigIds = conversationSeeds.map((conversation) => conversation.gig_id);
    const otherProfileIds = [...new Set(conversationSeeds.map((conversation) => conversation.other_profile_id))];

    const [
      { data: gigs, error: gigsError },
      { data: profiles, error: profilesError }
    ] = await Promise.all([
      db
        .from('gigs')
        .select('id, title, creator_id, assigned_to')
        .in('id', gigIds),
      db
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', otherProfileIds)
    ]);

    if (gigsError) throw gigsError;
    if (profilesError) throw profilesError;

    const gigsById = new Map((gigs || []).map((gig) => [gig.id, gig]));
    const profilesById = new Map((profiles || []).map((otherProfile) => [otherProfile.id, otherProfile]));

    const conversations = conversationSeeds
      .filter((conversation) => {
        const gig = gigsById.get(conversation.gig_id);
        return gig && isGigParty(gig, profile.id);
      })
      .map((conversation) => {
        const gig = gigsById.get(conversation.gig_id);
        const otherProfile = profilesById.get(conversation.other_profile_id);

        return {
          gig_id: conversation.gig_id,
          gig: {
            id: gig.id,
            title: gig.title
          },
          other_party: otherProfile || {
            id: conversation.other_profile_id,
            full_name: 'Unknown user',
            email: null
          },
          last_message: conversation.last_message,
          unread_count: unreadCountsByGig.get(conversation.gig_id) || 0
        };
      });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get my conversations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
