import { supabase } from "@/lib/supabaseClient"
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { nanoid } from "nanoid";

export type ChatMessage = {
  id: string;
  user: string;
  inletId: string;
  text: string;
  createdAt: number; // epoch ms
  temp?: boolean;
};

export type ChatClient = {
  mode: "supabase" | "stub";
  subscribe: (inletId: string, onMessage: (msg: ChatMessage) => void) => Promise<void>;
  unsubscribe: () => Promise<void>;
  send: (msg: ChatMessage) => Promise<void>;
  loadRecent: (inletId: string) => Promise<ChatMessage[]>;
};

const stubStore = new Map<string, ChatMessage[]>();

export function initChatClient(): ChatClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Stub client
    let activeInlet: string | null = null;
    let callback: ((m: ChatMessage) => void) | null = null;
    return {
      mode: "stub",
      async subscribe(inletId, onMessage) {
        activeInlet = inletId;
        callback = onMessage;
      },
      async unsubscribe() {
        activeInlet = null;
        callback = null;
      },
      async send(msg) {
        const key = msg.inletId;
        const arr = stubStore.get(key) ?? [];
        let finalMsg = msg;
        if (!finalMsg.id) {
          finalMsg = { ...msg, id: `temp_${Date.now()}_${nanoid(6)}`, temp: true };
        }
        if (!finalMsg.createdAt) {
          finalMsg = { ...finalMsg, createdAt: Date.now() };
        }
        arr.push(finalMsg);
        stubStore.set(key, arr);
        if (callback) callback(finalMsg);
      },
      async loadRecent(inletId) {
        const arr = stubStore.get(inletId) ?? [];
        return arr.slice(-20);
      },
    };
  }

  // Use the imported supabase client
  const supabaseClient = supabase;

  let channel: RealtimeChannel | null = null;
  let currentInlet: string | null = null;
  let onMessageRef: ((m: ChatMessage) => void) | null = null;

  return {
    mode: "supabase",
    async subscribe(inletId, onMessage) {
      onMessageRef = onMessage;
      currentInlet = inletId;
      if (channel) {
        await channel.unsubscribe();
        channel = null;
      }
      channel = supabaseClient.channel(`chat:${inletId}`, { config: { broadcast: { ack: true } } });
      channel.on("broadcast", { event: "message" }, (payload) => {
        const msg = payload.payload as ChatMessage;
        if (onMessageRef) onMessageRef(msg);
      });
      await channel.subscribe();
    },
    async unsubscribe() {
      onMessageRef = null;
      currentInlet = null;
      if (channel) {
        await channel.unsubscribe();
        channel = null;
      }
    },
    async send(msg) {
      if (!channel || !currentInlet) return;
      
      // Save to database first
      try {
        const { data, error } = await supabaseClient
          .from('chat_messages')
          .insert({
            inlet_id: msg.inletId,
            user_id: msg.user, // This should be a UUID in production
            text: msg.text
          })
          .select()
          .single();
        
        if (error) {
          console.error('Failed to save message:', error);
          // Continue with broadcast even if save fails
        }
        
        // Use DB-generated ID if available
        const finalMsg = {
          ...msg,
          id: data?.id || `temp_${Date.now()}_${nanoid(6)}`,
          createdAt: data?.created_at ? new Date(data.created_at).getTime() : Date.now(),
        };
        
        // Broadcast to other users
        await channel.send({ type: "broadcast", event: "message", payload: finalMsg });
      } catch (error) {
        console.error('Chat send error:', error);
      }
    },
    async loadRecent(inletId) {
      try {
        const { data, error } = await supabaseClient
          .from('chat_messages')
          .select('*')
          .eq('inlet_id', inletId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          console.error('Failed to load messages:', error);
          return [];
        }
        
        // Convert to ChatMessage format
        return (data || []).reverse().map(msg => ({
          id: msg.id,
          user: msg.user_id, // Will need username lookup in production
          inletId: msg.inlet_id,
          text: msg.text,
          createdAt: new Date(msg.created_at).getTime()
        }));
      } catch (error) {
        console.error('Load messages error:', error);
        return [];
      }
    },
  };
}


