import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SARAI_SYSTEM_PROMPT } from '@/lib/prompts/system';

// Desteklenen dosya tipleri
const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  TXT: 'text/plain',
  CSV: 'text/csv',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.ms-excel',
  DOC: 'application/msword',
} as const;

// Maksimum dosya boyutu (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function initializeGemini() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  console.log('🔑 Server-side API Key check:', apiKey ? 'PRESENT' : 'MISSING');
  console.log('🔑 API Key length:', apiKey?.length);

  if (!apiKey || apiKey.includes('your_gemini')) {
    console.log('⚠️ No valid API key found');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    console.log('✅ Gemini API initialized successfully on server');
    return model;
  } catch (error) {
    console.error('❌ Gemini initialization failed:', error);
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userMessage = formData.get('userMessage') as string;
    const conversationHistory = formData.get('conversationHistory') as string;

    if (!file || !userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dosya ve kullanıcı mesajı gerekli',
        },
        { status: 400 },
      );
    }

    console.log('📄 Server-side document processing:', file.name, file.type);

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB destekleniyor.`,
        },
        { status: 400 },
      );
    }

    // MIME type kontrolü
    const supportedTypes = Object.values(SUPPORTED_FILE_TYPES);
    if (!supportedTypes.includes(file.type as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Desteklenmeyen dosya tipi: ${file.type}`,
        },
        { status: 400 },
      );
    }

    // Dosya içeriğini çıkar
    let documentText = '';

    if (file.type === SUPPORTED_FILE_TYPES.TXT || file.type === SUPPORTED_FILE_TYPES.CSV) {
      // Text dosyaları için doğrudan okuma
      documentText = await file.text();
    } else {
      // PDF ve diğer dosya türleri için placeholder
      documentText = `
[Belge: ${file.name}]
Dosya Tipi: ${file.type}
Dosya Boyutu: ${formatFileSize(file.size)}
Yüklenme Tarihi: ${new Date().toLocaleString('tr-TR')}

Bu dosya başarıyla yüklendi. PDF ve Word belgelerinin tam içerik çıkarımı için gelişmiş işleme gereklidir.
Şu anda dosya metadata'sı ve kullanıcı sorunuza göre yardım sağlanmaktadır.
`;
    }

    // Gemini API ile chat
    const model = initializeGemini();

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI servisi şu anda kullanılamıyor. API yapılandırması kontrol edilmeli.',
        },
        { status: 500 },
      );
    }

    // Chat prompt'u oluştur
    const prompt = `
${SARAI_SYSTEM_PROMPT}

## 📝 KONUŞMA GEÇMİŞİ:
${conversationHistory || 'Yok'}

## 📄 BELGE İÇERİĞİ:
${documentText}

## 💬 ÖĞRENCİ MESAJI:
"${userMessage}"

## 🎯 GÖREVİN:
Bu belgeyi analiz et ve öğrenci mesajına Türkçe olarak şu formatı kullanarak cevap ver:

## 🔍 Belge Özeti
Belgenin ana içeriğini kısaca özetle.

## 📚 Analiz
Kullanıcının sorusuyla ilgili belge kısmını analiz et.

## ✅ Cevap
Kullanıcının sorusuna detaylı cevap ver.

## 💡 Ek Bilgiler
YKS ile ilgiliyse, konuyla ilgili ek ipuçları ver.

KURALLAR:
- Sadece belge içeriğine dayalı cevap ver
- YKS kapsamında değilse, genel eğitici yaklaşım benimse
- Türkçe ve samimi dil kullan
- Belge içeriğinde olmayan bilgiler ekleme
- Kısa ve net açıkla (maks. 400 kelime)
`;

    console.log('🤖 Gemini API ile analiz başlatılıyor...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('✅ Document processing completed successfully');

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('❌ Document processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: `Belge işleme başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Document Processing API is running',
    status: 'OK',
    supportedTypes: Object.values(SUPPORTED_FILE_TYPES),
  });
}
