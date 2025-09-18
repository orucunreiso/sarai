'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, Trophy, BookOpen, Settings, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Modal,
} from '@/components/ui';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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

      {/* Modern Header */}
      <header className="container py-8 border-b border-border/30 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg glow-primary">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Sarai</h1>
              <p className="text-foreground-muted text-sm">YKS Hazırlık Platformu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="gradient" size="md" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="md" onClick={() => router.push('/auth')}>
                  Giriş Yap
                </Button>
                <Button
                  variant="gradient"
                  size="md"
                  leftIcon={<LogIn className="w-4 h-4" />}
                  onClick={() => router.push('/auth')}
                >
                  Kayıt Ol
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 relative z-10">
        {/* Modern Welcome Section */}
        <section className="mb-20 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-primary/10 border border-primary-solid/20 rounded-full mb-8">
            <span className="text-primary-solid font-medium">✨ YKS 2025'e Hazır mısın?</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-foreground mb-6 text-balance leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient">
              Merhaba!
            </span>
            <br />
            YKS yolculuğun burada başlıyor
          </h1>

          <p className="text-xl text-foreground-muted mb-12 text-balance max-w-3xl mx-auto leading-relaxed">
            Stressiz, eğlenceli ve motivasyonla dolu bir öğrenme deneyimi seni bekliyor.
            <span className="text-accent-solid font-semibold"> AI destekli çözümler</span> ve
            <span className="text-success-solid font-semibold"> oyunlaştırma</span> ile hedeflerine
            ulaş!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              variant="gradient"
              size="xl"
              leftIcon={<Star className="w-6 h-6" />}
              className="animate-glow-pulse"
              onClick={() => router.push(user ? '/dashboard' : '/auth')}
            >
              {user ? "Dashboard'a Git" : 'Hadi Başlayalım'}
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => setIsModalOpen(true)}
              className="group"
            >
              <span className="mr-2">Nasıl Çalışır?</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </section>

        {/* Modern Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card variant="glow" interactive className="animate-fade-in group">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl mb-3">🤖 AI Soru Çözüm</CardTitle>
              <CardDescription className="text-lg">
                Fotoğrafla, öğren, tekrarla.{' '}
                <span className="text-secondary-solid font-semibold">Claude AI</span> ile adım adım
                çözümler ve kişiselleştirilmiş açıklamalar.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            variant="float"
            interactive
            className="animate-fade-in group"
            style={{ animationDelay: '0.1s' }}
          >
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl mb-3">🏆 Rozetler & XP</CardTitle>
              <CardDescription className="text-lg">
                Her adımın değerli.{' '}
                <span className="text-success-solid font-semibold">XP kazan</span>, rozet topla,
                seviye atla! 50+ benzersiz rozet seni bekliyor.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            variant="gradient"
            interactive
            className="animate-fade-in group"
            style={{ animationDelay: '0.2s' }}
          >
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl mb-3 text-white">💖 Motivasyon</CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Pozitif yaklaşım, küçük başarılar, stressiz öğrenme. Kendini geliştir, ezberle değil{' '}
                <span className="font-semibold">anla!</span>
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Modern Demo Section */}
        <section className="max-w-lg mx-auto">
          <Card variant="glass" padding="xl" className="text-center">
            <CardHeader>
              <div className="w-20 h-20 rounded-3xl bg-gradient-accent flex items-center justify-center mb-6 mx-auto shadow-xl">
                <span className="text-3xl">🚀</span>
              </div>
              <CardTitle className="text-3xl mb-4">Hemen Dene!</CardTitle>
              <CardDescription className="text-xl">
                E-postanı gir,{' '}
                <span className="text-accent-solid font-semibold">demo hesabını</span> oluştur ve
                keşfetmeye başla! Hiç kayıp etmeden başlayabilirsin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Input
                  type="email"
                  placeholder="e-posta@adresin.com"
                  label="E-posta Adresi"
                  className="text-lg py-4"
                />
                <Button
                  variant="glow"
                  size="xl"
                  className="w-full"
                  rightIcon={<span className="text-xl">✨</span>}
                >
                  Demo Hesabı Oluştur
                </Button>
                <p className="text-sm text-foreground-muted">
                  💡 Ücretsiz deneme, kredi kartı gereksiz
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Modern Info Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🎯 Sarai Nasıl Çalışır?"
        description="YKS hazırlığını eğlenceli hale getiren modern özelliklerimiz"
        size="lg"
      >
        <div className="space-y-8">
          <div className="flex gap-6 items-start group hover:bg-surface/50 rounded-2xl p-4 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-2xl">1</span>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xl mb-2">📸 Soru Fotoğrafla</h4>
              <p className="text-foreground-muted text-lg leading-relaxed">
                Takıldığın soruyu fotoğrafla,{' '}
                <span className="text-secondary-solid font-semibold">Claude AI</span> anında analiz
                etsin. Telefon kameranla çek, hemen çözüm al!
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group hover:bg-surface/50 rounded-2xl p-4 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-2xl">2</span>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xl mb-2">🧠 Adım Adım Öğren</h4>
              <p className="text-foreground-muted text-lg leading-relaxed">
                Sadece cevap değil,{' '}
                <span className="text-accent-solid font-semibold">nasıl çözüldüğünü</span> de öğren.
                Her adımı anlayarak ilerle, bilgiyi pekiştir.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group hover:bg-surface/50 rounded-2xl p-4 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-2xl">3</span>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xl mb-2">🎮 XP Kazan, Eğlen</h4>
              <p className="text-foreground-muted text-lg leading-relaxed">
                Her çözüm <span className="text-success-solid font-semibold">XP kazandırır</span>,
                rozetler açar, motivasyon arttırır. Öğrenirken eğlen, seviye atla!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4 justify-end">
          <Button variant="secondary" size="lg" onClick={() => setIsModalOpen(false)}>
            Anladım 👍
          </Button>
          <Button
            variant="gradient"
            size="lg"
            onClick={() => setIsModalOpen(false)}
            className="animate-glow-pulse"
          >
            Hadi Başlayalım! 🚀
          </Button>
        </div>
      </Modal>
    </div>
  );
}
