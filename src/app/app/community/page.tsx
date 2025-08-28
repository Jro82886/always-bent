"use client";

import { LeftRail } from "@/components/LeftRail";
import { TopBar } from "@/components/TopBar";
import { initChatClient, ChatMessage } from "@/lib/services/chat";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { parseMentions, normalizeUser, highlightMentions } from "@/lib/chat/mentions";
import toast from "react-hot-toast";
import { useAppState } from "@/store/appState";

export default function CommunityPage() {
  const { inletId, username } = useAppState();
  const client = useMemo(() => initChatClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const safeMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      const sig = `${msg.id}|${msg.createdAt}|${msg.text}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    client.loadRecent(inletId).then((initial) => {
      if (mounted) setMessages(initial);
    });
    client.subscribe(inletId, (m) => {
      setMessages((prev) => [...prev, m]);
    });
    return () => {
      mounted = false;
      client.unsubscribe();
    };
  }, [client, inletId]);

  // Mentions subscription (broadcast channel) when username is resolved and client is supabase
  useEffect(() => {
    const me = normalizeUser(username || "anon");
    if (client.mode !== "supabase" || typeof window === "undefined") return;
    const anyClient: any = (client as any);
    if (!anyClient?.subscribe || !anyClient) return;
    const supabase = (anyClient as any).supabase;
    // our chat client does not expose raw supabase; skip deep integration for now
  }, [client, username]);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [safeMessages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tempId = `temp_${Date.now()}_${nanoid(6)}`;
    const msg: ChatMessage = {
      id: tempId,
      user: username || "anon",
      inletId,
      text: trimmed,
      createdAt: Date.now(),
      temp: true,
    };
    setMessages((prev) => [...prev, msg]);
    setText("");
    // Mentions parse
    const mentions = parseMentions(trimmed).map(normalizeUser);
    try {
      await client.send(msg);
      // If supabase mode and we had mentions, we'd broadcast mention events; our client doesn't expose raw supabase yet, so skip.
      if (mentions.includes(normalizeUser(username || "anon"))) {
        toast.success("Mentioned @ you (local)");
      }
    } catch {
      // ignore for stub/demo
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <TopBar />
      <div className="grid grid-cols-[56px_1fr]">
        <LeftRail />
        <div className="ml-14 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-2 bg-neutral-50">
            {safeMessages.map((m, index) => {
              const mine = (username || "anon") === m.user;
              const key = `${m.id}-${m.createdAt}-${index}`;
              return (
                <div key={key} className={`flex mb-2 ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow ${mine ? "bg-cyan-600 text-white rounded-br-none" : "bg-neutral-200 text-black rounded-bl-none"}`}>
                    <div className="font-medium text-[10px] opacity-60">{m.user}</div>
                    <div>{highlightMentions(m.text, username || "anon")}</div>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
          <div className="flex items-center gap-2 p-3 border-t bg-white">
            <input
              type="text"
              className="flex-1 rounded-full border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-full text-sm font-medium" onClick={send}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


