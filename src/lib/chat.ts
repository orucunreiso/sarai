import { supabase } from '@/lib/supabase';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: any[];
  created_at: string;
}

export interface NewMessage {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: any[];
}

class ChatService {
  // Create new chat session
  async createSession(title: string): Promise<ChatSession | null> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Authentication error:', authError);
        return null;
      }

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: title.slice(0, 100), // Limit title length
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  // Get all user's chat sessions
  async getUserSessions(): Promise<ChatSession[]> {
    try {
      // Get current user first
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Authentication error in getUserSessions:', authError);
        return [];
      }

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chat sessions:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  }

  // Add message to session
  async addMessage(message: NewMessage): Promise<ChatMessage | null> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Authentication error in addMessage:', authError);
        return null;
      }

      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      // Update session's updated_at timestamp
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.session_id);

      if (updateError) {
        console.error('Error updating session timestamp:', updateError);
      }

      return newMessage;
    } catch (error) {
      console.error('Error in addMessage:', error);
      return null;
    }
  }

  // Get messages for a session
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Error in getSessionMessages:', error);
      return [];
    }
  }

  // Delete a chat session (and all its messages)
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  // Update session title
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          title: title.slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionTitle:', error);
      return false;
    }
  }

  // Generate automatic title from first message
  generateSessionTitle(firstMessage: string): string {
    const cleanMessage = firstMessage.slice(0, 50).trim();
    if (cleanMessage.length < firstMessage.length) {
      return cleanMessage + '...';
    }
    return cleanMessage || 'Yeni Sohbet';
  }
}

export const chatService = new ChatService();
