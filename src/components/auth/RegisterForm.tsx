'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
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

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm = ({ onSuccess, onSwitchToLogin }: RegisterFormProps) => {
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    const { error } = await signUp(formData.email, formData.password, formData.fullName);

    if (error) {
      setError(error);
    } else {
      setIsSuccessful(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSuccessful) {
    return (
      <Card className="w-full max-w-md mx-auto" variant="glow">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl mb-2 text-success-solid">🎉 Kayıt Başarılı!</CardTitle>
          <CardDescription>
            E-posta adresinize doğrulama linki gönderildi. Lütfen emailinizi kontrol edin ve
            hesabınızı aktifleştirin.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button variant="gradient" size="lg" className="w-full" onClick={onSwitchToLogin}>
            Giriş Sayfasına Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" variant="glass">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">🚀 Kayıt Ol</CardTitle>
        <CardDescription>Sarai ailesine katıl ve YKS yolculuğunda başarıya ulaş!</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-error-solid/10 border border-error-solid/20 rounded-xl text-error-solid text-sm">
              {error}
            </div>
          )}

          <Input
            type="text"
            name="fullName"
            label="Ad Soyad"
            placeholder="Adınız Soyadınız"
            value={formData.fullName}
            onChange={handleChange}
            leftIcon={<User className="w-5 h-5" />}
            required
            disabled={loading}
          />

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
            placeholder="En az 6 karakter"
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
            helperText="Şifreniz en az 6 karakter olmalıdır"
            required
            disabled={loading}
          />

          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            label="Şifre Tekrar"
            placeholder="Şifrenizi tekrar girin"
            value={formData.confirmPassword}
            onChange={handleChange}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-foreground-muted hover:text-primary-solid transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            error={
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'Şifreler eşleşmiyor'
                : undefined
            }
            required
            disabled={loading}
          />

          <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
            Hesap Oluştur
          </Button>

          {onSwitchToLogin && (
            <p className="text-sm text-foreground-muted text-center">
              Zaten hesabın var mı?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary-solid hover:text-primary-hover font-medium transition-colors"
              >
                Giriş yap
              </button>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
