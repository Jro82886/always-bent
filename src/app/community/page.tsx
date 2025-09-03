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
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<number | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

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

  const mentionCandidates = useMemo(() => {
    if (!mentionOpen || !mentionQuery) return [] as string[];
    const q = mentionQuery.toLowerCase();
    return onlineUsers.filter(u => u.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionOpen, mentionQuery, onlineUsers]);

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
              onChange={(e) => {
                const v = e.target.value;
                setText(v);
                setIsTyping(true);
                if (typingTimer.current) window.clearTimeout(typingTimer.current);
                typingTimer.current = window.setTimeout(() => setIsTyping(false), 800);
                // mention state
                const at = v.lastIndexOf('@');
                if (at >= 0) {
                  const after = v.slice(at + 1);
                  const stop = /\s|[.,:;!?]/.exec(after)?.index ?? -1;
                  const token = stop >= 0 ? after.slice(0, stop) : after;
                  if (token.length >= 1) {
                    setMentionOpen(true);
                    setMentionQuery(token);
                    setMentionIndex(0);
                  } else {
                    setMentionOpen(false);
                    setMentionQuery('');
                  }
                } else {
                  setMentionOpen(false);
                  setMentionQuery('');
                }
              }}
              onKeyDown={(e) => {
                if (!mentionOpen || mentionCandidates.length === 0) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionCandidates.length); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length); }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  const name = mentionCandidates[mentionIndex];
                  if (name) {
                    // replace current @token with @name
                    const v = text;
                    const at = v.lastIndexOf('@');
                    const after = v.slice(at + 1);
                    const stopMatch = /\s|[.,:;!?]/.exec(after);
                    const stop = stopMatch ? at + 1 + stopMatch.index : v.length;
                    const next = v.slice(0, at) + `@${name}` + (stop < v.length ? v.slice(stop) : ' ') ;
                    setText(next);
                    setMentionOpen(false);
                    setMentionQuery('');
                    setMentionIndex(0);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }
                }
                if (e.key === 'Escape') { setMentionOpen(false); setMentionQuery(''); }
              }}
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
          {mentionOpen && mentionCandidates.length > 0 && (
            <div className="relative">
              <div className="absolute z-50 mt-1 w-60 max-w-[80vw] rounded-md border border-white/10 bg-black/80 p-1 text-sm backdrop-blur">
                {mentionCandidates.map((u, i) => (
                  <button
                    key={u}
                    type="button"
                    className={["block w-full truncate text-left rounded px-2 py-1", i === mentionIndex ? "bg-cyan-500/30 text-white" : "text-white/85 hover:bg-white/10"].join(' ')}
                    onMouseEnter={() => setMentionIndex(i)}
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => {
                      const v = text;
                      const at = v.lastIndexOf('@');
                      const after = v.slice(at + 1);
                      const stopMatch = /\s|[.,:;!?]/.exec(after);
                      const stop = stopMatch ? at + 1 + stopMatch.index : v.length;
                      const next = v.slice(0, at) + `@${u}` + (stop < v.length ? v.slice(stop) : ' ');
                      setText(next);
                      setMentionOpen(false);
                      setMentionQuery('');
                      setMentionIndex(0);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                  >
                    @{u}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-1 h-4 text-xs text-white/60">{isTyping ? 'typing…' : ' '}</div>
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


