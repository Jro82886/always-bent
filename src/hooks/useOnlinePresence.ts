import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppState } from '@/store/appState';

interface OnlineUser {
  userId: string;
  username: string;
  lastSeen: number;
  status: 'online' | 'away' | 'offline';
}

interface UseOnlinePresenceReturn {
  onlineUsers: OnlineUser[];
  updateMyPresence: (status: 'online' | 'away') => void;
}

export function useOnlinePresence(roomId: string): UseOnlinePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { username } = useAppState();
  const supabase = createClient();

  useEffect(() => {
    if (!username || !supabase) return;

    const userId = `user-${username.toLowerCase().replace(/\s+/g, '-')}`;
    const channel = supabase.channel(`presence:${roomId}`);

    // Track my presence
    const userStatus: OnlineUser = {
      userId,
      username,
      lastSeen: Date.now(),
      status: 'online'
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            const presence = presences[0];
            users.push({
              userId: presence.userId || key,
              username: presence.username || 'Anonymous',
              lastSeen: presence.lastSeen || Date.now(),
              status: presence.status || 'online'
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Announce my presence
          await channel.track(userStatus);
        }
      });

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      channel.track({ ...userStatus, lastSeen: Date.now() });
    }, 30000);

    // Set away after 5 minutes of inactivity
    let activityTimer: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        channel.track({ ...userStatus, status: 'away', lastSeen: Date.now() });
      }, 5 * 60 * 1000);
    };

    // Track user activity
    const handleActivity = () => {
      resetActivityTimer();
      if (userStatus.status === 'away') {
        userStatus.status = 'online';
        channel.track({ ...userStatus, lastSeen: Date.now() });
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    resetActivityTimer();

    return () => {
      clearInterval(interval);
      clearTimeout(activityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      channel.unsubscribe();
    };
  }, [roomId, username, supabase]);

  const updateMyPresence = (status: 'online' | 'away') => {
    // This would update your presence status manually if needed
  };

  return {
    onlineUsers,
    updateMyPresence
  };
}
