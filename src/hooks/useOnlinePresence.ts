import { useState, useEffect, useRef } from 'react';
import { mockPresence } from '@/mocks/chatData';
import { supabase } from '@/lib/supabase/client';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import { getOrCreateEphemeralUser } from '@/lib/auth/ephemeral';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineUser {
  userId: string;
  username: string;
  status: 'online' | 'away';
}

// Type for the presence payload we send/receive
interface PresencePayload {
  userId: string;
  username: string;
  online_at: string;
}

interface UseOnlinePresenceReturn {
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export function useOnlinePresence(roomId: string): UseOnlinePresenceReturn {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const useMock = process.env.NEXT_PUBLIC_CHAT_MOCK === '1';
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { member, isAuthenticated } = useMemberstack();

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
      return;
    }

    // Real Supabase Realtime Presence
    // Get current user info
    const currentUser = isAuthenticated && member
      ? {
          userId: member.id,
          username: member.customFields?.captainName || member.email?.split('@')[0] || 'Angler'
        }
      : (() => {
          const ephemeralUser = getOrCreateEphemeralUser();
          return {
            userId: ephemeralUser.id,
            username: `Guest_${ephemeralUser.id.slice(0, 6)}`
          };
        })();

    // Create a unique channel for this room
    const channelName = `presence:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.userId,
        },
      },
    });

    // Track the current user's presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();

        // Convert presence state to OnlineUser array
        const users: OnlineUser[] = [];
        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const presence = presences[0] as unknown as PresencePayload;
            // Safety check: ensure presence has required fields
            if (presence && presence.userId && presence.username) {
              users.push({
                userId: presence.userId,
                username: presence.username,
                status: 'online',
              });
            }
          }
        });

        setOnlineUsers(users);
        setOnlineCount(users.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            userId: currentUser.userId,
            username: currentUser.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, useMock, member, isAuthenticated]);

  return {
    onlineUsers,
    onlineCount: onlineCount || onlineUsers.length,
  };
}