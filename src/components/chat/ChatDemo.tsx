'use client';

import { useState, useEffect } from 'react';
import { Send, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  'inlet:md-ocean-city': [
    {
      id: '1',
      user: 'CaptainMike',
      text: 'Good morning everyone! Anyone seeing bait near the inlet?',
      timestamp: '8:15 AM'
    },
    {
      id: '2', 
      user: 'FishermanJoe',
      text: 'Just saw some bunker schools moving south past the jetties.',
      timestamp: '8:22 AM'
    },
    {
      id: '3',
      user: 'SaltwaterAngler',
      text: 'Thanks for the intel, Joe! Heading out now.',
      timestamp: '8:25 AM'
    },
    {
      id: '4',
      user: 'FlounderFanatic',
      text: 'Water clarity is great near the bridge this morning.',
      timestamp: '8:45 AM'
    }
  ],
  'offshore:tuna': [
    {
      id: '10',
      user: 'DeepSeaHunter',
      text: 'Yellowfin bite is hot 40 miles offshore! Water temp 78.5°F.',
      timestamp: '6:30 AM'
    },
    {
      id: '11',
      user: 'TunaChaser', 
      text: 'Copy that! Heading out now. Any specific color working?',
      timestamp: '6:45 AM'
    },
    {
      id: '12',
      user: 'DeepSeaHunter',
      text: 'Green machines and ballyhoo have been consistent.',
      timestamp: '7:15 AM'
    }
  ],
  'inshore:general': [
    {
      id: '20',
      user: 'BayFisher',
      text: 'Speckled trout bite is insane on the grass beds!',
      timestamp: '7:00 AM'
    },
    {
      id: '21',
      user: 'FlatsHunter',
      text: 'Nice! What are you using for trout?',
      timestamp: '7:15 AM'
    },
    {
      id: '22',
      user: 'BayFisher',
      text: 'Live shrimp under a popping cork. Can\'t miss.',
      timestamp: '7:20 AM'
    }
  ]
};

interface ChatDemoProps {
  channelId: string;
  selectedTab: 'inlet' | 'offshore' | 'inshore';
}

export default function ChatDemo({ channelId, selectedTab }: ChatDemoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username] = useState('DemoUser');

  useEffect(() => {
    const demoMessages = DEMO_MESSAGES[channelId] || [];
    setMessages(demoMessages);
  }, [channelId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: username,
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getChannelTitle = () => {
    switch (selectedTab) {
      case 'inlet': return 'Ocean City Inlet';
      case 'offshore': return 'Tuna (Offshore)';
      case 'inshore': return 'Inshore';
      default: return 'Chat';
    }
  };

  const getOnlineCount = () => {
    switch (selectedTab) {
      case 'inlet': return 5;
      case 'offshore': return 12;
      case 'inshore': return 8;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{getChannelTitle()}</h3>
          <div className="flex items-center gap-2 text-sm text-cyan-300">
            <Users className="w-4 h-4" />
            <span>{getOnlineCount()} online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <p>No messages yet — be the first to say hi!</p>
            <p className="text-xs mt-1 opacity-70">Share water temp, clarity, or where the fleet is moving.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-cyan-300 border border-cyan-500/30">
                {msg.user[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{msg.user}</span>
                  <span className="text-xs text-slate-400">{msg.timestamp}</span>
                </div>
                <div className="text-cyan-50 bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-700/50">
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-slate-900/60 border-t border-cyan-500/20">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share conditions, bites, or fleet moves..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-800/60 border border-cyan-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 resize-none"
              style={{ minHeight: '48px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 focus:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-cyan-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Press Enter to send • Demo mode active
        </div>
      </div>
    </div>
  );
}
