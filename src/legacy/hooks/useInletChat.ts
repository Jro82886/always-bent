/**
 * 🚫 LEGACY — DO NOT USE
 * Retained only for reference after rewiring to useRealtimeChat/useOnlinePresence.
 * This hook manages its own messages state and opens separate channels.
 * If imported, it can cause duplicate subscriptions and stale UI.
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabaseClient"
import { showToast } from '@/components/ui/Toast';
import { INLETS } from '@/lib/inlets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ChatMessage {
  id: string;
  inlet_id: string;
  user_id: string;
  vessel_id?: string | null;
  text: string;
  created_at: string;
  _optimistic?: boolean;
  _failed?: boolean;
}

interface PresenceState {
  user_id: string;
  vessel_id?: string | null;
  inlet_id: string;
  last_seen: string;
  kind: 'web' | 'mobile' | 'pwa';
}

export function useInletChat(inletId: string, userId?: string, vesselId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [boatsOnline, setBoatsOnline] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const dbChannelRef = useRef<any>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Use the imported supabase client directly
  const supabaseClient = supabaseUrl && supabaseAnonKey ? supabase : null;

  // Extract fresh boats from presence state and vessel positions
  const extractFreshBoats = async (presenceState: any) => {
    const freshBoats = new Map<string, boolean>();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    // Add boats from presence
    Object.values(presenceState).forEach((states: any) => {
      if (Array.isArray(states)) {
        states.forEach((state: any) => {
          // Check if this is our custom presence data
          if (state.last_seen && new Date(state.last_seen) > twoMinutesAgo) {
            // Use vessel_id if available, otherwise user_id
            const key = state.vessel_id || state.user_id;
            if (key) freshBoats.set(key, true);
          }
        });
      }
    });
    
    // Layer in vessels from fleet API (vessels with position pings but no chat presence)
    try {
      const response = await fetch(`/api/fleet/online?inlet_id=${inletId}`);
      if (response.ok) {
        const vessels = await response.json();
        vessels.forEach((vessel: any) => {
          freshBoats.set(vessel.vessel_id, true);
        });
      }
    } catch (error) {
      console.error('Error fetching fleet vessels:', error);
    }
    
    return freshBoats;
  };

  useEffect(() => {
    if (!supabaseClient || !inletId || inletId === 'overview' || !userId) return;

    const setupChannel = async () => {
      try {
        // Create presence channel
        const channel = supabaseClient.channel(`chat:${inletId}`, {
          config: {
            presence: {
              key: userId
            }
          }
        });
        
        channelRef.current = channel;

        // Handle presence sync
        channel.on('presence', { event: 'sync' }, async () => {
          const presenceState = channel.presenceState();
          const freshBoats = await extractFreshBoats(presenceState);
          setBoatsOnline(freshBoats.size);
        });

        // Subscribe to channel
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            
            // Track presence
            const presenceData: PresenceState = {
              user_id: userId,
              vessel_id: vesselId,
              inlet_id: inletId,
              kind: 'web',
              last_seen: new Date().toISOString()
            };
            
            await channel.track(presenceData);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setConnected(false);
          }
        });

        // Create database channel for message updates
        const dbChannel = supabase
          .channel(`chat-db:${inletId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `inlet_id=eq.${inletId}`
            },
            (payload) => {
              const newMsg = payload.new as ChatMessage;
              setMessages(prev => {
                // Don't add if we already have this message (avoid duplicates)
                if (prev.some(msg => msg.id === newMsg.id)) {
                  return prev;
                }
                return [...prev, newMsg];
              });
            }
          )
          .subscribe();
          
        dbChannelRef.current = dbChannel;

        // Load initial messages
        const { data: initialMessages, error } = await supabaseClient
          .from('chat_messages')
          .select('*')
          .eq('inlet_id', inletId)
          .order('created_at', { ascending: true })
          .limit(200);

        if (error) {
          console.error('Error loading messages:', error);
        } else {
          setMessages(initialMessages || []);
        }

        // Set up heartbeat
        heartbeatInterval.current = setInterval(() => {
          if (channelRef.current) {
            const presenceData: PresenceState = {
              user_id: userId,
              vessel_id: vesselId,
              inlet_id: inletId,
              kind: 'web',
              last_seen: new Date().toISOString()
            };
            channelRef.current.track(presenceData);
          }
        }, 45000); // 45 seconds

      } catch (error) {
        console.error('Error setting up chat channel:', error);
        showToast({
          type: 'error',
          title: 'Chat Error',
          message: 'Unable to connect to chat. Please try again.',
          duration: 5000
        });
      }
    };

    setupChannel();

    // Cleanup
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      }
      if (dbChannelRef.current) {
        dbChannelRef.current.unsubscribe();
      }
      setMessages([]);
      setBoatsOnline(0);
      setConnected(false);
    };
  }, [inletId, userId, vesselId, supabaseClient]);

  // Send message function
  const send = async (text: string) => {
    if (!supabaseClient || !userId || !text.trim()) return;

    // 1) Create optimistic message
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      inlet_id: inletId,
      user_id: userId,
      vessel_id: vesselId,
      text: text.trim(),
      created_at: new Date().toISOString(),
      _optimistic: true
    };

    // 2) Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // 3) Persist to database
      const { data, error } = await supabaseClient
        .from('chat_messages')
        .insert({
          inlet_id: inletId,
          user_id: userId,
          vessel_id: vesselId,
          text: text.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, _failed: true, _optimistic: false }
            : msg
        ));
        
        showToast({
          type: 'error',
          title: 'Send Failed',
          message: 'Unable to send message. Please try again.',
          duration: 3000
        });
      } else if (data) {
        // 4) Replace optimistic with real message
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId ? { ...data, _optimistic: false } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, _failed: true, _optimistic: false }
          : msg
      ));
    }
  };

  // Get inlet name
  const inlet = INLETS.find(i => i.id === inletId);
  const inletName = inlet?.name || 'Unknown Inlet';
  const inletColor = inlet?.color || '#999';

  return {
    messages,
    send,
    boatsOnline,
    connected,
    inletName,
    inletColor
  };
}