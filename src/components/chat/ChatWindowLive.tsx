'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AtSign, Circle } from 'lucide-react';
import RoomBar from './RoomBar';
import { useAppState } from '@/lib/store';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { highlightMentions } from '@/lib/chat/mentions';

interface ChatWindowProps {
  roomId: string;
  showWeatherHeader?: boolean;
}

export default function ChatWindowLive({ roomId, showWeatherHeader }: ChatWindowProps) {
  const { username } = useAppState();
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use real-time chat hook
  const { messages, sendMessage, isConnected, mode } = useRealtimeChat(roomId);
  
  // Use online presence
  const { onlineUsers } = useOnlinePresence(roomId);
  
  // Get room name for RoomBar
  const roomNames: Record<string, string> = {
    'inlet': 'Inlet Chat',
    'offshore': 'Offshore Chat',
    'inshore': 'Inshore Chat', 
    'tuna': 'Tuna Chat'
  };
  const roomName = roomNames[roomId] || 'Chat';

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
    
    // Show mentions dropdown when @ is typed
    if (value.endsWith('@')) {
      setShowMentions(true);
    } else if (showMentions && !value.includes('@')) {
      setShowMentions(false);
    }
  };

  const handleMention = (name: string) => {
    setMessage(message + name + ' ');
    setShowMentions(false);
    textareaRef.current?.focus();
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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Room Bar with connection status */}
      <div className="relative">
        <RoomBar roomId={roomId} roomName={roomName} isDM={false} />
        
        {/* Connection indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs">
          <Circle 
            className={`w-2 h-2 ${isConnected ? 'text-green-400' : 'text-red-400'} fill-current`} 
          />
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {mode === 'supabase' ? 'Live' : 'Local'}
          </span>
        </div>
      </div>
      
      {/* Online users bar */}
      {onlineUsers.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/50 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Online ({onlineUsers.length}):</span>
            <div className="flex gap-2 overflow-x-auto">
              {onlineUsers.map(user => (
                <div key={user.userId} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-full">
                  <Circle className={`w-2 h-2 fill-current ${
                    user.status === 'online' ? 'text-green-400' : 'text-yellow-400'
                  }`} />
                  <span className="text-white">{user.username}</span>
                  {user.username === username && <span className="text-cyan-400">(you)</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Container */}
      <div className="flex-1 m-4 abfi-card-bg rounded-xl overflow-hidden">
        <div className="h-full overflow-y-auto p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
              {mode === 'stub' && (
                <p className="text-xs mt-2 text-yellow-500">
                  Running in local mode - messages won't persist
                </p>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user === username;
              return (
                <div key={msg.id || `${msg.createdAt}-${msg.user}`} className={`flex gap-4 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] ${
                    isOwnMessage 
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300 ring-emerald-500/30' 
                      : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 ring-cyan-500/30'
                  }`}>
                    {msg.user.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium text-white">{msg.user}</span>
                      <span className="text-xs font-medium opacity-70 text-slate-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className={`text-[15px] font-normal leading-6 px-4 py-2 rounded-lg inline-block border transition-all duration-200 ${
                      isOwnMessage 
                        ? 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20 group-hover:border-emerald-500/30' 
                        : 'bg-white/5 text-slate-200 border-white/10 group-hover:border-cyan-500/20'
                    }`}>
                      {highlightMentions(msg.text, username || '')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message composer */}
      <div className="border-t border-white/10 p-5 bg-gradient-to-b from-slate-900/50 to-slate-900/80 backdrop-blur-sm">
        {!username ? (
          <div className="text-center text-slate-400 py-3">
            <p>Please set your username to send messages</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                disabled={!isConnected}
                rows={1}
                className="w-full px-5 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 resize-none overflow-y-auto"
                style={{ minHeight: '48px', maxHeight: '100px' }}
              />
              <button className="absolute right-2 top-2.5 text-slate-400 hover:text-cyan-400 transition-colors">
                <AtSign className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim() || !isConnected}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 focus:from-emerald-400 focus:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
