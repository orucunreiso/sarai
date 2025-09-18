import { GoogleGenerativeAI } from '@google/generative-ai';
import { SARAI_SYSTEM_PROMPT, SUBJECT_SPECIFIC_PROMPTS } from '@/lib/prompts/system';

const getGeminiModel = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  console.log('🔑 Gemini API Key check:', apiKey ? 'PRESENT' : 'MISSING');

  if (!apiKey || apiKey.includes('your_gemini') || apiKey.length < 30) {
    console.log('⚠️ Demo mode active - API key invalid');
    return null; // Demo mode
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini model initialized successfully');
    return model;
  } catch (error) {
    console.error('❌ Gemini model initialization failed:', error);
    return null;
  }
};

export const analyzeQuestionImage = async (imageBase64: string): Promise<string> => {
  try {
    const model = getGeminiModel();

    if (!model) {
      return `## 🎯 Demo Soru Analizi
Bu bir demo çözümüdür. Gerçek AI çözümü için Google Gemini API key'i gereklidir.

## 📚 Çözüm Adımları

### Adım 1: Soruyu İncele
Fotoğraftaki soruyu dikkatlice oku ve ne sorulduğunu belirle.

### Adım 2: Çözüm Yolunu Seç
En uygun çözüm metodunu kullan.

### Adım 3: Hesapla ve Çöz
Adım adım hesaplama yaparak sonuca ulaş.

## ✅ Sonuç
Demo çözüm tamamlandı. Gerçek AI çözümü için API yapılandırması yapılmalı.

## 💡 İpucu
Gerçek Gemini AI ile tam çözüm almak için API key'i ekleyin.`;
    }

    const prompt = `
Sen bir YKS (Yükseköğretim Kurumları Sınavı) matematik, fizik, kimya, biyoloji ve Türkçe uzmanısın. 
Bu görüntüdeki soruyu analiz et ve Türkçe olarak şu formatı kullanarak adım adım çöz:

## 🎯 Soru Analizi
Sorunun konusunu ve ne sorulduğunu açıkla.

## 📚 Çözüm Adımları

### Adım 1: [Kısa başlık]
Detaylı açıklama...

### Adım 2: [Kısa başlık] 
Detaylı açıklama...

### Adım 3: [Kısa başlık]
Detaylı açıklama...

## ✅ Sonuç
Final cevap ve kısa özet.

## 💡 İpucu
Bu tür soruları çözmek için genel bir ipucu.

ÖNEMLI: Sadece YKS kapsamındaki konularla ilgili soruları çöz. Başka türde sorular gelirse nazikçe reddet.
`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Soru analizi sırasında bir hata oluştu');
  }
};

export const generateMotivationalMessage = async (
  userLevel: number,
  xp: number,
): Promise<string> => {
  try {
    const model = getGeminiModel();

    if (!model) {
      return '🎉 Harika gidiyorsun! YKS yolculuğunda her adım seni hedefe yaklaştırıyor. Devam et! 💪';
    }

    const prompt = `
Kullanıcının seviyesi ${userLevel} ve XP'si ${xp}.
YKS hazırlığı için motive edici, pozitif ve Türkçe bir mesaj yaz.
Mesaj 50-80 kelime arasında olsun ve emoji kullan.
Öğrencinin başarısını kutla ve devam etmesi için cesaret ver.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return '🎉 Harika gidiyorsun! YKS yolculuğunda her adım seni hedefe yaklaştırıyor. Devam et! 💪';
  }
};

// Subject detection helper
const detectSubject = (message: string): string | null => {
  const subjects = {
    matematik: [
      'matematik',
      'math',
      'sayı',
      'işlem',
      'geometri',
      'fonksiyon',
      'türev',
      'integral',
      'logaritma',
    ],
    fizik: [
      'fizik',
      'physics',
      'kuvvet',
      'hareket',
      'enerji',
      'elektrik',
      'manyetik',
      'optik',
      'termodinamik',
    ],
    kimya: [
      'kimya',
      'chemistry',
      'atom',
      'molekül',
      'reaksiyon',
      'asit',
      'baz',
      'organik',
      'periyodik',
    ],
    biyoloji: [
      'biyoloji',
      'biology',
      'hücre',
      'genetik',
      'dna',
      'protein',
      'ekoloji',
      'evrim',
      'sistem',
    ],
    turkce: ['türkçe', 'turkish', 'dil bilgisi', 'paragraf', 'anlam', 'sözcük', 'cümle', 'metin'],
    edebiyat: ['edebiyat', 'literature', 'şiir', 'roman', 'hikaye', 'nazım', 'nesir', 'edebi'],
    tarih: ['tarih', 'history', 'osmanlı', 'cumhuriyet', 'savaş', 'dönem', 'çağ', 'tarihi'],
    cografya: ['coğrafya', 'geography', 'harita', 'iklim', 'nüfus', 'ekonomi', 'bölge', 'kıta'],
    felsefe: ['felsefe', 'philosophy', 'mantık', 'etik', 'bilgi', 'varlık', 'değer', 'düşünce'],
  };

  const lowerMessage = message.toLowerCase();

  for (const [subject, keywords] of Object.entries(subjects)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return subject;
    }
  }

  return null;
};

export const getGeminiResponse = async (
  message: string,
  conversationHistory: string = '',
): Promise<string> => {
  try {
    const model = getGeminiModel();

    if (!model) {
      return `## 👋 Merhaba! Ben Sarai AI!

YKS yolculuğundaki uzman rehberin olmaya hazırım. "${message}" hakkında sana yardımcı olmak istiyorum!

## 🎯 Sana Nasıl Yardımcı Olabilirim:
- **📐 Matematik:** Fonksiyon, türev, integral, geometri sorularını adım adım çözerim
- **⚗️ Fen Bilimleri:** Fizik, kimya, biyoloji konularında detaylı açıklamalar
- **📚 Türkçe & Edebiyat:** Dil bilgisi, paragraf sorularında strateji öğretirim
- **🌍 Sosyal Bilimler:** Tarih, coğrafya, felsefe konularında kapsamlı anlatım
- **📋 Çalışma Planı:** Kişiselleştirilmiş YKS hazırlık stratejileri
- **📸 Soru Çözümü:** Fotoğraf yüklersen sorularını çözerim

## ⚠️ Not
Bu demo yanıtıdır. Gerçek Gemini AI desteği için API yapılandırması gerekli.

**Hangi konuda başlamak istersin?** 🚀`;
    }

    // Detect subject for specialized prompt
    const detectedSubject = detectSubject(message);
    const subjectPrompt = detectedSubject
      ? SUBJECT_SPECIFIC_PROMPTS[detectedSubject as keyof typeof SUBJECT_SPECIFIC_PROMPTS]
      : '';

    // Build comprehensive prompt
    const fullPrompt = `
${SARAI_SYSTEM_PROMPT}

${subjectPrompt}

## 📝 KONUŞMA GEÇMİŞİ:
${conversationHistory}

## 💬 ÖĞRENCİ MESAJI:
"${message}"

## 🎯 GÖREVİN:
Sarai AI olarak bu öğrenci mesajına cevap ver.

KURALLAR:
- Sorulan şeye odaklan, gereksiz uzatma
- Kısa ve net açıkla (maks. 300 kelime)
- YKS odaklı ol
- Türkçe ve samimi dil kullan
- Öğretici ama özlü ol
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return `## 🔧 Teknik Sorun

Üzgünüm, şu anda sistem yoğunluğu nedeniyle geçici bir sorun yaşıyoruz.

## 💡 Bu Sırada Yapabileceklerin:
- **🔄 Tekrar Dene:** Birkaç saniye sonra aynı soruyu tekrar sor
- **📝 Detaylandır:** Sorunu daha spesifik hale getir
- **📚 Konu Belirt:** Hangi YKS konusunda yardım istediğini açıkça söyle

## 🎯 Ben Buradayım!
Teknik sorun çözüldüğünde sana en iyi şekilde yardımcı olmak için sabırsızlanıyorum!

**Biraz sonra tekrar dener misin?** 🚀`;
  }
};
