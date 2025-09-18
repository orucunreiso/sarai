import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuestionImage } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, userId } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Görüntü verisi gerekli' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı kimliği gerekli' }, { status: 401 });
    }

    // Gemini API key kontrolü
    if (
      !process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY.includes('your_gemini')
    ) {
      return NextResponse.json(
        {
          solution: `## 🎯 Demo Çözüm
Bu bir demo çözümüdür. Gerçek AI çözümü için Google Gemini API key'i gereklidir.

### Adım 1: Soruyu Analiz Et
Sorunun türünü ve konusunu belirle.

### Adım 2: Çözüm Yolunu Seç
En uygun çözüm metodunu kullan.

### Adım 3: Hesapla
Adım adım hesaplama yap.

## ✅ Sonuç
Demo çözüm tamamlandı.

## 💡 İpucu
Gerçek AI çözümü için API key konfigürasyonu yapılmalı.`,
          xpEarned: 10,
        },
        { status: 200 },
      );
    }

    // Gemini ile soruyu analiz et
    const solution = await analyzeQuestionImage(imageBase64);

    // XP hesapla (basit versiyon)
    const xpEarned = Math.floor(Math.random() * 15) + 10; // 10-25 XP

    // Veritabanına kaydet (çözülen soru geçmişi için)
    try {
      const { error: dbError } = await supabase.from('questions').insert({
        user_id: userId,
        solution: solution,
        xp_earned: xpEarned,
        solved_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Hata olsa da response döndür, veritabanı hatası çözümü engellemez
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Veritabanı hatası olsa da devam et
    }

    // Kullanıcının XP'sini güncelle
    try {
      const { error: updateError } = await supabase.rpc('increment_user_xp', {
        user_id: userId,
        xp_amount: xpEarned,
      });

      if (updateError) {
        console.error('XP update error:', updateError);
      }
    } catch (updateError) {
      console.error('XP update error:', updateError);
    }

    return NextResponse.json({
      solution,
      xpEarned,
    });
  } catch (error) {
    console.error('Solve question error:', error);
    return NextResponse.json({ error: 'Soru çözümünde bir hata oluştu' }, { status: 500 });
  }
}
