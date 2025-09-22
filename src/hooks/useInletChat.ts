import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  
  // Initialize Supabase client
  const supabase = useRef(
    supabaseUrl && supabaseAnonKey 
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null
  ).current;

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
    if (!supabase || !inletId || inletId === 'overview' || !userId) return;

    const setupChannel = async () => {
      try {
        // Create presence channel
        const channel = supabase.channel(`chat:${inletId}`, {
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
              setMessages(prev => [...prev, payload.new as ChatMessage]);
            }
          )
          .subscribe();
          
        dbChannelRef.current = dbChannel;

        // Load initial messages
        const { data: initialMessages, error } = await supabase
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
  }, [inletId, userId, vesselId, supabase]);

  // Send message function
  const send = async (text: string) => {
    if (!supabase || !userId || !text.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          inlet_id: inletId,
          user_id: userId,
          vessel_id: vesselId,
          text: text.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        showToast({
          type: 'error',
          title: 'Send Failed',
          message: 'Unable to send message. Please try again.',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
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