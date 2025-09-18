'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Settings,
  Trophy,
  Target,
  BookOpen,
  Mail,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  full_name?: string;
  avatar_url?: string;
  grade?: number;
  target_university?: string;
  target_department?: string;
  study_goal?: string;
}

interface UserStats {
  total_xp: number;
  current_level: number;
  questions_solved: number;
  study_streak: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [stats, setStats] = useState<UserStats>({
    total_xp: 0,
    current_level: 1,
    questions_solved: 0,
    study_streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        ...profile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess('Profil başarıyla güncellendi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Profil Ayarları</h1>
                <p className="text-sm text-gray-400">Hesap bilgilerinizi düzenleyin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.current_level}</div>
              <div className="text-sm text-gray-400">Seviye</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total_xp}</div>
              <div className="text-sm text-gray-400">Toplam XP</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.questions_solved}</div>
              <div className="text-sm text-gray-400">Çözülen Soru</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.study_streak}</div>
              <div className="text-sm text-gray-400">Günlük Seri</div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Kişisel Bilgiler
            </CardTitle>
            <CardDescription>
              Profil bilgilerinizi güncelleyerek daha kişisel bir deneyim yaşayın.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-posta Adresi
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-700/50 text-gray-400"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Ad Soyad</label>
              <Input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Adınız ve soyadınız"
                className="bg-gray-700/50 text-white"
              />
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Sınıf
              </label>
              <select
                value={profile.grade || ''}
                onChange={(e) => handleInputChange('grade', parseInt(e.target.value) || '')}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Sınıfınızı seçin</option>
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
              </select>
            </div>

            {/* Target University */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Hedef Üniversite</label>
              <Input
                type="text"
                value={profile.target_university || ''}
                onChange={(e) => handleInputChange('target_university', e.target.value)}
                placeholder="Hangi üniversiteyi hedefliyorsunuz?"
                className="bg-gray-700/50 text-white"
              />
            </div>

            {/* Target Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Hedef Bölüm</label>
              <Input
                type="text"
                value={profile.target_department || ''}
                onChange={(e) => handleInputChange('target_department', e.target.value)}
                placeholder="Hangi bölümü hedefliyorsunuz?"
                className="bg-gray-700/50 text-white"
              />
            </div>

            {/* Study Goal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Çalışma Hedefi</label>
              <textarea
                value={profile.study_goal || ''}
                onChange={(e) => handleInputChange('study_goal', e.target.value)}
                placeholder="YKS için hangi hedefleri belirlemiş durumdasınız?"
                rows={3}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
