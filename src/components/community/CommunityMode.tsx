'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Users, Fish, Wind, Waves, Thermometer, Navigation, Camera, MapPin, Anchor, Send } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { INLETS, getInletById } from '@/lib/inlets';
import { INLET_COLORS } from '@/lib/inletColors';
import ChatClient, { ChatMessage } from '@/lib/chat/ChatClient';
import { highlightMentions } from '@/lib/chat/mentions';

interface WeatherData {
  wind: { speed: number; direction: string };
  waves: { height: number; period: number };
  waterTemp: number;
  tide: { type: string; time: string };
  visibility: number;
  location: 'inlet' | 'offshore';
  buoyId?: string;
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
  inletId?: string;
}

interface OnlineCaptain {
  name: string;
  captainName?: string;
  boatName?: string;
  lastSeen: number;
  isOnline: boolean;
  inletId?: string;
}

export default function CommunityMode() {
  const { selectedInletId, username } = useAppState();
  const inlet = getInletById(selectedInletId) || INLETS[0];
  const [captainName, setCaptainName] = useState<string>('');
  const [boatName, setBoatName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recentCatches, setRecentCatches] = useState<CatchReport[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef(new ChatClient());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get captain and boat name on mount
  useEffect(() => {
    const storedCaptainName = localStorage.getItem('abfi_captain_name');
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedCaptainName) setCaptainName(storedCaptainName);
    if (storedBoatName) setBoatName(storedBoatName);
  }, []);

  // Load mock weather data (will replace with NOAA API)
  useEffect(() => {
    // Mock data - future: fetch from NOAA based on inlet
    // Map inlets to their closest NOAA buoys
    const buoyMap: Record<string, string> = {
      'montauk': '44017', // Montauk Point - 23 NM SSW
      'shinnecock': '44025', // Long Island - 33 NM South  
      'fire-island': '44025', // Long Island Buoy
      'jones': '44025', // Long Island Buoy
      'manasquan': '44091', // Barnegat - 16 NM East
      'barnegat': '44091', // Barnegat Bay
      'atlantic-city': '44091', // Barnegat (closest)
      'cape-may': '44009', // Delaware Bay - 26 NM SE
      'indian-river': '44009', // Delaware Bay
      'ocean-city-md': '44009', // Delaware Bay
      'virginia-beach': '44014', // Virginia Beach - 64 NM East
      'oregon-inlet': '44014', // Virginia Beach (closest)
      'hatteras': '41025', // Diamond Shoals
      'overview': '44025' // Default to Long Island
    };
    
    setWeather({
      wind: { speed: 12, direction: 'NE' },
      waves: { height: 3, period: 7 },
      waterTemp: 68,
      tide: { type: 'Rising', time: '2:45 PM' },
      visibility: 10,
      location: 'inlet',
      buoyId: buoyMap[selectedInletId || 'overview'] || '44025'
    });
    
    // Mock recent catches
    setRecentCatches([
      {
        id: '1',
        captain: 'Captain Mike',
        boatName: 'Reel Deal',
        location: 'North Rip',
        species: 'Striped Bass',
        description: '32" keeper on the troll with umbrella rig',
        timestamp: Date.now() - 1000 * 60 * 30,
        hasPhoto: false,
        inletId: selectedInletId
      },
      {
        id: '2',
        captain: 'Sarah',
        boatName: 'Sea Dreams',
        location: 'South Shoal',
        species: 'Bluefish',
        description: 'Blitz on bunker schools! Non-stop action',
        timestamp: Date.now() - 1000 * 60 * 45,
        hasPhoto: false,
        inletId: selectedInletId
      }
    ]);
  }, [selectedInletId]);

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

  // Get online users from recent messages and catches
  const onlineUsers: OnlineCaptain[] = (() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    const userMap = new Map<string, OnlineCaptain>();
    
    // Add from messages
    messages.forEach(msg => {
      if (!userMap.has(msg.user)) {
        userMap.set(msg.user, {
          name: msg.user,
          captainName: msg.captainName,
          boatName: msg.boatName,
          lastSeen: msg.createdAt,
          isOnline: msg.createdAt > cutoff,
          inletId: msg.inletId
        });
      }
    });
    
    // Add some mock online captains
    if (userMap.size < 3) {
      userMap.set('CaptainMike', {
        name: 'CaptainMike',
        captainName: 'Mike Johnson',
        boatName: 'Reel Deal',
        lastSeen: Date.now(),
        isOnline: true,
        inletId: selectedInletId
      });
      userMap.set('SaltyDog', {
        name: 'SaltyDog',
        captainName: 'Tom Waters',
        boatName: 'Wave Runner',
        lastSeen: Date.now() - 60000,
        isOnline: true,
        inletId: selectedInletId
      });
    }
    
    return Array.from(userMap.values())
      .sort((a, b) => b.lastSeen - a.lastSeen);
  })();

  // Filter online users for mentions
  const mentionableUsers = onlineUsers.filter(u => 
    u.isOnline && 
    u.name !== username &&
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const sendMessage = async () => {
    if (!text.trim() || !username) return;

    const msg: ChatMessage = {
      id: '',
      user: username,
      captainName: captainName,
      boatName: boatName,
      inletId: selectedInletId ?? 'default',
      text: text.trim(),
      createdAt: Date.now(),
    };

    await clientRef.current.send(msg);
    setText('');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    
    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      const hasSpace = afterAt.includes(' ');
      
      if (!hasSpace) {
        setMentionSearch(afterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: OnlineCaptain) => {
    const lastAtIndex = text.lastIndexOf('@');
    const newText = text.slice(0, lastAtIndex) + '@' + user.name + ' ';
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && mentionableUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < mentionableUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionableUsers.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionableUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInletColor = (inletId?: string) => {
    if (!inletId || inletId === 'overview') return null;
    return INLET_COLORS[inletId as keyof typeof INLET_COLORS]?.color || '#00ffff';
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Social Hub */}
      <div className="w-80 flex flex-col relative">
        {/* Smooth gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-slate-900/75 to-black/85 backdrop-blur-2xl" />
        
        {/* Subtle glow accent on the right edge */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
        
        <div className="relative flex flex-col h-full">
          {/* Weather Widget - NOW AT THE TOP */}
          {weather && (
            <div className="p-4">
              {/* Section Header */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-transparent blur-xl" />
                <div className="relative bg-gradient-to-r from-slate-800/60 to-transparent rounded-xl p-3 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
                      <Wind size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-blue-300 tracking-wide">
                        {inlet.name.toUpperCase()} CONDITIONS
                      </h3>
                      <p className="text-xs text-blue-400/60 mt-0.5">Closest NOAA buoy to inlet</p>
                    </div>
                    {weather.buoyId && (
                      <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                        Buoy {weather.buoyId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Weather Data */}
              <div className="space-y-2.5 bg-slate-800/20 rounded-lg p-3 border border-blue-500/10">
                {[
                  { icon: Wind, label: 'Wind', value: `${weather.wind.speed} kts ${weather.wind.direction}` },
                  { icon: Waves, label: 'Seas', value: `${weather.waves.height} ft @ ${weather.waves.period}s` },
                  { icon: Thermometer, label: 'Water', value: `${weather.waterTemp}°F` },
                  { icon: Navigation, label: 'Tide', value: `${weather.tide.type} @ ${weather.tide.time}` }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-white/60 flex items-center gap-2 text-xs">
                      <item.icon size={12} className="text-blue-400/60" />
                      {item.label}
                    </span>
                    <span className="text-white text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Captains Section */}
          <div className="p-4">
            {/* Section Header with Glow */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-transparent blur-xl" />
              <div className="relative bg-gradient-to-r from-slate-800/60 to-transparent rounded-xl p-3 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg backdrop-blur-sm">
                    <Users size={16} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-cyan-300 tracking-wide">ACTIVE CAPTAINS</h3>
                    <p className="text-xs text-cyan-400/60 mt-0.5">Online in {inlet.name}</p>
                  </div>
                  <div className="px-2.5 py-1 bg-cyan-500/15 rounded-full border border-cyan-500/30">
                    <span className="text-xs font-medium text-cyan-400">
                      {onlineUsers.filter(u => u.isOnline).length} online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Captain Cards */}
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20">
              {onlineUsers.filter(u => u.isOnline).map((captain, idx) => (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur" />
                  <div className="relative bg-gradient-to-r from-slate-800/30 to-transparent rounded-lg p-2.5 border border-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {captain.captainName || captain.name}
                          </span>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                          {captain.inletId && captain.inletId !== 'overview' && (
                            <div 
                              className="w-2 h-2 rounded-full shadow-lg"
                              style={{ 
                                backgroundColor: getInletColor(captain.inletId) || undefined,
                                boxShadow: `0 0 8px ${getInletColor(captain.inletId)}40`
                              }}
                              title={INLETS.find(i => i.id === captain.inletId)?.name}
                            />
                          )}
                        </div>
                        {captain.boatName && (
                          <div className="text-xs text-cyan-400/70 flex items-center gap-1 mt-1">
                            <Anchor size={10} />
                            {captain.boatName}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/40">{formatTime(captain.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Catches */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Section Header */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-transparent to-transparent blur-xl" />
              <div className="relative bg-gradient-to-r from-slate-800/60 to-transparent rounded-xl p-3 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg backdrop-blur-sm">
                    <Fish size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-green-300 tracking-wide">RECENT CATCHES</h3>
                    <p className="text-xs text-green-400/60 mt-0.5">Latest reports from the fleet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Catch Cards */}
            <div className="space-y-3">
              {recentCatches.map(catchReport => (
                <div key={catchReport.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur" />
                  <div className="relative bg-gradient-to-r from-slate-800/30 to-transparent rounded-lg p-3 border border-green-500/10 group-hover:border-green-500/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{catchReport.captain}</span>
                          {catchReport.inletId && catchReport.inletId !== 'overview' && (
                            <div 
                              className="w-2 h-2 rounded-full shadow-lg"
                              style={{ 
                                backgroundColor: getInletColor(catchReport.inletId) || undefined,
                                boxShadow: `0 0 8px ${getInletColor(catchReport.inletId)}40`
                              }}
                            />
                          )}
                        </div>
                        {catchReport.boatName && (
                          <div className="text-xs text-green-400/70 flex items-center gap-1 mt-0.5">
                            <Anchor size={10} />
                            {catchReport.boatName}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/40">{formatTime(catchReport.timestamp)}</span>
                    </div>
                    <div className="text-xs text-white/60 mb-1.5 flex items-center gap-1">
                      <MapPin size={10} className="text-green-400/60" />
                      {catchReport.location}
                    </div>
                    <div className="text-sm text-white/90">{catchReport.description}</div>
                    {!catchReport.hasPhoto && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-400/50">
                        <Camera size={12} />
                        <span>Photo coming soon</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-slate-900/40 to-black/50" />
        
        <div className="relative flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="group">
                  <div className="bg-gradient-to-r from-slate-800/20 to-transparent rounded-xl p-4 border border-cyan-500/5 group-hover:border-cyan-500/20 transition-all backdrop-blur-sm">
                    <div className="flex items-baseline gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-300">
                          {msg.captainName || msg.user}
                        </span>
                        {msg.boatName && (
                          <span className="text-xs text-cyan-400/60">• {msg.boatName}</span>
                        )}
                        {msg.inletId && msg.inletId !== 'overview' && (
                          <div 
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ 
                              backgroundColor: getInletColor(msg.inletId) || undefined,
                              boxShadow: `0 0 6px ${getInletColor(msg.inletId)}40`
                            }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-white/90 text-sm leading-relaxed">
                      {highlightMentions(msg.text, username || '')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input Area */}
          <div className="p-6 relative">
            {/* Top glow line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            
            {/* Mentions Dropdown - Positioned above the @ character */}
            {showMentions && mentionableUsers.length > 0 && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 max-w-[90%]">
                <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/30 overflow-hidden shadow-2xl">
                  <div className="text-xs text-cyan-400/70 px-3 py-2 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
                    Online Captains - Use ↑↓ to navigate, Enter to select
                  </div>
                  {mentionableUsers.map((user, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertMention(user)}
                      className={`w-full px-3 py-2.5 flex items-center gap-2 transition-all ${
                        idx === selectedMentionIndex 
                          ? 'bg-cyan-500/20 border-l-2 border-cyan-400' 
                          : 'hover:bg-cyan-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-white font-medium">
                          @{user.name}
                        </span>
                        {user.boatName && (
                          <span className="text-xs text-cyan-400/60">• {user.boatName}</span>
                        )}
                        {user.inletId && user.inletId !== 'overview' && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ 
                              backgroundColor: getInletColor(user.inletId) || undefined,
                              boxShadow: `0 0 6px ${getInletColor(user.inletId)}40`
                            }}
                          />
                        )}
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input Field */}
            <div className="max-w-3xl mx-auto">
              <div className="relative flex gap-3">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... Use @ to mention captains"
                    className="relative w-full bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/50 transition-all"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  className="relative group px-6 py-3 rounded-xl font-medium transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl transition-all group-hover:from-cyan-500 group-hover:to-teal-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-teal-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2 text-white">
                    Send
                    <Send size={16} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}