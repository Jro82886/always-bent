// Mock ChatClient for Community Mode
// TODO: Replace with real WebSocket/Supabase implementation

export interface ChatMessage {
  id: string;
  user: string;
  captainName?: string;
  boatName?: string;
  inletId?: string;
  text: string;
  createdAt: number;
  speciesId?: string;
  channelType?: 'inlet' | 'species' | 'dm';
}

export default class ChatClient {
  private channel: string = '';
  private messageCallback: ((msg: ChatMessage) => void) | null = null;

  async subscribe(channel: string, onMessage: (msg: ChatMessage) => void) {
    this.channel = channel;
    this.messageCallback = onMessage;
    
    // Mock: Simulate incoming messages periodically
    // In production, this would be WebSocket or Supabase Realtime
    
  }

  async unsubscribe() {
    this.channel = '';
    this.messageCallback = null;
    
  }

  async send(message: ChatMessage): Promise<void> {
    // Mock: Just echo back the message
    // In production, this would send to Supabase
    const sentMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: Date.now()
    };
    
    if (this.messageCallback) {
      setTimeout(() => {
        this.messageCallback?.(sentMessage);
      }, 100);
    }
  }

  async loadRecent(channel: string): Promise<ChatMessage[]> {
    // Mock: Return some demo messages
    // In production, this would query Supabase
    return [
      {
        id: 'demo1',
        user: 'CaptainMike',
        captainName: 'Mike Johnson',
        boatName: 'Reel Deal',
        inletId: channel,
        text: 'Water temp looking good at 68°F, seeing bait everywhere!',
        createdAt: Date.now() - 300000,
        channelType: 'inlet'
      },
      {
        id: 'demo2',
        user: 'SaltyDog',
        captainName: 'Tom Waters',
        boatName: 'Wave Runner',
        inletId: channel,
        text: 'Just marked a nice school on the sounder, 2 miles SE of the inlet',
        createdAt: Date.now() - 600000,
        channelType: 'inlet'
      }
    ];
  }
}
