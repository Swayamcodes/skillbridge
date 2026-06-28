import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { AuthContext } from '../context/auth';
import api from '../services/api';
import { subscribeToMessages, unsubscribeFromChannel } from '../services/realtimeChat';

const formatConversationTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatMessageTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const ConversationSkeleton = () => (
  <div className="divide-y divide-gray-100">
    {[0, 1, 2, 3, 4, 5].map((item) => (
      <div key={item} className="flex items-center gap-3 px-4 py-4">
        <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-current/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-36 animate-pulse rounded bg-current/10" />
          <div className="h-4 w-48 animate-pulse rounded bg-current/10" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-current/10" />
        </div>
      </div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="space-y-5 px-6 py-6">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className={`flex ${item % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className="flex w-2/3 max-w-md flex-col gap-2">
          <div className="h-16 w-full animate-pulse rounded-2xl bg-current/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-current/10" />
        </div>
      </div>
    ))}
  </div>
);

const Messages = () => {
  const { profile } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const selectedGigRef = useRef(null);

  const queryGigId = new URLSearchParams(location.search).get('gigId');
  const initialGigId = location.state?.gigId || queryGigId || null;

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedGigId = selectedConversation?.gig_id || null;
  selectedGigRef.current = selectedGigId;

  const sortConversations = useCallback((items) => (
    [...items].sort((first, second) => (
      new Date(second.last_message?.created_at || 0) - new Date(first.last_message?.created_at || 0)
    ))
  ), []);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/api/chat/conversations');
      const nextConversations = sortConversations(response.data.conversations || []);
      setConversations(nextConversations);

      if (!selectedGigRef.current && initialGigId) {
        const initialConversation = nextConversations.find((conversation) => conversation.gig_id === initialGigId);
        if (initialConversation) {
          setSelectedConversation(initialConversation);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, [initialGigId, sortConversations]);

  const markMessagesAsRead = useCallback(async (gigId) => {
    try {
      await api.put(`/api/chat/${gigId}/read`);
      window.dispatchEvent(new Event('skillbridge:messages-read'));
      setConversations((currentConversations) => currentConversations.map((conversation) => (
        conversation.gig_id === gigId ? { ...conversation, unread_count: 0 } : conversation
      )));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, []);

  const loadConversation = useCallback(async (conversation) => {
    if (!conversation?.gig_id || !conversation?.other_party?.id) return;

    setLoadingMessages(true);
    setError('');

    try {
      const response = await api.get(`/api/chat/${conversation.gig_id}`, {
        params: { otherUserId: conversation.other_party.id }
      });

      setMessages(response.data.messages || []);
      await markMessagesAsRead(conversation.gig_id);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err.response?.data?.message || 'Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  }, [markMessagesAsRead]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversation(selectedConversation);
    }
  }, [loadConversation, selectedConversation]);

  const conversationKeys = useMemo(
    () => conversations.map((conversation) => conversation.gig_id).join(','),
    [conversations]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversations.length || !profile?.id) return undefined;

    const channels = conversations.map((conversation) => subscribeToMessages(conversation.gig_id, (message) => {
      setConversations((currentConversations) => sortConversations(currentConversations.map((item) => {
        if (item.gig_id !== message.gig_id) return item;

        const isIncoming = message.receiver_id === profile.id;
        const isOpen = selectedGigRef.current === message.gig_id;

        return {
          ...item,
          last_message: message,
          unread_count: isIncoming && !isOpen ? (item.unread_count || 0) + 1 : item.unread_count || 0
        };
      })));

      if (selectedGigRef.current === message.gig_id) {
        setMessages((currentMessages) => {
          if (currentMessages.some((currentMessage) => currentMessage.id === message.id)) {
            return currentMessages;
          }

          return [...currentMessages, message].sort((first, second) => (
            new Date(first.created_at) - new Date(second.created_at)
          ));
        });

        if (message.receiver_id === profile.id) {
          markMessagesAsRead(message.gig_id);
        }
      }
    }));

    return () => {
      channels.forEach((channel) => unsubscribeFromChannel(channel));
    };
  }, [conversationKeys, conversations, markMessagesAsRead, profile?.id, sortConversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => (
      conversation.other_party?.full_name?.toLowerCase().includes(query)
      || conversation.gig?.title?.toLowerCase().includes(query)
    ));
  }, [conversations, searchQuery]);

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selectedConversation?.other_party?.id || sending) return;

    setSending(true);
    setError('');

    try {
      await api.post(`/api/chat/${selectedConversation.gig_id}`, {
        receiverId: selectedConversation.other_party.id,
        content
      });
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <div className="flex h-full">
        <aside className={`${selectedConversation ? 'hidden md:flex' : 'flex'} h-full w-full flex-col border-r border-gray-200 bg-white md:w-[380px] md:flex-shrink-0`}>
          <div className="border-b border-gray-200 px-5 py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-light">Chats</h1>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Dashboard
              </button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations ? (
              <ConversationSkeleton />
            ) : error && conversations.length === 0 ? (
              <div className="p-5 text-sm text-red-700">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    M
                  </div>
                  <h2 className="mb-2 text-xl font-light">No conversations yet</h2>
                  <p className="text-sm text-gray-600">Assigned gig chats will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => {
                  const isActive = conversation.gig_id === selectedGigId;
                  const unreadCount = conversation.unread_count || 0;

                  return (
                    <button
                      key={conversation.gig_id}
                      type="button"
                      onClick={() => handleConversationSelect(conversation)}
                      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-emerald-50 ${
                        isActive ? 'bg-emerald-50' : 'bg-white'
                      }`}
                    >
                      <Avatar profile={conversation.other_party} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">
                              {conversation.other_party?.full_name || 'Unknown user'}
                            </p>
                            <p className="truncate text-xs text-gray-500">{conversation.gig?.title}</p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-500">
                            {formatConversationTime(conversation.last_message?.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="truncate text-sm text-gray-600">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="min-w-5 flex-shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-center text-xs font-medium text-white">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className={`${selectedConversation ? 'flex' : 'hidden md:flex'} h-full min-w-0 flex-1 flex-col bg-gray-50`}>
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
                  M
                </div>
                <h2 className="text-2xl font-light">Select a conversation to start chatting</h2>
                <p className="mt-2 text-gray-600">Choose a chat from the sidebar.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="inline-flex text-sm text-gray-600 transition-colors hover:text-gray-900 md:hidden"
                >
                  Back
                </button>
                <Link to={`/profile/${selectedConversation.other_party?.id}`} className="flex-shrink-0">
                  <Avatar profile={selectedConversation.other_party} size="md" />
                </Link>
                <div className="min-w-0">
                  <Link
                    to={`/profile/${selectedConversation.other_party?.id}`}
                    className="block truncate font-medium text-gray-900 transition-colors hover:text-emerald-700"
                  >
                    {selectedConversation.other_party?.full_name || 'Unknown user'}
                  </Link>
                  <p className="truncate text-sm text-gray-500">{selectedConversation.gig?.title}</p>
                </div>
              </header>

              {error && (
                <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {loadingMessages ? (
                  <MessageSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900">No messages yet.</h2>
                      <p className="mt-2 text-gray-600">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === profile?.id;

                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[82%] flex-col gap-1 sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`rounded-2xl px-5 py-3 shadow-sm ${
                                isOwnMessage
                                  ? 'rounded-br-md bg-emerald-700 text-white'
                                  : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                            <span className="px-1 text-xs text-gray-500">{formatMessageTime(message.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSendMessage();
                }}
                className="border-t border-gray-200 bg-white px-4 py-4"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={1000}
                    disabled={loadingMessages}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || loadingMessages}
                    className="rounded-lg bg-emerald-700 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
