import { supabase } from '@/lib/supabase/client';
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
      let finalMsg = msg;
      if (!finalMsg.id) {
        finalMsg = { ...msg, id: `temp_${Date.now()}_${nanoid(6)}`, temp: true };
      }
      if (!finalMsg.createdAt) {
        finalMsg = { ...finalMsg, createdAt: Date.now() };
      }
      await channel.send({ type: "broadcast", event: "message", payload: finalMsg });
    },
    async loadRecent() {
      // No DB yet; return empty for now
      return [];
    },
  };
}


