import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

if (
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('your_supabase') ||
  supabaseKey.includes('your_supabase')
) {
  console.warn('⚠️ Supabase yapılandırılmamış - demo mode aktif');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Client creation function for database operations
export const createSupabaseClient = () => {
  return supabase;
};

// Auth helper functions
export const authHelpers = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },
};

// Database types (will be extended as we add tables)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          attachments: any;
          created_at: string;
        };
        Insert: {
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          attachments?: any;
          created_at?: string;
        };
        Update: {
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          attachments?: any;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
