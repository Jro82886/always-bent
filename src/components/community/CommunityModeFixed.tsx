'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Users, Wind, Waves, Thermometer, MapPin, Send, Mail } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { INLETS, getInletById } from '@/lib/inlets';
import ChatClient, { ChatMessage } from '@/lib/chat/ChatClient';
import ReportsFeed from './ReportsFeed';
import BuoyWeatherWidget from './BuoyWeatherWidget';

interface WeatherData {
  wind: { speed: number; direction: string };
  waves: { height: number; period: number };
  waterTemp: number;
  tide: { type: string; time: string };
  visibility: number;
  location: 'inlet' | 'offshore';
  buoyId?: string;
}

interface OnlineCaptain {
  name: string;
  captainName?: string;
  boatName?: string;
  lastSeen: number;
  isOnline: boolean;
  inletId?: string;
}

export default function CommunityModeFixed() {
  const { selectedInletId } = useAppState();
  const inlet = getInletById(selectedInletId) || INLETS[0];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineCaptains, setOnlineCaptains] = useState<OnlineCaptain[]>([]);
  const [activePanel, setActivePanel] = useState<'chat' | 'dm' | 'reports'>('chat');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatClientRef = useRef<ChatClient | null>(null);

  // Get user info from localStorage
  const captainName = typeof window !== 'undefined' ? localStorage.getItem('abfi_captain_name') || 'Anonymous' : 'Anonymous';
  const boatName = typeof window !== 'undefined' ? localStorage.getItem('abfi_boat_name') || 'Unknown Vessel' : 'Unknown Vessel';

  // Initialize chat
  useEffect(() => {
    if (!inlet) return;
    
    const client = new ChatClient();
    chatClientRef.current = client;
    
    // Load recent messages and subscribe to new ones
    client.subscribe(inlet.id, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    client.loadRecent(inlet.id).then(recent => {
      setMessages(recent);
    });
    
    
    // Mock online captains
    setOnlineCaptains([
      { name: captainName, boatName, lastSeen: Date.now(), isOnline: true, inletId: inlet.id }
    ]);
    
    return () => {
      client.unsubscribe();
    };
  }, [inlet, captainName, boatName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatClientRef.current) return;
    
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: inputMessage,
      user: captainName,
      captainName: captainName,
      boatName: boatName,
      createdAt: Date.now(),
      inletId: inlet.id
    };
    
    await chatClientRef.current.send(msg);
    setInputMessage('');
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Header with proper spacing from top */}
      <div className="absolute top-16 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h1 className="text-lg font-bold text-white">Community Hub</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-cyan-500/20">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white">{inlet.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineCaptains.length} Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with proper top spacing */}
      <div className="pt-32 h-full flex">
        {/* Left Sidebar - Weather & Stats */}
        <div className="w-80 bg-black/40 backdrop-blur-md border-r border-cyan-500/20 p-4 overflow-y-auto">
          {/* Weather Widget - Using real NOAA buoy data */}
          <BuoyWeatherWidget inletId={selectedInletId} />

          {/* Online Captains */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-cyan-500/20">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3">Online Now</h3>
            <div className="space-y-2">
              {onlineCaptains.map((captain, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white">{captain.name}</span>
                  {captain.boatName && (
                    <span className="text-gray-500 text-xs">• {captain.boatName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Panel Tabs */}
          <div className="bg-black/40 backdrop-blur-md border-b border-cyan-500/20 px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActivePanel('chat')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activePanel === 'chat' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Inlet Chat
              </button>
              <button
                onClick={() => setActivePanel('dm')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activePanel === 'dm' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Direct Messages
                {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                  <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActivePanel('reports')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activePanel === 'reports' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Reports Feed
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.user === captainName ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.user === captainName 
                          ? 'bg-cyan-500/20 text-white border border-cyan-500/40' 
                          : 'bg-gray-800/50 text-white border border-gray-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.user}</span>
                          {msg.boatName && (
                            <span className="text-xs text-gray-400">• {msg.boatName}</span>
                          )}
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-black/40 border-t border-cyan-500/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'dm' && (
              <div className="h-full p-4">
                <div className="text-center text-gray-400 mt-10">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Direct Messages coming soon</p>
                </div>
              </div>
            )}

            {activePanel === 'reports' && (
              <ReportsFeed />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
