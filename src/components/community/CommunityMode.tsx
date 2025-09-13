'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Users, Fish, Wind, Waves, Thermometer, Navigation, Camera } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';
import { initChatClient, ChatMessage } from '@/lib/services/chat';
import { highlightMentions } from '@/lib/chat/mentions';

interface WeatherData {
  wind: { speed: number; direction: string };
  waves: { height: number; period: number };
  waterTemp: number;
  tide: { type: string; time: string };
  visibility: number;
}

interface CatchReport {
  id: string;
  captain: string;
  boatName?: string;
  location: string;
  species: string;
  description: string;
  timestamp: number;
  hasPhoto: boolean;
}

export default function CommunityMode() {
  const { selectedInletId, username } = useAppState();
  const inlet = getInletById(selectedInletId) ?? DEFAULT_INLET;
  const [boatName, setBoatName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recentCatches, setRecentCatches] = useState<CatchReport[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef(initChatClient());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get boat name on mount
  useEffect(() => {
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
  }, []);

  // Load mock weather data (will replace with NOAA API)
  useEffect(() => {
    // Mock data for now
    setWeather({
      wind: { speed: 12, direction: 'NE' },
      waves: { height: 3, period: 6 },
      waterTemp: 58,
      tide: { type: 'High', time: '2:30 PM' },
      visibility: 10
    });

    // Mock recent catches
    setRecentCatches([
      {
        id: '1',
        captain: 'Captain Mike',
        boatName: 'Reel Deal',
        location: 'Montauk Point',
        species: 'Striped Bass',
        description: '3 Stripers, 28-32"',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        hasPhoto: false
      },
      {
        id: '2',
        captain: 'Captain Sarah',
        boatName: 'Blue Horizon',
        location: 'Block Island',
        species: 'Bluefin Tuna',
        description: 'Bluefin on!',
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        hasPhoto: false
      }
    ]);
  }, []);

  // Subscribe to chat
  useEffect(() => {
    if (!username) return;
    
    const client = clientRef.current;
    let mounted = true;

    const setup = async () => {
      await client.subscribe(selectedInletId ?? 'default', (msg) => {
        if (!mounted) return;
        setMessages(prev => [...prev, msg]);
      });

      const recent = await client.loadRecent(selectedInletId ?? 'default');
      if (mounted) setMessages(recent);
    };

    setup();

    return () => {
      mounted = false;
      client.unsubscribe();
    };
  }, [selectedInletId, username]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get online users from recent messages
  const onlineUsers = (() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const userMap = new Map<string, { lastSeen: number; boatName?: string }>();
    
    messages.forEach(msg => {
      if (msg.createdAt > cutoff && msg.user) {
        userMap.set(msg.user, {
          lastSeen: msg.createdAt,
          boatName: msg.user === username ? boatName : undefined
        });
      }
    });

    if (username) {
      userMap.set(username, {
        lastSeen: Date.now(),
        boatName
      });
    }

    return Array.from(userMap.entries()).map(([user, data]) => ({
      user,
      ...data
    }));
  })();

  const sendMessage = async () => {
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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 flex">
      {/* Blurred Map Background */}
      <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none">
        {/* Map renders behind this */}
      </div>

      {/* Left Panel */}
      <div className="w-80 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-md border-r border-cyan-500/20 flex flex-col">
        
        {/* Active Captains */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-300">Active Captains</h3>
            <span className="ml-auto text-xs text-cyan-400/60">
              {onlineUsers.length} online
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {onlineUsers.map(({ user, boatName, lastSeen }) => (
              <div key={user} className="flex items-start gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors">
                <div className="h-2 w-2 rounded-full bg-green-400 mt-1.5 animate-pulse" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{user}</div>
                  {boatName && (
                    <div className="text-xs text-cyan-400/70">🚤 {boatName}</div>
                  )}
                  <div className="text-xs text-white/40">{formatTime(lastSeen || Date.now())}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Widget */}
        {weather && (
          <div className="p-4 border-b border-cyan-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={18} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-300">Current Conditions</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Wind size={12} /> Wind
                </span>
                <span className="text-white">{weather.wind.speed} kts {weather.wind.direction}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Waves size={12} /> Seas
                </span>
                <span className="text-white">{weather.waves.height} ft @ {weather.waves.period}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Thermometer size={12} /> Water
                </span>
                <span className="text-white">{weather.waterTemp}°F</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Navigation size={12} /> Tide
                </span>
                <span className="text-white">{weather.tide.type} @ {weather.tide.time}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Catches */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Fish size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-300">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentCatches.map(catchReport => (
              <div key={catchReport.id} className="bg-black/40 rounded-lg p-3 border border-cyan-500/10">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-sm font-medium text-white">{catchReport.captain}</div>
                    {catchReport.boatName && (
                      <div className="text-xs text-cyan-400/70">🚤 {catchReport.boatName}</div>
                    )}
                  </div>
                  <span className="text-xs text-white/40">{formatTime(catchReport.timestamp)}</span>
                </div>
                <div className="text-xs text-white/60 mb-1">📍 {catchReport.location}</div>
                <div className="text-sm text-white">{catchReport.description}</div>
                {!catchReport.hasPhoto && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400/50">
                    <Camera size={12} />
                    <span>Photo coming soon</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col bg-black/70 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-black/40 rounded-lg p-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-cyan-300">{msg.user}</span>
                  <span className="text-xs text-white/40">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-white/90">
                  {highlightMentions(msg.text, username || '')}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-cyan-500/20">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-black/60 border border-cyan-500/30 rounded-lg px-4 py-2 text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/50"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:from-cyan-500 hover:to-teal-500 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
