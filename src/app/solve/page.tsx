'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { PhotoUpload } from '@/components/question/PhotoUpload';
import { SolutionDisplay } from '@/components/question/SolutionDisplay';
import { useAuth } from '@/contexts/AuthContext';

export default function SolvePage() {
  const [selectedImage, setSelectedImage] = useState<{ base64: string; file: File } | null>(null);
  const [solution, setSolution] = useState<string>('');
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleImageSelected = (imageBase64: string, imageFile: File) => {
    setSelectedImage({ base64: imageBase64, file: imageFile });
    setSolution(''); // Clear previous solution
  };

  const handleSolveQuestion = async () => {
    if (!selectedImage || !user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/solve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImage.base64,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setSolution(data.solution);
      setXpEarned(data.xpEarned || 0);
    } catch (error) {
      console.error('Solve question error:', error);
      setSolution(`## ❌ Hata
Soru çözümünde bir hata oluştu. Lütfen tekrar deneyin.

### 🔧 Çözüm Önerileri
- İnternetinizi kontrol edin
- Fotoğrafın net ve okunaklı olduğundan emin olun
- Birkaç saniye bekleyip tekrar deneyin`);
    } finally {
      setLoading(false);
    }
  };

  const resetSolver = () => {
    setSelectedImage(null);
    setSolution('');
    setXpEarned(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="md"
                onClick={() => router.back()}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              >
                Geri
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">🤖 AI Soru Çözücü</h1>
                <p className="text-foreground-muted text-sm">Gemini AI ile adım adım çözüm</p>
              </div>
            </div>

            {selectedImage && !solution && (
              <Button
                variant="gradient"
                size="lg"
                onClick={handleSolveQuestion}
                loading={loading}
                leftIcon={<Sparkles className="w-5 h-5" />}
                className="animate-glow-pulse"
              >
                🚀 AI ile Çöz
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Instructions */}
          {!selectedImage && !solution && (
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">📚 Sorunuzu Fotoğraflayın</h2>
              <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                YKS kapsamındaki matematik, fizik, kimya, biyoloji ve Türkçe sorularınızı
                fotoğraflayın, Gemini AI adım adım çözsün!
              </p>
            </div>
          )}

          {/* Photo Upload */}
          {!solution && <PhotoUpload onImageSelected={handleImageSelected} loading={loading} />}

          {/* Solution Display */}
          {(loading || solution) && (
            <>
              <SolutionDisplay solution={solution} xpEarned={xpEarned} loading={loading} />

              {solution && (
                <div className="text-center">
                  <Button variant="secondary" size="lg" onClick={resetSolver}>
                    🔄 Yeni Soru Çöz
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Tips Section */}
          {!selectedImage && !solution && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Net Fotoğraf Çek</h3>
                <p className="text-foreground-muted text-sm">
                  Sorunun tamamının görüldüğü, net bir fotoğraf çekmeye dikkat edin.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">AI Analizi</h3>
                <p className="text-foreground-muted text-sm">
                  Gemini AI soruyu analiz eder ve adım adım çözüm sunar.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">XP Kazan</h3>
                <p className="text-foreground-muted text-sm">
                  Her çözülen soru ile XP kazanın ve seviye atlayın!
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
