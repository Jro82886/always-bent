import { useState, useEffect } from 'react';
import { mockPresence } from '@/mocks/chatData';

interface OnlineUser {
  userId: string;
  username: string;
  status: 'online' | 'away';
}

interface UseOnlinePresenceReturn {
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export function useOnlinePresence(roomId: string): UseOnlinePresenceReturn {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const useMock = process.env.NEXT_PUBLIC_CHAT_MOCK === '1';

  useEffect(() => {
    if (useMock) {
      // Use mock presence data
      const count = mockPresence[roomId] || 0;
      setOnlineCount(count);
      
      // Generate some fake online users for display
      const mockUsers: OnlineUser[] = [];
      if (count > 0 && roomId.includes('inlet')) {
        mockUsers.push({ userId: '1', username: 'CaptainMike', status: 'online' });
        if (count > 1) mockUsers.push({ userId: '2', username: 'ReelDeal22', status: 'online' });
        if (count > 2) mockUsers.push({ userId: '3', username: 'SaltyDog', status: 'away' });
      } else if (count > 0 && roomId.includes('tuna')) {
        mockUsers.push({ userId: '4', username: 'BluefinBob', status: 'online' });
        if (count > 1) mockUsers.push({ userId: '5', username: 'TunaHunter', status: 'online' });
      } else if (count > 0 && roomId.includes('inshore')) {
        mockUsers.push({ userId: '6', username: 'BayRat', status: 'online' });
        if (count > 1) mockUsers.push({ userId: '7', username: 'FlatsHunter', status: 'away' });
      }
      setOnlineUsers(mockUsers.slice(0, Math.min(3, count)));
    } else {
      // TODO: Implement real Supabase presence
      setOnlineCount(0);
      setOnlineUsers([]);
    }
  }, [roomId, useMock]);

  return {
    onlineUsers,
    onlineCount: onlineCount || onlineUsers.length,
  };
}