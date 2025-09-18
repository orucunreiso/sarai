'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await resetPassword(email);

    if (error) {
      setError(error);
    } else {
      setMessage(
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.',
      );
    }

    setLoading(false);
  };

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
        <div className="flex items-center justify-between">
          <Link
            href="/auth"
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sarai</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card variant="glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2 flex items-center justify-center gap-2">
                <Mail className="w-6 h-6 text-primary-solid" />
                Şifre Sıfırla
              </CardTitle>
              <CardDescription>
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-error-solid/10 border border-error-solid/20 rounded-xl text-error-solid text-sm">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="p-4 bg-success-solid/10 border border-success-solid/20 rounded-xl text-success-solid text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-posta Adresi
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email.trim()}
                  loading={loading}
                >
                  {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-foreground-muted">
                    Şifrenizi hatırladınız mı?{' '}
                    <Link
                      href="/auth"
                      className="text-primary-solid hover:text-primary-solid/80 transition-colors font-medium"
                    >
                      Giriş yapın
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
