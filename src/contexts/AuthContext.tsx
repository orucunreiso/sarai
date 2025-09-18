'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        return { error: getErrorMessage(error.message) };
      }

      return {};
    } catch (error) {
      return { error: 'Beklenmeyen bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: getErrorMessage(error.message) };
      }

      return {};
    } catch (error) {
      return { error: 'Beklenmeyen bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: getErrorMessage(error.message) };
      }

      return {};
    } catch (error) {
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Helper function to translate error messages to Turkish
const getErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Geçersiz giriş bilgileri',
    'User not found': 'Kullanıcı bulunamadı',
    'Email not confirmed': 'Email doğrulanmamış',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı',
    'User already registered': 'Bu email adresi zaten kayıtlı',
    'Invalid email': 'Geçersiz email adresi',
    'Email rate limit exceeded': 'Email gönderim limiti aşıldı',
    'Signup requires email verification': 'Kayıt için email doğrulaması gerekli',
  };

  return errorMessages[error] || 'Bir hata oluştu, lütfen tekrar deneyin';
};
