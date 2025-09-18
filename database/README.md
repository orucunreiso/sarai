# Sarai Database Migrations

Bu klasör Sarai YKS platformu için veritabanı migration'larını içerir.

## 📁 Klasör Yapısı
```
database/
├── migrations/           # SQL migration dosyaları
│   ├── 001_create_chat_tables.sql
│   └── 002_create_rls_policies.sql
└── README.md            # Bu dosya
```

## 🚀 Migration'ları Çalıştırma

### 1. Supabase SQL Editor'da Çalıştır
1. [Supabase Dashboard](https://supabase.com/dashboard) -> Projen -> SQL Editor
2. Migration'ları sırayla çalıştır:

#### İlk Migration (Tablolar):
```sql
-- database/migrations/001_create_chat_tables.sql içeriğini kopyala ve çalıştır
```

#### İkinci Migration (RLS Policies):
```sql
-- database/migrations/002_create_rls_policies.sql içeriğini kopyala ve çalıştır
```

### 2. Migration Sırası ÖNEMLİ!
Migration'ları **sırayla** çalıştırın:
1. `001_create_chat_tables.sql` - Tabloları oluşturur
2. `002_create_rls_policies.sql` - Güvenlik politikalarını ekler

## 🛡️ Güvenlik (RLS)
- **Row Level Security (RLS)** aktif
- Kullanıcılar sadece kendi chat'lerini görebilir
- Tüm işlemler kullanıcı bazlı filtrelenir

## 📊 Tablo Yapısı

### `chat_sessions`
- `id`: UUID (Primary Key)
- `user_id`: UUID (auth.users'a referans)
- `title`: TEXT (Sohbet başlığı)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### `chat_messages`
- `id`: UUID (Primary Key)
- `session_id`: UUID (chat_sessions'a referans)
- `role`: TEXT ('user' | 'assistant')
- `content`: TEXT (Mesaj içeriği)
- `attachments`: JSONB (Dosya ekleri)
- `created_at`: TIMESTAMP

## 🔍 Test Etme
Migration'lardan sonra:
1. `http://localhost:3000/dashboard` - Dashboard'u ziyaret et
2. "Yeni Sohbet Başlat" - İlk chat'i oluştur
3. Chat geçmişinin kaydedildiğini kontrol et

## ⚠️ Önemli Notlar
- Migration'lar **idempotent** (tekrar çalıştırılabilir)
- `IF NOT EXISTS` ve `DROP POLICY IF EXISTS` kullanılıyor
- Politika çakışmalarını önlemek için önce DROP sonra CREATE