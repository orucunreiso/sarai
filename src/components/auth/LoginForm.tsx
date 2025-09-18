'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToRegister }: LoginFormProps) => {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setError(error);
    } else {
      onSuccess?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto" variant="glass">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">🔐 Giriş Yap</CardTitle>
        <CardDescription>Sarai hesabına giriş yaparak YKS yolculuğuna devam et!</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error-solid/10 border border-error-solid/20 rounded-xl text-error-solid text-sm">
              {error}
            </div>
          )}

          <Input
            type="email"
            name="email"
            label="E-posta Adresi"
            placeholder="ornek@email.com"
            value={formData.email}
            onChange={handleChange}
            leftIcon={<Mail className="w-5 h-5" />}
            required
            disabled={loading}
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Şifre"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-foreground-muted hover:text-primary-solid transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            required
            disabled={loading}
          />

          <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
            Giriş Yap
          </Button>

          <div className="text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-solid hover:text-primary-hover transition-colors"
            >
              Şifremi unuttum
            </Link>

            {onSwitchToRegister && (
              <p className="text-sm text-foreground-muted">
                Hesabın yok mu?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-primary-solid hover:text-primary-hover font-medium transition-colors"
                >
                  Hemen kayıt ol
                </button>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
