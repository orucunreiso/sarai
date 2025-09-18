import { GoogleGenerativeAI } from '@google/generative-ai';
import { SARAI_SYSTEM_PROMPT } from '@/lib/prompts/system';

/**
 * Desteklenen dosya tipleri ve MIME types
 */
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  TXT: 'text/plain',
  CSV: 'text/csv',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.ms-excel',
  DOC: 'application/msword',
} as const;

/**
 * Maksimum dosya boyutu (20MB)
 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Dosya işleme sonuç tipi
 */
export interface FileProcessingResult {
  success: boolean;
  response?: string;
  error?: string;
  fileUri?: string;
}

/**
 * Dosya yükleme parametreleri
 */
export interface ProcessDocumentParams {
  file: File;
  userMessage: string;
  conversationHistory?: string;
  systemPrompt?: string;
}

/**
 * Google AI Model'i başlat
 */
const initializeGemini = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  console.log('🔑 Gemini API Key check:', apiKey ? 'PRESENT' : 'MISSING');
  console.log('🔑 API Key length:', apiKey?.length);

  if (!apiKey || apiKey.includes('your_gemini')) {
    console.log('⚠️ Demo mode active - API key invalid');
    return { model: null, isDemo: true };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    console.log('✅ Gemini API initialized successfully');
    return { model, isDemo: false };
  } catch (error) {
    console.error('❌ Gemini initialization failed:', error);
    return { model: null, isDemo: true };
  }
};

/**
 * Dosya MIME tipini kontrol et
 */
export function getMimeType(file: File): string {
  return file.type || 'application/octet-stream';
}

/**
 * Dosya validasyonu yap
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Dosya boyutu kontrolü
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB destekleniyor.`,
    };
  }

  // Dosya tipi kontrolü
  const mimeType = getMimeType(file);
  const supportedTypes = Object.values(SUPPORTED_FILE_TYPES);

  if (!supportedTypes.includes(mimeType as any)) {
    return {
      valid: false,
      error: `Desteklenmeyen dosya tipi: ${mimeType}. Desteklenen tipler: PDF, TXT, CSV, DOCX, XLSX, DOC`,
    };
  }

  // Dosya adı kontrolleri
  if (!file.name || file.name.length > 255) {
    return {
      valid: false,
      error: 'Geçersiz dosya adı',
    };
  }

  return { valid: true };
}

/**
 * Dosyayı text'e çevir
 */
export async function extractTextFromFile(file: File): Promise<{ text?: string; error?: string }> {
  try {
    console.log('📄 Dosya içeriği çıkarılıyor:', file.name);

    const mimeType = getMimeType(file);

    // Text dosyaları için doğrudan okuma
    if (mimeType === SUPPORTED_FILE_TYPES.TXT || mimeType === SUPPORTED_FILE_TYPES.CSV) {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsText(file);
      });

      return { text };
    }

    // PDF ve diğer dosya türleri için şimdilik placeholder
    // Gerçek uygulamada server-side processing gerekli
    const placeholderText = `
[Belge: ${file.name}]
Dosya Tipi: ${mimeType}
Dosya Boyutu: ${formatFileSize(file.size)}
Oluşturulma: ${new Date().toLocaleString('tr-TR')}

Bu dosya yüklendi ve analiz için hazır.
Dosya içeriğini görmek için tam Google Gemini API entegrasyonu gerekli.
`;

    return { text: placeholderText };
  } catch (error) {
    console.error('❌ Dosya içerik çıkarma hatası:', error);
    return {
      error: `Dosya içeriği çıkarılamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
    };
  }
}

/**
 * Dosya metni ile chat yap
 */
export async function chatWithDocumentText(
  documentText: string,
  userMessage: string,
  conversationHistory?: string,
): Promise<string> {
  const { model, isDemo } = initializeGemini();

  if (isDemo || !model) {
    return generateDemoResponse(userMessage, documentText);
  }

  try {
    console.log('💬 Belge metni ile chat başlatılıyor...');

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Chat hatası:', error);
    throw new Error(
      `Belge analizi sırasında hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
    );
  }
}

/**
 * Demo response generator
 */
function generateDemoResponse(userMessage: string, documentText?: string): string {
  return `## 📄 Demo Belge Analizi
Bu bir demo çözümüdür. Gerçek AI belge analizi için Google Gemini API key'i gereklidir.

## 💬 Kullanıcı Sorusu
"${userMessage}"

## 📚 Belge Bilgileri
${documentText ? documentText.substring(0, 300) + '...' : 'Belge başarıyla yüklendi'}

## 🔍 Demo Analiz
Gerçek API ile bu belge tam olarak analiz edilecek ve sorularınız cevaplanacaktı.

## ✅ Demo Cevap
API key'i ayarlayarak tam belge analizi alabilirsiniz.

## 💡 API Kurulumu
\`GOOGLE_GEMINI_API_KEY\` environment variable'ını ayarlayın.

**Not:** Bu demo yanıtıdır. Gerçek belge analizi için API yapılandırması gerekli.`;
}

/**
 * Ana dosya işleme fonksiyonu
 * Tüm süreci yönetir: validation, text extraction, chat
 */
export async function processDocument({
  file,
  userMessage,
  conversationHistory = '',
  systemPrompt = SARAI_SYSTEM_PROMPT,
}: ProcessDocumentParams): Promise<FileProcessingResult> {
  try {
    console.log('🚀 Belge işleme başlatılıyor:', file.name);

    // 1. Dosya validasyonu
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // 2. Dosya içeriğini çıkar
    const extractResult = await extractTextFromFile(file);
    if (extractResult.error) {
      return {
        success: false,
        error: extractResult.error,
      };
    }

    // 3. Dosya metni ile chat yap
    const response = await chatWithDocumentText(
      extractResult.text!,
      userMessage,
      conversationHistory,
    );

    console.log('✅ Belge işleme tamamlandı');

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error('❌ Belge işleme hatası:', error);
    return {
      success: false,
      error: `Belge işleme başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
    };
  }
}

/**
 * Dosya tipini kontrol et
 */
export function isSupportedFileType(file: File): boolean {
  const mimeType = getMimeType(file);
  return Object.values(SUPPORTED_FILE_TYPES).includes(mimeType as any);
}

/**
 * Dosya boyutunu human-readable formatta döndür
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
