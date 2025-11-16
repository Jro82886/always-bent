import { useState, useEffect, useCallback, useRef } from 'react';
import { initChatClient, ChatMessage, ChatClient } from '@/lib/services/chat';
import { useAppState } from '@/lib/store';

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
  const mountedRef = useRef(true);
  const { user } = useAppState();
  const displayName = user?.name || 'Anonymous';

  useEffect(() => {
    // Initialize chat client
    const client = initChatClient();
    clientRef.current = client;
    
    // Create abort controller for fetch cancellation
    const abortController = new AbortController();

    // Subscribe to room
    const setupChat = async () => {
      try {
        // Load recent messages (if supported)
        const recent = await client.loadRecent(roomId);
        
        // Check if component is still mounted
        if (abortController.signal.aborted) return;
        
        setMessages(recent);

        // Subscribe to new messages
        await client.subscribe(roomId, (msg: ChatMessage) => {
          // Check if component is still mounted before updating state
          if (!abortController.signal.aborted) {
            setMessages(prev => [...prev, msg]);
          }
        });

        if (!abortController.signal.aborted) {
          setIsConnected(true);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Chat setup error:', error);
          setIsConnected(false);
        }
      }
    };

    setupChat();

    // Cleanup
    return () => {
      mountedRef.current = false;
      abortController.abort();
      
      // Clear messages immediately to prevent stale state
      setMessages([]);
      setIsConnected(false);
      
      if (clientRef.current) {
        try {
          clientRef.current.unsubscribe();
        } catch (error) {
          // Silently catch any unsubscribe errors
          console.debug('Unsubscribe error (non-critical):', error);
        }
        clientRef.current = null;
      }
    };
  }, [roomId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!clientRef.current || !displayName || !text.trim()) return;

    const message: ChatMessage = {
      id: '', // Will be set by client
      user: displayName,
      inletId: roomId,
      text: text.trim(),
      createdAt: Date.now(),
    };

    try {
      await clientRef.current.send(message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  }, [roomId, displayName]);

  return {
    messages,
    sendMessage,
    isConnected,
    mode: clientRef.current?.mode || 'stub',
  };
}
