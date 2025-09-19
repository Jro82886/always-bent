// Community types for Phase 2

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: string;
  seen: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  unread: number;
  online: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  author: string;
  text: string;
  createdAtIso: string;
  imageUrl?: string;
}

export interface Presence {
  userId: string;
  name: string;
  avatarUrl?: string;
  online: boolean;
  lastActiveIso?: string;
}

export interface Report {
  id: string;
  userId?: string; // Optional for anonymous highlights
  captainName?: string;
  inletId: string;
  createdAtIso: string;
  type: 'snip' | 'abfi' | 'analysis';
  analysisText: string;
  conditions: {
    sstF: number;
    windKt: number;
    windDir: string;
    swellFt: number;
    periodS: number;
  };
  // Snip specific
  rectangleBbox?: number[];
  // ABFI specific
  point?: [number, number];
  offlineCaptured?: boolean;
  // Highlight specific
  score?: number;
  isHighlight?: boolean;
  isAnonymous?: boolean;
}
