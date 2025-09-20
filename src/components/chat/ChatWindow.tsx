'use client';

import { useState, useRef, useEffect } from 'react';
import { MOCK_MESSAGES, MOCK_PRESENCE } from '@/mocks/chat';
import { Send, AtSign } from 'lucide-react';
import WeatherHeader from './WeatherHeader';
import { useAppState } from '@/store/appState';

interface ChatWindowProps {
  roomId: string;
  showWeatherHeader?: boolean;
}

export default function ChatWindow({ roomId, showWeatherHeader }: ChatWindowProps) {
  const { selectedInletId } = useAppState();
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = MOCK_MESSAGES.filter(m => m.roomId === roomId);
  const isInletChat = roomId === 'inlet';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Show mentions dropdown when @ is typed
    if (value.endsWith('@')) {
      setShowMentions(true);
    } else if (showMentions && !value.includes('@')) {
      setShowMentions(false);
    }
    
    // Show typing indicator
    setIsTyping(value.length > 0);
  };

  const handleMention = (name: string) => {
    setMessage(message + name + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (message.trim()) {
      // In real app, would send message
      console.log('Sending:', message);
      setMessage('');
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Weather Header for Inlet Chat */}
      {isInletChat && <WeatherHeader inletId={selectedInletId || undefined} />}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-300 text-sm font-bold flex-shrink-0 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {msg.author.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-white">{msg.author}</span>
                <span className="text-xs font-medium opacity-70 text-slate-400">
                  {new Date(msg.createdAtIso).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="text-[15px] font-normal leading-6 text-slate-200 bg-white/5 px-4 py-2 rounded-lg inline-block border border-white/10 group-hover:border-cyan-500/20 transition-all duration-200">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-xs text-slate-500">
          typing...
        </div>
      )}

      {/* Mentions dropdown */}
      {showMentions && (
        <div className="absolute bottom-20 left-6 bg-slate-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl p-3 max-w-xs">
          <div className="text-xs text-slate-400 mb-2">Mention someone</div>
          {MOCK_PRESENCE.map(person => (
            <button
              key={person.userId}
              onClick={() => handleMention(person.name)}
              className="w-full text-left px-3 py-2 hover:bg-slate-700/50 rounded text-sm text-white transition-colors"
            >
              {person.name}
            </button>
          ))}
        </div>
      )}

      {/* Message composer */}
      <div className="border-t border-white/10 p-5 bg-gradient-to-b from-slate-900/50 to-slate-900/80 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full px-5 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 backdrop-blur-sm"
            />
            <button className="absolute right-2 top-2.5 text-slate-400 hover:text-cyan-400 transition-colors">
              <AtSign className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 focus:from-emerald-400 focus:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
