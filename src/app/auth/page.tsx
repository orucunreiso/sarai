'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-foreground-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary-solid/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/2 -right-4 w-96 h-96 bg-accent-solid/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-8 left-1/2 w-80 h-80 bg-secondary-solid/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Header */}
      <header className="container py-6 border-b border-border/30 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg glow-primary">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Sarai</h1>
              <p className="text-foreground-muted text-sm">YKS Hazırlık Platformu</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={() => router.push('/dashboard')}
              onSwitchToRegister={() => setMode('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => setMode('login')}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-6 border-t border-border/30 backdrop-blur-sm relative z-10 text-center">
        <p className="text-foreground-muted text-sm">
          © 2024 Sarai. YKS yolculuğunuzda size eşlik ediyoruz.
        </p>
      </footer>
    </div>
  );
}
