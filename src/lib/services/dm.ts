import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DMConversation {
  id: string;
  participant1_id: string;
  participant1_username: string;
  participant2_id: string;
  participant2_username: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count?: number;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export class DMClient {
  private supabase: any;
  private channel: RealtimeChannel | null = null;
  private userId: string;
  private username: string;
  private conversationCallbacks: Map<string, (message: DMMessage) => void> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string, userId: string, username: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userId = userId;
    this.username = username;
  }

  // Get or create a conversation between two users
  async getOrCreateConversation(otherUserId: string, otherUsername: string): Promise<DMConversation> {
    // Check if conversation exists
    const { data: existing } = await this.supabase
      .from('dm_conversations')
      .select('*')
      .or(`participant1_id.eq.${this.userId},participant2_id.eq.${this.userId}`)
      .or(`participant1_id.eq.${otherUserId},participant2_id.eq.${otherUserId}`)
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data, error } = await this.supabase
      .from('dm_conversations')
      .insert({
        participant1_id: this.userId,
        participant1_username: this.username,
        participant2_id: otherUserId,
        participant2_username: otherUsername
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all conversations for the current user
  async getConversations(): Promise<DMConversation[]> {
    const { data, error } = await this.supabase
      .from('dm_conversations')
      .select(`
        *,
        dm_unread_counts!inner(unread_count)
      `)
      .or(`participant1_id.eq.${this.userId},participant2_id.eq.${this.userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    // Add unread counts
    const { data: unreadCounts } = await this.supabase
      .from('dm_unread_counts')
      .select('unread_count')
      .eq('user_id', this.userId)
      .single();

    return data.map((conv: any) => ({
      ...conv,
      unread_count: unreadCounts?.unread_count || 0
    }));
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50): Promise<DMMessage[]> {
    const { data, error } = await this.supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Mark messages as read
    await this.markAsRead(conversationId);
    
    return data.reverse(); // Return in chronological order
  }

  // Send a message
  async sendMessage(conversationId: string, content: string): Promise<DMMessage> {
    const { data, error } = await this.supabase
      .from('dm_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: this.userId,
        sender_username: this.username,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    await this.supabase.rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: this.userId
    });
  }

  // Subscribe to real-time messages for a conversation
  subscribeToConversation(conversationId: string, callback: (message: DMMessage) => void) {
    this.conversationCallbacks.set(conversationId, callback);
    
    if (!this.channel) {
      this.channel = this.supabase
        .channel('dm-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dm_messages'
          },
          (payload: any) => {
            const message = payload.new as DMMessage;
            const callback = this.conversationCallbacks.get(message.conversation_id);
            if (callback && message.sender_id !== this.userId) {
              callback(message);
            }
          }
        )
        .subscribe();
    }
  }

  // Unsubscribe from a conversation
  unsubscribeFromConversation(conversationId: string) {
    this.conversationCallbacks.delete(conversationId);
    
    if (this.conversationCallbacks.size === 0 && this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    const { data, error } = await this.supabase
      .from('dm_unread_counts')
      .select('unread_count')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return 0;
    return data.unread_count;
  }

  // Clean up
  disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.conversationCallbacks.clear();
  }
}
