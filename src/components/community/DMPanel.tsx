'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronLeft } from 'lucide-react';
import { DMClient, DMConversation, DMMessage } from '@/lib/services/dm';
import { useAppState } from '@/store/appState';
import { format } from 'date-fns';

interface DMPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUsername?: string;
}

export default function DMPanel({ isOpen, onClose, targetUserId, targetUsername }: DMPanelProps) {
  const { username } = useAppState();
  const [dmClient, setDmClient] = useState<DMClient | null>(null);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  // Initialize DM client
  useEffect(() => {
    if (username && userId) {
      const client = new DMClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        userId,
        username
      );
      setDmClient(client);
      
      // Load conversations
      loadConversations(client);
      
      // Get unread count
      client.getUnreadCount().then(setUnreadCount);
      
      return () => {
        client.disconnect();
      };
    }
  }, [username, userId]);

  // Open specific conversation if target user provided
  useEffect(() => {
    if (dmClient && targetUserId && targetUsername) {
      openConversation(targetUserId, targetUsername);
    }
  }, [dmClient, targetUserId, targetUsername]);

  const loadConversations = async (client: DMClient) => {
    try {
      const convs = await client.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const openConversation = async (otherUserId: string, otherUsername: string) => {
    if (!dmClient) return;
    
    setLoading(true);
    try {
      const conv = await dmClient.getOrCreateConversation(otherUserId, otherUsername);
      setActiveConversation(conv);
      
      // Load messages
      const msgs = await dmClient.getMessages(conv.id);
      setMessages(msgs);
      
      // Subscribe to new messages
      dmClient.subscribeToConversation(conv.id, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      });
      
      // Update unread count
      const count = await dmClient.getUnreadCount();
      setUnreadCount(count);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!dmClient || !activeConversation || !messageInput.trim()) return;
    
    try {
      const message = await dmClient.sendMessage(activeConversation.id, messageInput.trim());
      setMessages(prev => [...prev, message]);
      setMessageInput('');
      scrollToBottom();
      
      // Refresh conversations list to update last message
      loadConversations(dmClient);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getOtherParticipant = (conv: DMConversation) => {
    if (conv.participant1_id === userId) {
      return { id: conv.participant2_id, username: conv.participant2_username };
    }
    return { id: conv.participant1_id, username: conv.participant1_username };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return format(date, 'MMM d');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-emerald-950/95 backdrop-blur-xl border-l border-emerald-500/30 shadow-2xl transform transition-transform duration-300 z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
        <div className="flex items-center gap-2">
          {activeConversation && (
            <button
              onClick={() => {
                setActiveConversation(null);
                setMessages([]);
                if (dmClient) {
                  dmClient.unsubscribeFromConversation(activeConversation.id);
                }
              }}
              className="p-1 hover:bg-emerald-500/10 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            </button>
          )}
          <h2 className="text-emerald-300 font-semibold text-lg tracking-wide drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            {activeConversation 
              ? `@${getOtherParticipant(activeConversation).username}`
              : `Direct Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`
            }
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-emerald-400 hover:text-emerald-300 transition-colors" />
        </button>
      </div>

      {/* Content */}
      {!activeConversation ? (
        // Conversations List
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-emerald-400/60 font-medium text-sm">No messages yet</p>
              <p className="text-emerald-400/40 text-xs mt-2">
                Click on a captain's name to start a conversation
              </p>
            </div>
          ) : (
            <div className="divide-y divide-emerald-500/10">
              {conversations.map(conv => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(other.id, other.username)}
                    className="w-full p-4 hover:bg-emerald-500/5 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-emerald-400 font-semibold">
                            {other.username}
                          </span>
                        </div>
                        {conv.last_message_preview && (
                          <p className="text-gray-400 text-sm mt-1 truncate">
                            {conv.last_message_preview}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-xs">
                          {formatTime(conv.last_message_at)}
                        </span>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <div className="mt-1">
                            <span className="bg-emerald-500 text-black text-xs px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/30">
                              {conv.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Messages View
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Ephemeral notice */}
            <div className="text-center py-2">
              <span className="text-gray-600 text-xs">
                Messages auto-delete after 30 days
              </span>
            </div>
            
            {/* Messages */}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${
                  msg.sender_id === userId 
                    ? 'bg-emerald-500/20 text-emerald-100' 
                    : 'bg-gray-800 text-gray-100'
                } rounded-lg px-4 py-2`}>
                  {msg.sender_id !== userId && (
                    <div className="text-emerald-400 text-xs font-semibold mb-1">
                      {msg.sender_username}
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(msg.created_at), 'h:mm a')}
                    {msg.read_at && msg.sender_id === userId && (
                      <span className="ml-2 text-cyan-400">read</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-emerald-500/20 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-black/50 border border-emerald-500/30 rounded-lg px-4 py-2 text-emerald-100 placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
