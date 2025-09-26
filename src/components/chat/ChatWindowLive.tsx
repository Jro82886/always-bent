'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

interface ChatWindowProps {
  roomId: string;
  showWeatherHeader?: boolean;
}

export default function ChatWindowLive({ roomId }: ChatWindowProps) {
  const { username } = useAppState();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use real-time chat hook
  const { messages, sendMessage, isConnected } = useRealtimeChat(roomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  };

  const handleSend = async () => {
    if (message.trim() && username) {
      await sendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format time from timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">{/* Removed bg gradient */}
      
      
      {/* Messages */}
      <div className="flex-1 abfi-scroll space-y-3 pr-4">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center text-cyan-200/80">
              <div className="text-base mb-2">No messages yet — be the first to say hi.</div>
              <div className="text-xs opacity-70">Share water temp, clarity, or where the fleet is moving.</div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id || `${msg.createdAt}-${msg.user}`} className="flex gap-2">
              <div className="text-cyan-300/80 text-xs mt-1 min-w-[80px]">{msg.user}</div>
              <div className="flex-1">
                <div className="text-cyan-50">{msg.text}</div>
                <div className="text-[11px] text-cyan-200/60 mt-1">{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {!username ? (
        <div className="text-center text-slate-400 py-3">
          <p className="text-sm">Please set your username to send messages</p>
        </div>
      ) : (
        <div className="backdrop-blur bg-black/20 rounded-xl px-2.5 py-2 flex items-end gap-2 shadow-[0_0_0_1px_rgba(255,255,255,.06)]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-cyan-50 placeholder:text-cyan-200/50 px-2 py-1"
            placeholder="Share conditions, bites, or fleet moves…"
            disabled={!isConnected}
            style={{ minHeight: '32px', maxHeight: '100px' }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || !isConnected}
            className="px-3 py-1.5 rounded-lg bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30 disabled:opacity-50 text-sm"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
