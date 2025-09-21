import { useState, useEffect, useCallback, useRef } from 'react';
import { initChatClient, ChatMessage, ChatClient } from '@/lib/services/chat';
import { useAppState } from '@/store/appState';

interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isConnected: boolean;
  mode: 'supabase' | 'stub';
}

export function useRealtimeChat(roomId: string): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<ChatClient | null>(null);
  const { username } = useAppState();

  useEffect(() => {
    // Initialize chat client
    const client = initChatClient();
    clientRef.current = client;

    // Subscribe to room
    const setupChat = async () => {
      try {
        // Load recent messages (if supported)
        const recent = await client.loadRecent(roomId);
        setMessages(recent);

        // Subscribe to new messages
        await client.subscribe(roomId, (msg: ChatMessage) => {
          setMessages(prev => [...prev, msg]);
        });

        setIsConnected(true);
      } catch (error) {
        console.error('Chat setup error:', error);
        setIsConnected(false);
      }
    };

    setupChat();

    // Cleanup
    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe();
      }
    };
  }, [roomId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!clientRef.current || !username || !text.trim()) return;

    const message: ChatMessage = {
      id: '', // Will be set by client
      user: username,
      inletId: roomId,
      text: text.trim(),
      createdAt: Date.now(),
    };

    try {
      await clientRef.current.send(message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  }, [roomId, username]);

  return {
    messages,
    sendMessage,
    isConnected,
    mode: clientRef.current?.mode || 'stub',
  };
}
