'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Circle, Anchor } from 'lucide-react';
import { useInletChat } from '@/hooks/useInletChat';
import { INLETS } from '@/lib/inlets';
import { flags } from '@/lib/flags';
import { highlightMentions } from '@/lib/chat/mentions';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inletId: string | null;
  userId?: string;
  userName?: string;
}

export default function ChatDrawer({ 
  isOpen, 
  onClose, 
  inletId, 
  userId,
  userName = 'Anonymous'
}: ChatDrawerProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use inlet-aware chat hook
  const { messages, presenceCount, status, sendMessage } = useInletChat(inletId, userId);

  // Get inlet display name
  const inlet = INLETS.find(i => i.id === inletId);
  const inletName = inlet?.name || inletId?.replace(/-/g, ' ') || 'East Coast';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && status === 'connected') {
      inputRef.current?.focus();
    }
  }, [isOpen, status]);

  const handleSend = async () => {
    if (message.trim() && status === 'connected') {
      await sendMessage(message);
      setMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  if (!isOpen || !flags.communityDrawer) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed z-50 bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/20
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        
        /* Desktop: right sidebar */
        lg:right-0 lg:top-0 lg:h-full lg:w-96
        
        /* Mobile: bottom sheet */
        right-0 bottom-0 left-0 h-[80vh] rounded-t-2xl lg:rounded-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Community Chat</h2>
            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <span className="text-sm text-cyan-300">{inletName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Boats online count */}
            <div className="flex items-center gap-2 text-sm">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">boats online: {presenceCount}</span>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <Circle className={`w-2 h-2 fill-current ${
                status === 'connected' ? 'text-green-400' : 
                status === 'connecting' ? 'text-yellow-400 animate-pulse' : 
                'text-red-400'
              }`} />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100%-8rem)]">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <p>No messages yet in {inletName} chat.</p>
              <p className="text-xs mt-2">Be the first to say hello!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === userId;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center 
                      text-sm font-bold flex-shrink-0 ring-2 
                      ${isOwnMessage 
                        ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' 
                        : 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30'
                      }
                    `}>
                      {(msg.user_name || 'A').charAt(0).toUpperCase()}
                    </div>

                    {/* Message content */}
                    <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                        <span className="text-sm font-medium text-white">
                          {msg.user_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div className={`
                        inline-block px-4 py-2 rounded-lg text-sm
                        ${isOwnMessage 
                          ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20' 
                          : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                        }
                      `}>
                        {highlightMentions(msg.text, userName)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cyan-500/20">
          {!userId ? (
            <div className="text-center text-slate-400 py-3">
              <p className="text-sm">Please sign in to send messages</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  status === 'connected' ? 'Type a message...' :
                  status === 'connecting' ? 'Connecting...' :
                  'Disconnected - check your connection'
                }
                disabled={status !== 'connected'}
                className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl 
                         text-white placeholder-slate-400 
                         focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || status !== 'connected'}
                className="px-4 py-3 bg-cyan-500 text-white rounded-xl 
                         hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] 
                         hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
