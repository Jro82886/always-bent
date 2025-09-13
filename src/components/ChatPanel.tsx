'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Users, ChevronDown } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';
import { initChatClient, ChatMessage } from '@/lib/services/chat';
import { highlightMentions } from '@/lib/chat/mentions';

export default function ChatPanel() {
  const { selectedInletId, username } = useAppState();
  const inlet = getInletById(selectedInletId) ?? DEFAULT_INLET;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const clientRef = useRef(initChatClient());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!username || !isOpen) return;
    
    const client = clientRef.current;
    let mounted = true;

    const setup = async () => {
      await client.subscribe(selectedInletId ?? 'default', (msg) => {
        if (!mounted) return;
        setMessages(prev => [...prev, msg]);
        if (!isOpen || isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
      });

      const recent = await client.loadRecent(selectedInletId ?? 'default');
      if (mounted) setMessages(recent);
    };

    setup();

    return () => {
      mounted = false;
      client.unsubscribe();
    };
  }, [selectedInletId, username, isOpen]);

  // Clear unread count when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!text.trim() || !username) return;

    const msg: ChatMessage = {
      id: '',
      user: username,
      inletId: selectedInletId ?? 'default',
      text: text.trim(),
      createdAt: Date.now(),
    };

    await clientRef.current.send(msg);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!username) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all hover:scale-105"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-40 transition-all ${
          isMinimized ? 'h-14' : 'h-[500px] w-[380px]'
        }`}>
          <div className="h-full bg-gradient-to-br from-cyan-950/95 via-teal-950/95 to-cyan-900/95 backdrop-blur-md rounded-2xl border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-900/80 to-teal-900/80 px-4 py-3 flex items-center justify-between border-b border-cyan-500/30">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">
                  Chat • {inlet.name}
                </span>
                {unreadCount > 0 && !isMinimized && (
                  <span className="bg-red-500/80 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <ChevronDown size={16} className={`text-cyan-400 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
                  title="Close chat"
                >
                  <X size={16} className="text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-cyan-400/60 text-sm py-8">
                      No messages yet. Say hello to fellow captains!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-cyan-300">{msg.user}</span>
                          <span className="text-xs text-cyan-400/50">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-white/90 mt-1">
                          {highlightMentions(msg.text, username || '')}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-cyan-500/30">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-black/40 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!text.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-cyan-400/50">
                    Press Enter to send • @mention to notify
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
