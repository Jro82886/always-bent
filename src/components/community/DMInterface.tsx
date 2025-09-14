'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, X, Users, MessageCircle, Clock, Check, CheckCheck, 
  MoreVertical, Paperclip, Smile, Phone, Video, Info, Star,
  UserPlus, Settings, Archive, Trash2, Pin, Bell, BellOff
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Format message time
  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
    return format(date, 'MMM d, HH:mm');
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
      <div className="w-80 border-r border-cyan-500/10 flex flex-col bg-black/20">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-cyan-300">Direct Messages</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                title="New conversation"
              >
                <UserPlus size={18} className="text-cyan-400" />
              </button>
              <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                <Settings size={18} className="text-cyan-400" />
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-800/50 border border-cyan-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/40"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={48} className="mx-auto text-cyan-500/20 mb-3" />
              <p className="text-cyan-400/60 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Start a conversation →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-cyan-500/5">
              {filteredConversations.map(conv => {
                const otherUser = conv.participants[0];
                const isSelected = selectedConversation === conv.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 hover:bg-cyan-500/5 transition-all text-left relative ${
                      isSelected ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    {/* Pin indicator */}
                    {conv.isPinned && (
                      <Pin size={12} className="absolute top-2 right-2 text-cyan-400/50" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* Avatar/Status */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                          <span className="text-cyan-300 font-semibold">
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
                          <span className="text-xs text-cyan-400/50 ml-2">
                            {conv.lastMessage && formatMessageTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        
                        {otherUser.boatName && (
                          <div className="text-xs text-cyan-400/60 mb-1">
                            🚤 {otherUser.boatName}
                          </div>
                        )}
                        
                        {conv.lastMessage && (
                          <div className="flex items-center gap-1">
                            {conv.lastMessage.senderId === 'self' && (
                              <span className="text-cyan-400/50">
                                {conv.lastMessage.delivered ? 
                                  (conv.lastMessage.read ? <CheckCheck size={14} /> : <Check size={14} />) 
                                  : <Clock size={14} />
                                }
                              </span>
                            )}
                            <p className="text-sm text-cyan-100/60 truncate">
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        )}
                        
                        {/* Typing indicator */}
                        {conv.typing?.some(t => t.isTyping) && (
                          <div className="text-xs text-cyan-400 italic mt-1">
                            typing...
                          </div>
                        )}
                      </div>
                      
                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <div className="bg-cyan-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
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
          <div className="p-4 border-b border-cyan-500/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-cyan-300 font-semibold">
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
                  <p className="text-xs text-cyan-400/60">
                    {formatLastSeen(
                      currentConversation.participants[0].lastSeen,
                      currentConversation.participants[0].isOnline
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                  <Phone size={18} className="text-cyan-400" />
                </button>
                <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                  <Video size={18} className="text-cyan-400" />
                </button>
                <button 
                  onClick={() => setShowConversationInfo(!showConversationInfo)}
                  className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <Info size={18} className="text-cyan-400" />
                </button>
                <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                  <MoreVertical size={18} className="text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Date separator */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-cyan-500/10" />
              <span className="text-xs text-cyan-400/50">Today</span>
              <div className="flex-1 h-px bg-cyan-500/10" />
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
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30' 
                      : 'bg-slate-800/50 border border-slate-700/30'
                  } rounded-2xl px-4 py-2.5`}>
                    {!isSelf && sender && (
                      <div className="text-cyan-400 text-xs font-semibold mb-1">
                        {sender.captainName || sender.username}
                      </div>
                    )}
                    <p className="text-sm text-white">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-cyan-400/40">
                        {format(msg.timestamp, 'HH:mm')}
                      </span>
                      {isSelf && (
                        <span className="text-cyan-400/50">
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
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-cyan-500/10 bg-black/20">
            <div className="flex items-end gap-2">
              <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                <Paperclip size={20} className="text-cyan-400" />
              </button>
              
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
                  className="w-full bg-slate-800/50 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/40 resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <Smile size={20} className="text-cyan-400" />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle size={64} className="mx-auto text-cyan-500/20 mb-4" />
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">Select a conversation</h3>
            <p className="text-cyan-400/60 text-sm">Choose a conversation from the list or start a new one</p>
          </div>
        </div>
      )}

      {/* Right Sidebar - Conversation Info (optional) */}
      {showConversationInfo && currentConversation && (
        <div className="w-80 border-l border-cyan-500/10 p-4 bg-black/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-cyan-300">Conversation Info</h3>
            <button 
              onClick={() => setShowConversationInfo(false)}
              className="p-1 hover:bg-cyan-500/10 rounded transition-colors"
            >
              <X size={18} className="text-cyan-400" />
            </button>
          </div>
          
          {/* User info */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-cyan-300 font-bold">
                  {currentConversation.participants[0].username[0].toUpperCase()}
                </span>
              </div>
              <h4 className="font-semibold text-white">
                {currentConversation.participants[0].captainName || currentConversation.participants[0].username}
              </h4>
              <p className="text-sm text-cyan-400/60">@{currentConversation.participants[0].username}</p>
              {currentConversation.participants[0].boatName && (
                <p className="text-sm text-cyan-400/60 mt-1">🚤 {currentConversation.participants[0].boatName}</p>
              )}
              {currentConversation.participants[0].status && (
                <p className="text-sm text-cyan-100/80 mt-2 italic">
                  "{currentConversation.participants[0].status}"
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-cyan-500/10">
              <button className="w-full flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-left">
                <Star size={18} className="text-cyan-400" />
                <span className="text-sm text-white">Add to favorites</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-left">
                {currentConversation.isMuted ? (
                  <>
                    <Bell size={18} className="text-cyan-400" />
                    <span className="text-sm text-white">Unmute notifications</span>
                  </>
                ) : (
                  <>
                    <BellOff size={18} className="text-cyan-400" />
                    <span className="text-sm text-white">Mute notifications</span>
                  </>
                )}
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-left">
                <Archive size={18} className="text-cyan-400" />
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

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-md border border-cyan-500/20 shadow-2xl">
            <div className="p-4 border-b border-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-300">Start a conversation</h3>
                <button
                  onClick={() => setShowUserSearch(false)}
                  className="p-1 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-cyan-400" />
                </button>
              </div>
              
              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search captains..."
                  className="w-full bg-slate-800/50 border border-cyan-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/40"
                  autoFocus
                />
              </div>
            </div>
            
            {/* User list */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users size={32} className="mx-auto text-cyan-500/20 mb-2" />
                  <p className="text-cyan-400/60 text-sm">No captains found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user.id)}
                      className="w-full p-3 hover:bg-cyan-500/10 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                            <span className="text-cyan-300 font-semibold">
                              {user.username[0].toUpperCase()}
                            </span>
                          </div>
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {user.captainName || user.username}
                          </div>
                          <div className="text-xs text-cyan-400/60">
                            @{user.username}
                            {user.boatName && ` • ${user.boatName}`}
                          </div>
                          {user.status && (
                            <div className="text-xs text-cyan-100/60 mt-0.5">
                              {user.status}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-cyan-400/40">
                          {formatLastSeen(user.lastSeen, user.isOnline)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => {
          // Handle file upload
          console.log('File selected:', e.target.files?.[0]);
        }}
      />
    </div>
  );
}
