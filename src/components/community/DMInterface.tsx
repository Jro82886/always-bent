'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, X, Users, MessageCircle, Clock, Check, CheckCheck, 
  MoreVertical, Smile, Phone, Video, Info, Star,
  UserPlus, Settings, Archive, Trash2, Pin, Bell, BellOff,
  Anchor, MapPin, ChevronRight, Shield
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface User {
  id: string;
  username: string;
  captainName?: string;
  boatName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  status?: string;
  inletId?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  attachments?: string[];
  replyTo?: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  typing?: { userId: string; isTyping: boolean }[];
}

export default function DMInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state - load from localStorage if available
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dm_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults if parse fails
      }
    }
    return {
      notifications: true,
      soundEnabled: true,
      showOnlineStatus: true,
      messageHistory: '30', // days
      autoDeleteOld: true,
      readReceipts: true,
      typingIndicators: true
    };
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data - replace with real data from your backend
  const [users] = useState<User[]>([
    {
      id: '1',
      username: 'CaptainMike',
      captainName: 'Mike Johnson',
      boatName: 'Reel Deal',
      isOnline: true,
      lastSeen: new Date(),
      status: 'Out fishing 🎣',
      inletId: 'montauk'
    },
    {
      id: '2',
      username: 'SaltyDog',
      captainName: 'Tom Waters',
      boatName: 'Wave Runner',
      isOnline: true,
      lastSeen: new Date(Date.now() - 5 * 60000),
      status: 'Heading offshore',
      inletId: 'shinnecock'
    },
    {
      id: '3',
      username: 'ReelQueen',
      captainName: 'Sarah Martinez',
      boatName: 'Sea Dreams',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 3600000),
      inletId: 'fire-island'
    },
    {
      id: '4',
      username: 'BigTuna',
      captainName: 'John Smith',
      boatName: 'Tuna Hunter',
      isOnline: true,
      lastSeen: new Date(),
      status: 'Trolling the canyon',
      inletId: 'montauk'
    }
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participants: [users[0]],
      lastMessage: {
        id: 'm1',
        conversationId: '1',
        senderId: '1',
        content: 'Just found a huge school of bunker!',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        delivered: true
      },
      unreadCount: 2,
      isPinned: true
    },
    {
      id: '2',
      participants: [users[1]],
      lastMessage: {
        id: 'm2',
        conversationId: '2',
        senderId: 'self',
        content: 'Thanks for the tip on the north rip',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        delivered: true
      },
      unreadCount: 0
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      conversationId: '1',
      senderId: '1',
      content: 'Hey, you out today?',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: true,
      delivered: true
    },
    {
      id: 'm2',
      conversationId: '1',
      senderId: 'self',
      content: 'Yeah, heading out to the canyon',
      timestamp: new Date(Date.now() - 25 * 60000),
      read: true,
      delivered: true
    },
    {
      id: 'm3',
      conversationId: '1',
      senderId: '1',
      content: 'Nice! Water temp looking good at 68°',
      timestamp: new Date(Date.now() - 20 * 60000),
      read: true,
      delivered: true
    },
    {
      id: 'm4',
      conversationId: '1',
      senderId: '1',
      content: 'Just found a huge school of bunker!',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false,
      delivered: true
    }
  ]);

  // Filtered users for search
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.captainName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.boatName?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Filtered conversations
  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      return conv.participants.some(p => 
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.captainName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return !conv.isArchived;
  });

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = messages.filter(m => m.conversationId === selectedConversation);

  // Format message time (12-hour format)
  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  // Format last seen
  const formatLastSeen = (date: Date, isOnline: boolean) => {
    if (isOnline) return 'Online';
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // In real app, emit typing event to server
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // In real app, emit stop typing event
    }, 1000);
  };

  // Send message
  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    // Create new message
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: selectedConversation,
      senderId: 'self',
      content: messageInput.trim(),
      timestamp: new Date(),
      read: false,
      delivered: true
    };
    
    // Add message to state
    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation's last message
    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          lastMessage: newMessage
        };
      }
      return conv;
    }));
    
    // Clear input and typing state
    setMessageInput('');
    setIsTyping(false);
    
    // In real app, send to server
    console.log('Message sent:', newMessage);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Start new conversation
  const startConversation = (userId: string) => {
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participants.some(p => p.id === userId)
    );
    
    if (existing) {
      setSelectedConversation(existing.id);
    } else {
      // Create new conversation
      const user = users.find(u => u.id === userId);
      if (user) {
        const newConversation: Conversation = {
          id: `conv_${Date.now()}`,
          participants: [user],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false
        };
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation.id);
        console.log('Started new conversation with:', user.username);
      }
    }
    setShowUserSearch(false);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r border-emerald-500/20 flex flex-col bg-gradient-to-br from-emerald-950/30 to-green-950/30">
        {/* Header */}
        <div className="p-4 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-900/40 to-green-900/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-300">Direct Messages</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="New conversation"
              >
                <UserPlus size={18} className="text-emerald-400" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-emerald-500/10 text-emerald-400'
                }`}
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-emerald-950/30 border border-emerald-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400/40"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={48} className="mx-auto text-emerald-500/20 mb-3" />
              <p className="text-emerald-400/60 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                Start a conversation →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-emerald-500/5">
              {filteredConversations.map(conv => {
                const otherUser = conv.participants[0];
                const isSelected = selectedConversation === conv.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 hover:bg-emerald-500/5 transition-all text-left relative ${
                      isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''
                    }`}
                  >
                    {/* Pin indicator */}
                    {conv.isPinned && (
                      <Pin size={12} className="absolute top-2 right-2 text-emerald-400/50" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* Avatar/Status */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                          <span className="text-emerald-300 font-semibold">
                            {otherUser.username[0].toUpperCase()}
                          </span>
                        </div>
                        {otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-medium text-white truncate">
                            {otherUser.captainName || otherUser.username}
                          </span>
                          <span className="text-xs text-emerald-300/50 ml-2">
                            {conv.lastMessage && formatMessageTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        
                        {otherUser.boatName && (
                          <div className="text-xs text-emerald-300/60 mb-1">
                            🚤 {otherUser.boatName}
                          </div>
                        )}
                        
                        {conv.lastMessage && (
                          <div className="flex items-center gap-1">
                            {conv.lastMessage.senderId === 'self' && (
                              <span className="text-emerald-400/50">
                                {conv.lastMessage.delivered ? 
                                  (conv.lastMessage.read ? <CheckCheck size={14} /> : <Check size={14} />) 
                                  : <Clock size={14} />
                                }
                              </span>
                            )}
                            <p className="text-sm text-emerald-200/60 truncate">
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        )}
                        
                        {/* Typing indicator */}
                        {conv.typing?.some(t => t.isTyping) && (
                          <div className="text-xs text-emerald-400 italic mt-1">
                            typing...
                          </div>
                        )}
                      </div>
                      
                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <div className="bg-emerald-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center - Message Thread */}
      {selectedConversation && currentConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-emerald-500/10 bg-gray-950/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-emerald-300 font-semibold">
                      {currentConversation.participants[0].username[0].toUpperCase()}
                    </span>
                  </div>
                  {currentConversation.participants[0].isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-white">
                    {currentConversation.participants[0].captainName || currentConversation.participants[0].username}
                  </h3>
                  <p className="text-xs text-emerald-400/60">
                    {formatLastSeen(
                      currentConversation.participants[0].lastSeen,
                      currentConversation.participants[0].isOnline
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors">
                  <Phone size={18} className="text-emerald-400" />
                </button>
                <button className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors">
                  <Video size={18} className="text-emerald-400" />
                </button>
                <button 
                  onClick={() => setShowConversationInfo(!showConversationInfo)}
                  className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <Info size={18} className="text-emerald-400" />
                </button>
                <button className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors">
                  <MoreVertical size={18} className="text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Date separator */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-emerald-500/10" />
              <span className="text-xs text-emerald-400/50">Today</span>
              <div className="flex-1 h-px bg-emerald-500/10" />
            </div>
            
            {/* Messages */}
            {currentMessages.map(msg => {
              const isSelf = msg.senderId === 'self';
              const sender = isSelf ? null : users.find(u => u.id === msg.senderId);
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    isSelf 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30' 
                      : 'bg-slate-800/50 border border-slate-700/30'
                  } rounded-2xl px-4 py-2.5`}>
                    {!isSelf && sender && (
                      <div className="text-emerald-400 text-xs font-semibold mb-1">
                        {sender.captainName || sender.username}
                      </div>
                    )}
                    <p className="text-sm text-white">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-400/40">
                        {format(msg.timestamp, 'h:mm a')}
                      </span>
                      {isSelf && (
                        <span className="text-emerald-400/50">
                          {msg.delivered ? 
                            (msg.read ? <CheckCheck size={12} /> : <Check size={12} />) 
                            : <Clock size={12} />
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {currentConversation.typing?.some(t => t.isTyping) && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-emerald-500/10 bg-gray-950/50 relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 right-4 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-3 shadow-2xl z-50">
                <div className="grid grid-cols-8 gap-1 max-w-sm">
                  {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', 
                    '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
                    '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗',
                    '🤭', '🤔', '🤐', '😐', '😑', '😶', '😏', '😒',
                    '🙄', '😬', '😮', '😯', '😲', '😳', '🥺', '😦',
                    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
                    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
                    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                    '👏', '🙌', '👐', '🤝', '🙏', '✍️', '💪', '🦾',
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                    '🎣', '🚤', '⚓', '🌊', '🐟', '🐠', '🐡', '🦈',
                    '🐙', '🦀', '🦞', '🦐', '🦑', '🐚', '🏖️', '🌅'
                  ].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-2xl hover:bg-emerald-500/20 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-500/20">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-xs text-emerald-400/60 hover:text-emerald-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400/40 resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  showEmojiPicker ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <Smile size={20} />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle size={64} className="mx-auto text-emerald-500/20 mb-4" />
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">Select a conversation</h3>
            <p className="text-emerald-400/60 text-sm">Choose a conversation from the list or start a new one</p>
          </div>
        </div>
      )}

      {/* Right Sidebar - Conversation Info (optional) */}
      {showConversationInfo && currentConversation && (
        <div className="w-80 border-l border-emerald-500/10 p-4 bg-gray-950/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-emerald-300">Conversation Info</h3>
            <button 
              onClick={() => setShowConversationInfo(false)}
              className="p-1 hover:bg-emerald-500/10 rounded transition-colors"
            >
              <X size={18} className="text-emerald-400" />
            </button>
          </div>
          
          {/* User info */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-emerald-300 font-bold">
                  {currentConversation.participants[0].username[0].toUpperCase()}
                </span>
              </div>
              <h4 className="font-semibold text-white">
                {currentConversation.participants[0].captainName || currentConversation.participants[0].username}
              </h4>
              <p className="text-sm text-emerald-400/60">@{currentConversation.participants[0].username}</p>
              {currentConversation.participants[0].boatName && (
                <p className="text-sm text-emerald-400/60 mt-1">🚤 {currentConversation.participants[0].boatName}</p>
              )}
              {currentConversation.participants[0].status && (
                <p className="text-sm text-emerald-100/80 mt-2 italic">
                  "{currentConversation.participants[0].status}"
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-emerald-500/10">
              <button className="w-full flex items-center gap-3 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-left">
                <Star size={18} className="text-emerald-400" />
                <span className="text-sm text-white">Add to favorites</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-left">
                {currentConversation.isMuted ? (
                  <>
                    <Bell size={18} className="text-emerald-400" />
                    <span className="text-sm text-white">Unmute notifications</span>
                  </>
                ) : (
                  <>
                    <BellOff size={18} className="text-emerald-400" />
                    <span className="text-sm text-white">Mute notifications</span>
                  </>
                )}
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-left">
                <Archive size={18} className="text-emerald-400" />
                <span className="text-sm text-white">Archive conversation</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                <Trash2 size={18} className="text-red-400" />
                <span className="text-sm text-red-400">Delete conversation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Search Modal with Better Scrolling */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl border border-emerald-500/20 shadow-2xl" style={{ maxHeight: '85vh' }}>
            <div className="p-4 border-b border-emerald-500/10 sticky top-0 bg-slate-900/95 backdrop-blur-sm rounded-t-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300">Find Captains</h3>
                  <p className="text-xs text-emerald-400/60 mt-1">
                    {filteredUsers.length} captains {userSearchQuery && 'found'} • {users.filter(u => u.isOnline).length} online
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUserSearch(false);
                    setUserSearchQuery('');
                  }}
                  className="p-1 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-emerald-400" />
                </button>
              </div>
              
              {/* Enhanced Search with keyboard hint */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by name, boat, or inlet..."
                  className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-lg pl-9 pr-24 py-2.5 text-sm text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowUserSearch(false);
                      setUserSearchQuery('');
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-400/40">
                  <kbd className="px-1.5 py-0.5 bg-slate-700/50 text-emerald-400/60 rounded">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced User List with sections */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto text-emerald-500/20 mb-3" />
                  <p className="text-emerald-400/60 text-sm">No captains found</p>
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Online Captains Section */}
                  {filteredUsers.filter(u => u.isOnline).length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10 sticky top-0 z-5">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Online Captains ({filteredUsers.filter(u => u.isOnline).length})
                        </h4>
                      </div>
                      <div className="p-2">
                        {filteredUsers.filter(u => u.isOnline).map((user, index) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              startConversation(user.id);
                              setShowUserSearch(false);
                              setUserSearchQuery('');
                            }}
                            className="w-full p-3 hover:bg-emerald-500/10 rounded-lg transition-all text-left group focus:bg-emerald-500/20 focus:outline-none"
                            tabIndex={index + 1}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center group-hover:from-emerald-500/40 group-hover:to-teal-500/40 transition-colors">
                                  <span className="text-emerald-300 font-bold text-lg">
                                    {user.username[0].toUpperCase()}
                                  </span>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                    {user.captainName || user.username}
                                  </span>
                                  <span className="text-emerald-400/60 text-sm">
                                    @{user.username}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {user.boatName && (
                                    <span className="text-xs text-emerald-400/60 flex items-center gap-1">
                                      <Anchor size={10} />
                                      {user.boatName}
                                    </span>
                                  )}
                                  {user.inletId && (
                                    <span className="text-xs text-emerald-400/60 flex items-center gap-1">
                                      <MapPin size={10} />
                                      {user.inletId}
                                    </span>
                                  )}
                                  {user.status && (
                                    <span className="text-xs text-green-400/80">
                                      "{user.status}"
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <ChevronRight size={16} className="text-emerald-400/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Offline Captains Section */}
                  {filteredUsers.filter(u => !u.isOnline).length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-800/30 border-b border-emerald-500/10 sticky top-0 z-5">
                        <h4 className="text-xs font-semibold text-emerald-400/60 uppercase tracking-wider">
                          Offline Captains ({filteredUsers.filter(u => !u.isOnline).length})
                        </h4>
                      </div>
                      <div className="p-2">
                        {filteredUsers.filter(u => !u.isOnline).map((user, index) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              startConversation(user.id);
                              setShowUserSearch(false);
                              setUserSearchQuery('');
                            }}
                            className="w-full p-3 hover:bg-emerald-500/5 rounded-lg transition-all text-left group focus:bg-emerald-500/10 focus:outline-none opacity-75 hover:opacity-100"
                            tabIndex={filteredUsers.filter(u => u.isOnline).length + index + 1}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700/30 to-slate-600/30 flex items-center justify-center group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-colors">
                                  <span className="text-slate-400 group-hover:text-emerald-300 font-bold text-lg transition-colors">
                                    {user.username[0].toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white/70 group-hover:text-white transition-colors">
                                    {user.captainName || user.username}
                                  </span>
                                  <span className="text-emerald-400/40 text-sm">
                                    @{user.username}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {user.boatName && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Anchor size={10} />
                                      {user.boatName}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-600">
                                    Last seen {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              
                              <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-400/50 group-hover:translate-x-1 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Quick Actions Footer */}
            <div className="p-3 border-t border-emerald-500/10 bg-gray-950/50 rounded-b-2xl">
              <div className="flex items-center justify-between text-xs text-emerald-400/40">
                <span>Scroll to browse all captains • Click to start conversation</span>
                <span className="text-emerald-400">
                  Total: {users.length} captains
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stylized Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/95 via-emerald-950/20 to-slate-900/95 rounded-2xl w-full max-w-md border border-emerald-400/30 shadow-2xl overflow-hidden"
               style={{
                 boxShadow: '0 0 60px rgba(6, 182, 212, 0.15), inset 0 0 30px rgba(6, 182, 212, 0.05)'
               }}>
            {/* Header with ocean wave effect */}
            <div className="relative p-6 border-b border-emerald-400/20 bg-gradient-to-r from-emerald-900/30 via-teal-900/30 to-emerald-900/30">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/5 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-emerald-300 tracking-wide">Message Settings</h3>
                  <p className="text-xs text-emerald-400/60 mt-1">Configure your ABFI communication preferences</p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-emerald-400/10 rounded-xl transition-all hover:rotate-90 duration-300"
                >
                  <X size={20} className="text-emerald-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Notifications Section with icon */}
              <div className="group">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Notifications</h4>
                </div>
                <div className="space-y-3 pl-6">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Enable notifications</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Sound alerts</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) => setSettings({...settings, soundEnabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Privacy Section with icon */}
              <div className="group">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Privacy</h4>
                </div>
                <div className="space-y-3 pl-6">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Show online status</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.showOnlineStatus}
                        onChange={(e) => setSettings({...settings, showOnlineStatus: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Read receipts</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.readReceipts}
                        onChange={(e) => setSettings({...settings, readReceipts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Typing indicators</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.typingIndicators}
                        onChange={(e) => setSettings({...settings, typingIndicators: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Message History Section with icon */}
              <div className="group">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Message History</h4>
                </div>
                <div className="space-y-3 pl-6">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors">
                    <span className="text-sm text-white/90">Keep messages for</span>
                    <select
                      value={settings.messageHistory}
                      onChange={(e) => setSettings({...settings, messageHistory: e.target.value})}
                      className="bg-slate-800/80 border border-emerald-400/30 rounded-lg px-3 py-1.5 text-sm text-emerald-300 focus:outline-none focus:border-emerald-400 hover:bg-slate-800 transition-colors"
                      style={{
                        boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.1)'
                      }}
                    >
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="forever">Forever</option>
                    </select>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-400/5 transition-colors cursor-pointer">
                    <span className="text-sm text-white/90">Auto-delete old messages</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.autoDeleteOld}
                        onChange={(e) => setSettings({...settings, autoDeleteOld: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Clear Data Section */}
              <div className="pt-4 border-t border-emerald-400/10">
                <button
                  onClick={() => {
                    if (confirm('Clear all message history? This cannot be undone.')) {
                      setMessages([]);
                      setConversations([]);
                      localStorage.removeItem('dm_messages');
                      localStorage.removeItem('dm_conversations');
                      // Show success feedback
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 z-[60] backdrop-blur-sm';
                      toast.textContent = 'Message history cleared';
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 2000);
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 text-red-400 rounded-xl transition-all text-sm font-bold border border-red-500/30 flex items-center justify-center gap-2 group"
                  style={{
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  Clear All Messages
                </button>
              </div>
            </div>

            {/* Footer with branded buttons */}
            <div className="p-6 border-t border-emerald-400/20 bg-gradient-to-r from-emerald-950/20 via-slate-900/30 to-emerald-950/20">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 text-emerald-400 hover:text-emerald-300 transition-all text-sm font-bold uppercase tracking-wider hover:bg-emerald-400/5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save settings to localStorage
                    localStorage.setItem('dm_settings', JSON.stringify(settings));
                    setShowSettings(false);
                    // Show success feedback
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 px-6 py-3 rounded-xl border border-emerald-500/30 z-[60] backdrop-blur-sm shadow-2xl';
                    toast.innerHTML = '<div class="flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-semibold">Settings saved successfully</span></div>';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg transition-all text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
