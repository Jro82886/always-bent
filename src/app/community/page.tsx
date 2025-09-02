'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '@/store/appState';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';
import { initChatClient, ChatMessage } from '@/lib/services/chat';
import { parseMentions, normalizeUser, highlightMentions } from '@/lib/chat/mentions';
import TopHUD from '@/components/TopHUD';
import RequireUsername from '@/components/RequireUsername';
import NavTabs from '@/components/NavTabs';

export default function CommunityPage() {
  const { selectedInletId, username, setCommunityBadge } = useAppState();
  const inlet = getInletById(selectedInletId) ?? DEFAULT_INLET;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const clientRef = useRef(initChatClient());
  const [toast, setToast] = useState<string | null>(null);
  const [toastClosing, setToastClosing] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const TOAST_DURATION_MS = 4000;
  const toastExpiryRef = useRef<number | null>(null);
  const toastRemainingRef = useRef<number>(TOAST_DURATION_MS);

  useEffect(() => {
    const client = clientRef.current;
    let mounted = true;
    (async () => {
      const recent = await client.loadRecent(inlet.id);
      if (mounted) setMessages(recent);
      await client.subscribe(inlet.id, (m) => {
        setMessages((prev) => [...prev, m]);
        const me = normalizeUser(username || '');
        if (m.text && me && parseMentions(m.text).includes(me) && normalizeUser(m.user) !== me) {
          setCommunityBadge(true);
          // show a lightweight toast
          setToast(`Mentioned by ${m.user}`);
          setToastClosing(false);
          if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
          toastExpiryRef.current = Date.now() + TOAST_DURATION_MS;
          toastRemainingRef.current = TOAST_DURATION_MS;
          toastTimerRef.current = window.setTimeout(() => {
            setToastClosing(true);
            window.setTimeout(() => setToast(null), 180);
            toastTimerRef.current = null;
            toastExpiryRef.current = null;
          }, TOAST_DURATION_MS);
        }
      });
    })();
    return () => {
      mounted = false;
      client.unsubscribe();
    };
  }, [inlet.id]);

  // Clear badge when entering Community
  useEffect(() => {
    setCommunityBadge(false);
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [setCommunityBadge]);

  const send = async () => {
    const u = username || '';
    const msg: ChatMessage = {
      id: '',
      user: u,
      inletId: inlet.id,
      text: text.trim(),
      createdAt: Date.now(),
    };
    if (!msg.text || !u) return;
    await clientRef.current.send(msg);
    setText('');
  };

  // Derive a simple online list: users with activity in last 5 minutes
  const onlineUsers = useMemo(() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const set = new Set<string>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.inletId !== inlet.id) continue;
      if (!m.createdAt || m.createdAt < cutoff) break;
      if (m.user) set.add(m.user);
    }
    // always include me if present
    if (username) set.add(username);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [messages, inlet.id, username]);

  const insertMention = (name: string) => {
    const at = `@${name} `;
    const cur = text || '';
    const next = cur.endsWith(' ') || cur.length === 0 ? cur + at : cur + ' ' + at;
    setText(next);
    inputRef.current?.focus();
  };

  return (
    <RequireUsername>
    <main className="h-screen w-screen bg-black text-white" onFocusCapture={() => setCommunityBadge(false)}>
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        <TopHUD includeAbfi={false} />
      </div>
      <div className="absolute inset-0 top-16 md:top-20 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 text-sm text-white/70">Chat — inlet: <span className="font-semibold">{inlet.name}</span></div>
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            {/* Messages */}
            <div className="h-[60vh] overflow-auto rounded-lg border border-white/10 bg-black/40 p-3">
              {messages.map((m) => (
                <div key={m.id} className="mb-2 text-sm">
                  <span className="text-cyan-300">{m.user}</span>
                  <span className="text-white/50"> · {new Date(m.createdAt).toLocaleTimeString()}</span>
                  <div className="text-white/90">{highlightMentions(m.text, username || '')}</div>
                </div>
              ))}
              {!messages.length && (
                <div className="text-white/50">No messages yet. Be the first to say hi.</div>
              )}
            </div>

            {/* Online now */}
            <aside className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
              <div className="mb-2 font-medium text-white/85">Online now</div>
              {onlineUsers.length ? (
                <ul className="space-y-1">
                  {onlineUsers.map((u) => (
                    <li key={u}>
                      <button
                        type="button"
                        className="w-full truncate rounded-md px-2 py-1 text-left text-white/85 hover:bg-white/10"
                        onClick={() => insertMention(u)}
                        title={`Mention @${u}`}
                      >
                        @{u}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-white/50">No active users</div>
              )}
            </aside>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              className="flex-1 rounded-md bg-black/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            />
            <button
              onClick={send}
              className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-medium text-black hover:bg-cyan-300"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-white/50">Only users in this inlet see these messages. Click a name to @mention.</div>
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 bottom-4 z-[1001] pointer-events-auto">
          <div
            role="status"
            aria-live="polite"
            className={[
              'relative rounded-lg bg-black/70 px-3 py-2 pr-8 text-sm text-white/90 shadow-lg ring-1 ring-white/10',
              toastClosing ? 'animate-slide-fade-out' : 'animate-slide-fade'
            ].join(' ')}
            onMouseEnter={() => {
              if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
                if (toastExpiryRef.current) {
                  toastRemainingRef.current = Math.max(0, toastExpiryRef.current - Date.now());
                }
              }
            }}
            onMouseLeave={() => {
              const remaining = toastRemainingRef.current > 0 ? toastRemainingRef.current : TOAST_DURATION_MS;
              toastExpiryRef.current = Date.now() + remaining;
              if (!toastTimerRef.current) {
                toastTimerRef.current = window.setTimeout(() => {
                  setToastClosing(true);
                  window.setTimeout(() => setToast(null), 180);
                  toastTimerRef.current = null;
                  toastExpiryRef.current = null;
                }, remaining);
              }
            }}
            onFocus={() => {
              if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
                if (toastExpiryRef.current) {
                  toastRemainingRef.current = Math.max(0, toastExpiryRef.current - Date.now());
                }
              }
            }}
            onBlur={() => {
              const remaining = toastRemainingRef.current > 0 ? toastRemainingRef.current : TOAST_DURATION_MS;
              toastExpiryRef.current = Date.now() + remaining;
              if (!toastTimerRef.current) {
                toastTimerRef.current = window.setTimeout(() => {
                  setToastClosing(true);
                  window.setTimeout(() => setToast(null), 180);
                  toastTimerRef.current = null;
                  toastExpiryRef.current = null;
                }, remaining);
              }
            }}
            tabIndex={0}
          >
            {toast}
            <button
              type="button"
              aria-label="Close"
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              onClick={() => {
                if (toastTimerRef.current) {
                  window.clearTimeout(toastTimerRef.current);
                  toastTimerRef.current = null;
                }
                setToastClosing(true);
                window.setTimeout(() => setToast(null), 180);
                toastExpiryRef.current = null;
                toastRemainingRef.current = TOAST_DURATION_MS;
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
    </RequireUsername>
  );
}


