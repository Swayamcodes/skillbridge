import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const subscribeToMessages = (gigId, onNewMessage) => {
  const token = localStorage.getItem('token');
  if (token) {
    supabase.realtime.setAuth(token);
  }

  const channel = supabase
    .channel(`chat-${gigId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `gig_id=eq.${gigId}`
    }, (payload) => {
      onNewMessage(payload.new);
    })
    .subscribe();

  return channel;
};

export const unsubscribeFromChannel = (channel) => {
  supabase.removeChannel(channel);
};
