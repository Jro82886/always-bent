// Mock Chat Client for Community Mode
// Future: Replace with real WebSocket/Supabase implementation

export interface ChatMessage {
  id: string;
  user: string;
  inletId: string;
  text: string;
  createdAt: number;
  boatName?: string;
  captainName?: string;
}

type MessageCallback = (message: ChatMessage) => void;

class ChatClient {
  private messages: Map<string, ChatMessage[]> = new Map();
  private subscribers: Map<string, MessageCallback[]> = new Map();
  private currentChannel: string | null = null;

  constructor() {
    // Initialize with some mock messages
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        user: 'CaptainMike',
        captainName: 'Mike Johnson',
        boatName: 'Reel Deal',
        inletId: 'montauk',
        text: 'Great conditions out here today! Water temp at 68°F',
        createdAt: Date.now() - 1000 * 60 * 5, // 5 min ago
      },
      {
        id: '2',
        user: 'SaltyDog',
        captainName: 'Tom Waters',
        boatName: 'Wave Runner',
        inletId: 'montauk',
        text: 'Anyone seeing bait schools near the point?',
        createdAt: Date.now() - 1000 * 60 * 3, // 3 min ago
      },
    ];
    
    this.messages.set('montauk', mockMessages);
    this.messages.set('default', []);
  }

  async subscribe(channel: string, callback: MessageCallback) {
    this.currentChannel = channel;
    
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    
    this.subscribers.get(channel)?.push(callback);
  }

  async unsubscribe() {
    if (this.currentChannel && this.subscribers.has(this.currentChannel)) {
      this.subscribers.delete(this.currentChannel);
    }
    this.currentChannel = null;
  }

  async loadRecent(channel: string): Promise<ChatMessage[]> {
    return this.messages.get(channel) || [];
  }

  async send(message: ChatMessage) {
    const channel = message.inletId;
    
    // Add ID and user info from localStorage
    const completeMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      captainName: localStorage.getItem('abfi_captain_name') || message.user,
      boatName: localStorage.getItem('abfi_boat_name') || undefined,
    };
    
    // Store message
    if (!this.messages.has(channel)) {
      this.messages.set(channel, []);
    }
    this.messages.get(channel)?.push(completeMessage);
    
    // Notify subscribers
    const callbacks = this.subscribers.get(channel) || [];
    callbacks.forEach(cb => cb(completeMessage));
    
    // Also notify if someone is subscribed to 'default' and this is their inlet
    if (channel !== 'default') {
      const defaultCallbacks = this.subscribers.get('default') || [];
      defaultCallbacks.forEach(cb => cb(completeMessage));
    }
  }
}

export default ChatClient;
