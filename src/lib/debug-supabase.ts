import { supabase } from '@/lib/supabase';

export const debugSupabase = async () => {
  console.log('🔍 Supabase Debug Başlıyor...');

  // 1. Auth durumunu kontrol et
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log('👤 Auth User:', user);
    console.log('❌ Auth Error:', authError);

    if (!user) {
      console.log('⚠️ Kullanıcı giriş yapmamış!');
      return;
    }

    // 2. Session durumunu kontrol et
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log('🔑 Session:', session);
    console.log('❌ Session Error:', sessionError);

    // 3. Database bağlantısını test et
    console.log('📊 Database test ediliyor...');

    // Test: Basit bir select query
    const { count, error: testError } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true });

    console.log('📈 Test Query Count:', count);
    console.log('❌ Test Query Error:', testError);

    if (testError) {
      console.log('🚨 Database bağlantı sorunu!', testError);
    } else {
      console.log('✅ Database bağlantısı başarılı!');
    }

    // 4. RLS test et
    console.log('🛡️ RLS test ediliyor...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .limit(1);

    console.log('🔒 RLS Test Result:', rlsData);
    console.log('❌ RLS Test Error:', rlsError);
  } catch (error) {
    console.error('💥 Debug sırasında hata:', error);
  }

  console.log('✅ Supabase Debug Tamamlandı!');
};
