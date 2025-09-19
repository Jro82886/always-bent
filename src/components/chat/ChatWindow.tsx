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
    <div className="flex flex-col h-full bg-slate-950">
      {/* Weather Header for Inlet Chat */}
      {isInletChat && <WeatherHeader inletId={selectedInletId || undefined} />}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {msg.author.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-white">{msg.author}</span>
                <span className="text-xs text-slate-500">
                  {new Date(msg.createdAtIso).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="text-slate-300">{msg.text}</div>
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
        <div className="absolute bottom-16 left-4 right-4 bg-slate-800 border border-cyan-500/30 rounded-lg shadow-lg p-2 max-w-xs">
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
      <div className="border-t border-cyan-500/20 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <button className="absolute right-2 top-2.5 text-slate-400 hover:text-cyan-400 transition-colors">
              <AtSign className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
