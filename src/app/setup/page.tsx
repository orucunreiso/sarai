'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  Target,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SetupData {
  full_name: string;
  grade: number | '';
  target_university: string;
  target_department: string;
  study_goal: string;
  daily_goal: number;
  preferred_subjects: string[];
}

const subjects = [
  'Matematik',
  'Türkçe',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Edebiyat',
  'İngilizce',
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    full_name: '',
    grade: '',
    target_university: '',
    target_department: '',
    study_goal: '',
    daily_goal: 5,
    preferred_subjects: [],
  });

  const { user } = useAuth();
  const router = useRouter();
  const totalSteps = 4;

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const handleInputChange = (field: keyof SetupData, value: any) => {
    setSetupData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubjectToggle = (subject: string) => {
    setSetupData((prev) => ({
      ...prev,
      preferred_subjects: prev.preferred_subjects.includes(subject)
        ? prev.preferred_subjects.filter((s) => s !== subject)
        : [...prev.preferred_subjects, subject],
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return setupData.full_name.trim() && setupData.grade;
      case 2:
        return setupData.target_university.trim() && setupData.target_department.trim();
      case 3:
        return setupData.preferred_subjects.length > 0;
      case 4:
        return setupData.daily_goal > 0;
      default:
        return false;
    }
  };

  const completeSetup = async () => {
    setLoading(true);

    try {
      // Create user profile
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        full_name: setupData.full_name,
        grade: setupData.grade,
        target_university: setupData.target_university,
        target_department: setupData.target_department,
        study_goal: setupData.study_goal,
      });

      if (profileError) throw profileError;

      // Create user preferences
      const { error: preferencesError } = await supabase.from('user_preferences').upsert({
        user_id: user?.id,
        daily_goal: setupData.daily_goal,
        preferred_subjects: setupData.preferred_subjects,
      });

      if (preferencesError) throw preferencesError;

      // Initialize XP and give welcome bonus
      const { error: xpError } = await supabase.from('user_xp').upsert({
        user_id: user?.id,
        total_xp: 10,
        current_level: 1,
        questions_solved: 0,
        study_streak: 0,
      });

      if (xpError) throw xpError;

      // Add welcome XP log
      await supabase.from('xp_logs').insert({
        user_id: user?.id,
        xp_gained: 10,
        activity_type: 'first_login',
        description: "Platform'a hoş geldin!",
      });

      // Award "İlk Adım" achievement
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('name', 'İlk Adım')
        .single();

      if (achievement) {
        await supabase.from('user_achievements').insert({
          user_id: user?.id,
          achievement_id: achievement.id,
        });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Setup error:', error);
      alert('Kurulum sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Seni Tanıyalım!</h2>
              <p className="text-gray-300">Önce temel bilgilerini öğrenmek istiyoruz.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adın ve soyadın nedir?
                </label>
                <Input
                  type="text"
                  value={setupData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="bg-gray-700/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kaçıncı sınıfta okuyorsun?
                </label>
                <select
                  value={setupData.grade}
                  onChange={(e) => handleInputChange('grade', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sınıfını seç</option>
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Hedeflerin Neler?</h2>
              <p className="text-gray-300">Hedeflerini belirleyerek motivasyonunu artıralım!</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hangi üniversiteyi hedefliyorsun?
                </label>
                <Input
                  type="text"
                  value={setupData.target_university}
                  onChange={(e) => handleInputChange('target_university', e.target.value)}
                  placeholder="Örn: İstanbul Teknik Üniversitesi"
                  className="bg-gray-700/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hangi bölümü istiyorsun?
                </label>
                <Input
                  type="text"
                  value={setupData.target_department}
                  onChange={(e) => handleInputChange('target_department', e.target.value)}
                  placeholder="Örn: Bilgisayar Mühendisliği"
                  className="bg-gray-700/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YKS hedefin nedir? (İsteğe bağlı)
                </label>
                <textarea
                  value={setupData.study_goal}
                  onChange={(e) => handleInputChange('study_goal', e.target.value)}
                  placeholder="Örn: TYT'de 400, AYT'de 350 puan almak istiyorum..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Favori Derslerini Seç</h2>
              <p className="text-gray-300">Hangi derslerde daha çok çalışmak istiyorsun?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    setupData.preferred_subjects.includes(subject)
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-400'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            {setupData.preferred_subjects.length > 0 && (
              <div className="text-center text-sm text-gray-400">
                {setupData.preferred_subjects.length} ders seçildi
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Son Dokunuş!</h2>
              <p className="text-gray-300">Günlük hedefini belirleyerek başlayalım.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Günde kaç soru çözmeyi planlıyorsun?
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={setupData.daily_goal}
                    onChange={(e) => handleInputChange('daily_goal', parseInt(e.target.value))}
                    className="bg-gray-700/50 text-white w-20 text-center"
                  />
                  <span className="text-gray-300">soru/gün</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Önerilen: Başlangıç için 5-10 soru idealdir. Zamanla artırabilirsin!
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🎉 Hemen başlayalım!</h3>
                <p className="text-gray-300 text-sm">
                  Kurulumunu tamamladıktan sonra hemen AI asistanınla soru çözmeye başlayabilirsin.
                  Her çözdüğün soru sana XP kazandıracak ve seviye atlayacaksın!
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                Adım {currentStep}/{totalSteps}
              </span>
              <span>%{Math.round((currentStep / totalSteps) * 100)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="text-gray-400"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Geri
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canContinue()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Devam Et
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={completeSetup}
                disabled={!canContinue() || loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? (
                  'Tamamlanıyor...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Kurulumu Tamamla
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
