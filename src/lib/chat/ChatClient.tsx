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
  speciesId?: string; // Species group if in species chat
  channelType?: 'inlet' | 'species'; // Type of channel
}

type MessageCallback = (message: ChatMessage) => void;

class ChatClient {
  private messages: Map<string, ChatMessage[]> = new Map();
  private subscribers: Map<string, MessageCallback[]> = new Map();
  private currentChannel: string | null = null;

  constructor() {
    // Initialize with some mock messages for inlet chat
    const mockInletMessages: ChatMessage[] = [
      {
        id: '1',
        user: 'CaptainMike',
        captainName: 'Mike Johnson',
        boatName: 'Reel Deal',
        inletId: 'montauk',
        text: 'Great conditions out here today! Water temp at 68°F',
        createdAt: Date.now() - 1000 * 60 * 5, // 5 min ago
        channelType: 'inlet'
      },
      {
        id: '2',
        user: 'SaltyDog',
        captainName: 'Tom Waters',
        boatName: 'Wave Runner',
        inletId: 'montauk',
        text: 'Anyone seeing bait schools near the point?',
        createdAt: Date.now() - 1000 * 60 * 3, // 3 min ago
        channelType: 'inlet'
      },
    ];
    
    // Mock messages for species channels
    const mockTunaMessages: ChatMessage[] = [
      {
        id: '3',
        user: 'TunaHunter',
        captainName: 'Jack Turner',
        boatName: 'Blue Horizon',
        inletId: 'montauk',
        speciesId: 'tuna',
        text: '🎣 Marks 30 miles south, moving fast! Looks like bluefin.',
        createdAt: Date.now() - 1000 * 60 * 10,
        channelType: 'species'
      },
      {
        id: '4',
        user: 'CaptainMike',
        captainName: 'Mike Johnson',
        boatName: 'Reel Deal',
        inletId: 'montauk',
        speciesId: 'tuna',
        text: 'Heading that way now! What depth are you marking them?',
        createdAt: Date.now() - 1000 * 60 * 8,
        channelType: 'species'
      },
    ];
    
    const mockStriperMessages: ChatMessage[] = [
      {
        id: '5',
        user: 'StriperKing',
        captainName: 'Bob Davis',
        boatName: 'Bass Master',
        inletId: 'montauk',
        speciesId: 'stripers',
        text: '🐟 Crushing them on the outgoing tide! Live bunker doing work.',
        createdAt: Date.now() - 1000 * 60 * 15,
        channelType: 'species'
      },
    ];
    
    // Set up all the channels
    this.messages.set('montauk', mockInletMessages);
    this.messages.set('montauk-tuna', mockTunaMessages);
    this.messages.set('montauk-stripers', mockStriperMessages);
    this.messages.set('montauk-sharks', []);
    this.messages.set('montauk-bottom', []);
    this.messages.set('montauk-offshore', []);
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
