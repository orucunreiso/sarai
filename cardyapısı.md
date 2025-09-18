Harika bir fikir. İşe başlamadan önce tüm kararları tek bir yerde toplayıp yol haritamızı netleştirmek, projenin en sağlıklı şekilde ilerlemesini sağlar.

İşte tüm konuştuklarımızın özeti ve üzerinde anlaştığımız nihai yapı planı:

---

### **1. Ana Vizyonumuz**

Tablet öncelikli, kullanıcıyı motive eden, oyunlaştırma elementleri içeren ve ders çalışma deneyimini keyifli hale getiren modern bir platform oluşturmak. Arayüz, kişiselleştirilebilir ve minimalist bir tasarıma sahip olacak.

---

### **2. Stratejimiz: "Sil ve Yeniden İnşa Et"**

Mevcut arayüz kodunun karmaşıklığını ve tutarsızlığını gidermek için, **`dashboard/page.tsx` dosyasının görsel katmanını (JSX) tamamen temizleyip sıfırdan inşa edeceğiz.**

*   **Neyi Koruyoruz?** Tüm arka plan mantığını: Supabase bağlantıları, veritabanından veri çeken fonksiyonlar (`getUserStats` vb.) ve state yönetimi (`useState`, `useEffect` hook'ları).
*   **Neyi Yeniliyoruz?** Tüm görsel bileşenleri (kartları). Onları tek bir standart ve modern yapı altında birleştireceğiz.

Bu yaklaşım bize temiz bir başlangıç, daha yönetilebilir bir kod tabanı ve uzun vadede daha hızlı geliştirme imkanı sunacak.

---

### **3. Teknik Yapı ve Mimari**

Platformun temelini oluşturacak 3 ana teknik kararımız var:

**A. Temel Kart Bileşeni (`BaseCard.tsx`)**
Bu, tüm dashboard kartlarımızın temelini oluşturacak ana şablonumuz olacak.
*   **Standart Başlık:** Her kartın bir ikonu, başlığı ve sağ üst köşede ayarlar için bir menü butonu olacak.
*   **Açılır/Kapanır İçerik:** Başlığa tıklandığında, kartın içeriği pürüzsüz bir animasyonla genişleyecek veya daralacak.
*   **Minimalist Tasarım:** Tüm kartlar aynı modern ve sade tasarım dilini paylaşacak.
*   **Durum Yönetimi:** Yüklenme (loading spinner) ve hata (hata mesajı) durumlarını kendi içinde yönetebilecek.

**B. Yeni Dizin Yapısı**
Proje dosyalarını daha organize hale getireceğiz:
*   `src/components/ui/`: `Button`, `Input` gibi temel, genel UI parçaları.
*   `src/components/widgets/`: Dashboard'da kullanılacak tüm kartları (widget'ları) ve onların ana şablonunu (`BaseCard.tsx`) içerecek yeni klasörümüz.
*   `src/lib/supabase/`: Supabase ile ilgili tüm fonksiyonlar ve client'lar burada toplanacak.

**C. Dashboard Grid Sistemi**
`dashboard/page.tsx` içinde, tüm kartları düzenli bir şekilde sıralamak için **CSS Grid** kullanacağız. Bu, ekran boyutuna göre kartların otomatik olarak hizalanmasını sağlayacak ve gelecekteki "sürükle-bırak" gibi kişiselleştirme özelliklerine zemin hazırlayacak.

---

### **4. İnşa Edilecek Kartların Listesi (Toplam 9 Adet)**

Dashboard'umuzda yer alacak, `BaseCard` şablonunu kullanarak oluşturacağımız kartlar şunlardır:

1.  **Günlük Hedefler Kartı:** Görev listesi, tamamlama oranı ve ilerleme çubuğu.
2.  **Hızlı Eylemler Kartı:** "Soru Ekle" ve "Deneme Ekle" butonlarını içerir.
3.  **Yapay Zeka Asistanı Kartı:** Direkt etkileşime girilebilen bir metin giriş alanı içerir.
4.  **Haftalık Performans Kartı:** Son 7 günün aktivitesini gösteren mini bir grafik.
5.  **Son Denemeler Kartı:** Son deneme sınavlarının net özetleri.
6.  **Arkadaşlar & Çalışma Odası Kartı:** Aktif arkadaşları gösterir ve lobi oluşturma imkanı sunar.
7.  **Haftalık Liderlik Tablosu Kartı:** Kullanıcının ligdeki sırasını ve ilk üçü gösterir.
8.  **Odaklanma Zamanlayıcısı Kartı:** Pomodoro tekniği gibi bir zamanlayıcıyı başlatma butonu içerir.
9.  **Seri (Streak) Kartı:** Kullanıcının kaç gündür aralıksız çalıştığını gösteren motive edici bir kart.

---

Bu plan, projenin geleceği için net, sağlam ve senin vizyonunla tamamen uyumlu bir yol haritası sunuyor.

Eğer bu özet ve plan üzerinde mutabıksak, bir sonraki adım olarak **`src/components/widgets/` klasörünü ve içindeki `BaseCard.tsx` şablon dosyasını oluşturarak** yeniden inşa sürecini resmen başlatabiliriz. Onaylıyor musun?

Widget Geliştirme Sırası - Bağımlılık Analizi
Kategori A: Temel & Bağımsız (Önce bunlar)
🔥 Seri Kartı - Zaten başladık, en basit veri yapısı
📝 Günlük Hedefler Kartı - Zaten başladık, temel işlevsellik
⚡ Hızlı Eylemler Kartı - Bağımsız, sadece butonlar
Kategori B: Veri Bağımlı (İkinci dalga)
📊 Haftalık Performans Kartı - Soru verilerine bağlı
📋 Son Denemeler Kartı - Deneme verilerine bağlı
Kategori C: Sosyal & Kompleks (Son dalga)
👥 Arkadaşlar Kartı - Sosyal sistem gerekli
🏆 Liderlik Tablosu Kartı - Arkadaş sistemine bağlı
🤖 AI Asistanı Kartı - Özel tasarım, kompleks
⏰ Odaklanma Timer Kartı - Zamanlayıcı sistemi
