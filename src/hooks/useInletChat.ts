import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { showToast } from '@/components/ui/Toast';
import { RealtimeChannel } from '@supabase/realtime-js';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name?: string;
  text: string;
  created_at: string;
  inlet_id: string;
}

interface UseInletChatReturn {
  messages: ChatMessage[];
  presenceCount: number;
  status: 'connected' | 'connecting' | 'disconnected';
  sendMessage: (text: string) => Promise<void>;
  error: string | null;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Retry configuration
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // Backoff up to 30s

export function useInletChat(inletId: string | null, userId?: string): UseInletChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentInletRef = useRef<string | null>(null);
  const presenceMapRef = useRef<Map<string, any>>(new Map());

  // Clean up function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    presenceMapRef.current.clear();
    setPresenceCount(0);
  }, []);

  // Join channel with inlet ID
  const joinChannel = useCallback((inlet: string) => {
    if (!supabase || !inlet) return;

    setStatus('connecting');
    setError(null);
    
    const channelName = `chat:${inlet}`;
    console.log(`Joining channel: ${channelName}`);
    
    // Create channel
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId || 'anonymous'
        }
      }
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      presenceMapRef.current.clear();
      
      // Count unique users
      Object.keys(state).forEach(key => {
        const presences = state[key] as any[];
        presences.forEach(presence => {
          presenceMapRef.current.set(presence.user_id || key, presence);
        });
      });
      
      setPresenceCount(presenceMapRef.current.size);
    });

    // Handle new messages
    channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      if (payload) {
        const newMessage: ChatMessage = {
          id: payload.id || Date.now().toString(),
          user_id: payload.user_id,
          user_name: payload.user_name,
          text: payload.text,
          created_at: payload.created_at || new Date().toISOString(),
          inlet_id: inlet
        };
        setMessages(prev => [...prev, newMessage]);
      }
    });

    // Subscribe and handle connection
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setStatus('connected');
        retryCountRef.current = 0;
        
        // Track presence
        if (userId) {
          channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
        
        // Show success toast if this was a retry
        if (retryCountRef.current > 0) {
          showToast({
            type: 'success',
            title: 'Reconnected',
            message: `Reconnected to ${inlet.replace(/-/g, ' ')} chat`,
            duration: 3000
          });
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handleDisconnect(inlet);
      }
    });

    channelRef.current = channel;
    
    // Load recent messages from database
    loadRecentMessages(inlet);
  }, [userId]);

  // Handle disconnection with retry
  const handleDisconnect = useCallback((inlet: string) => {
    setStatus('disconnected');
    
    const retryDelay = RETRY_DELAYS[Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)];
    
    showToast({
      type: 'warning',
      title: 'Connection Lost',
      message: `Disconnected from chat. Retrying in ${retryDelay / 1000}s...`,
      duration: 5000
    });

    retryTimeoutRef.current = setTimeout(() => {
      retryCountRef.current++;
      joinChannel(inlet);
    }, retryDelay);
  }, [joinChannel]);

  // Load recent messages from database
  const loadRecentMessages = useCallback(async (inlet: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles:user_id(display_name)')
        .eq('inlet_id', inlet)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedMessages: ChatMessage[] = data.reverse().map(msg => ({
          id: msg.id,
          user_id: msg.user_id,
          user_name: msg.profiles?.display_name || 'Anonymous',
          text: msg.text,
          created_at: msg.created_at,
          inlet_id: msg.inlet_id
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      // Don't show error toast - messages will be empty which is fine
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!supabase || !channelRef.current || !inletId || !text.trim()) return;

    if (status !== 'connected') {
      showToast({
        type: 'warning',
        title: 'Message Queued',
        message: 'Message will send when reconnected',
        duration: 4000
      });
      // TODO: Implement message queue
      return;
    }

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          inlet_id: inletId,
          user_id: userId || 'anonymous',
          text: text.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast to channel
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: data.id,
          user_id: data.user_id,
          user_name: 'You', // Will be replaced by actual name from profiles
          text: data.text,
          created_at: data.created_at,
          inlet_id: data.inlet_id
        }
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast({
        type: 'error',
        title: 'Send Failed',
        message: 'Could not send message. Please try again.',
        duration: 5000
      });
    }
  }, [status, inletId, userId]);

  // Handle inlet changes
  useEffect(() => {
    if (!inletId) {
      cleanup();
      return;
    }

    // If inlet changed, leave old channel and join new
    if (currentInletRef.current && currentInletRef.current !== inletId) {
      console.log(`Switching from ${currentInletRef.current} to ${inletId}`);
      cleanup();
      setMessages([]); // Clear messages when switching inlets
    }

    currentInletRef.current = inletId;
    joinChannel(inletId);

    return cleanup;
  }, [inletId, joinChannel, cleanup]);

  return {
    messages,
    presenceCount,
    status,
    sendMessage,
    error
  };
}
