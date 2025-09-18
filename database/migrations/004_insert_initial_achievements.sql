-- Insert Additional Achievements for SARAI Platform
-- Migration: 004_insert_initial_achievements.sql

-- Skip existing achievements from 003_create_user_profiles.sql and add new ones

-- İlk Gün Rozetleri (First Day Badges) - Additional ones
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('Meraklı Öğrenci', 'İlk gününde 3 soru çözdün!', '🤔', 'progress', 'questions_count', 3, 25, 'rare'),
('Hızlı Başlangıç', 'İlk gününde 5 soru çözdün!', '⚡', 'progress', 'questions_count', 5, 40, 'rare'),
('Günlük Hedef', 'İlk günlük hedefinizi tamamladın!', '🎯', 'progress', 'daily_goals', 1, 50, 'epic');

-- Seviye Rozetleri (Level Badges)
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('Yeni Başlayan', '2. seviyeye ulaştın!', '🌱', 'milestone', 'xp_total', 200, 25, 'common'),
('Gelişen Öğrenci', '5. seviyeye ulaştın!', '📚', 'milestone', 'xp_total', 500, 50, 'rare'),
('Deneyimli', '10. seviyeye ulaştın!', '🎓', 'milestone', 'xp_total', 1000, 100, 'epic'),
('Uzman', '20. seviyeye ulaştın!', '👨‍🎓', 'milestone', 'xp_total', 2000, 200, 'legendary'),
('Master', '50. seviyeye ulaştın!', '🏆', 'milestone', 'xp_total', 5000, 500, 'legendary');

-- Soru Çözme Rozetleri (Question Solving Badges) - Skip duplicates from 003 migration
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
-- Skip: 5, 10, 25, 50, 100 already exist in 003 migration
('Soru Makinesi', 'Toplam 250 soru çözdün!', '🤖', 'progress', 'questions_count', 250, 250, 'epic'),
('Çözüm Ustası', 'Toplam 500 soru çözdün!', '🧠', 'progress', 'questions_count', 500, 500, 'legendary');

-- Streak Rozetleri (Streak Badges)
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('İlk Streak', '3 gün üst üste çalıştın!', '🔥', 'streak', 'streak_days', 3, 40, 'rare'),
('Haftalık Streak', '7 gün üst üste çalıştın!', '📅', 'streak', 'streak_days', 7, 75, 'epic'),
('İki Hafta', '14 gün üst üste çalıştın!', '📆', 'streak', 'streak_days', 14, 150, 'epic'),
('Aylık Streak', '30 gün üst üste çalıştın!', '🗓️', 'streak', 'streak_days', 30, 300, 'legendary'),
('Alev Topu', '50 gün üst üste çalıştın!', '☄️', 'streak', 'streak_days', 50, 500, 'legendary');

-- XP Rozetleri (XP Badges)
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('XP Toplayıcı', 'Toplam 500 XP kazandın!', '⭐', 'progress', 'xp_total', 500, 50, 'common'),
('XP Avcısı', 'Toplam 1000 XP kazandın!', '🌟', 'progress', 'xp_total', 1000, 75, 'rare'),
('XP Efendisi', 'Toplam 2500 XP kazandın!', '💫', 'progress', 'xp_total', 2500, 150, 'epic'),
('XP Efsanesi', 'Toplam 5000 XP kazandın!', '✨', 'progress', 'xp_total', 5000, 300, 'legendary');

-- Günlük Aktivite Rozetleri (Daily Activity Badges)
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('Günlük 10', 'Bir günde 10 soru çözdün!', '🏃‍♂️', 'progress', 'questions_count', 10, 60, 'rare'),
('Günlük 20', 'Bir günde 20 soru çözdün!', '🏃‍♂️💨', 'progress', 'questions_count', 20, 100, 'epic'),
('Maraton', 'Bir günde 50 soru çözdün!', '🏃‍♂️🔥', 'progress', 'questions_count', 50, 200, 'legendary');

-- Özel Günler Rozetleri (Special Days Badges)
INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, xp_reward, rarity) VALUES
('Hafta Sonu Savaşçısı', 'Hafta sonu da çalışmaya devam ettin!', '⚔️', 'special', 'daily_goals', 2, 30, 'rare'),
('Düzenli Öğrenci', 'Bu hafta 5 gün aktif oldun!', '📖', 'progress', 'daily_goals', 5, 75, 'epic'),
('Aylık Aktif', 'Bu ay 20 gün aktif oldun!', '📈', 'progress', 'daily_goals', 20, 200, 'legendary');