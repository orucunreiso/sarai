'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  Star,
  Trophy,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Zap,
  Clock,
} from 'lucide-react';

export interface ProgressStats {
  questionsToday: number;
  questionsTotal: number;
  currentStreak: number;
  longestStreak: number;
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  activeDays: number;
  avgQuestionsPerDay: number;
}

export interface ProgressBadgesProps {
  stats: ProgressStats;
  compact?: boolean;
}

export const ProgressBadges: React.FC<ProgressBadgesProps> = ({ stats, compact = false }) => {
  const [animatedStats, setAnimatedStats] = useState(stats);

  // Animate number changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedStats(stats);
    }, 100);

    return () => clearTimeout(timeout);
  }, [stats]);

  const badges = [
    {
      id: 'daily_progress',
      title: 'Günlük Hedef',
      icon: Target,
      value: stats.questionsToday,
      target: stats.dailyGoal,
      unit: 'soru',
      color: 'blue',
      description: `Bugün ${stats.questionsToday}/${stats.dailyGoal} soru`,
    },
    {
      id: 'current_streak',
      title: 'Aktif Seri',
      icon: Flame,
      value: stats.currentStreak,
      target: Math.max(stats.longestStreak, stats.currentStreak + 1),
      unit: 'gün',
      color: 'orange',
      description: `${stats.currentStreak} gün üst üste`,
    },
    {
      id: 'level_progress',
      title: 'Seviye İlerlemesi',
      icon: Star,
      value: stats.totalXP % 100, // XP in current level
      target: 100, // XP needed for next level
      unit: 'XP',
      color: 'purple',
      description: `Seviye ${stats.currentLevel} → ${stats.currentLevel + 1}`,
    },
    {
      id: 'total_questions',
      title: 'Toplam Çözülen',
      icon: BookOpen,
      value: stats.questionsTotal,
      target: Math.ceil(stats.questionsTotal / 100) * 100, // Next hundred milestone
      unit: 'soru',
      color: 'green',
      description: `Toplam ${stats.questionsTotal} soru çözdün`,
    },
    {
      id: 'monthly_activity',
      title: 'Aylık Aktivite',
      icon: Calendar,
      value: stats.activeDays,
      target: 30,
      unit: 'gün',
      color: 'cyan',
      description: `Bu ay ${stats.activeDays} gün aktif`,
    },
    {
      id: 'performance',
      title: 'Performans',
      icon: TrendingUp,
      value: Math.round(stats.avgQuestionsPerDay),
      target: Math.max(stats.dailyGoal, Math.round(stats.avgQuestionsPerDay) + 1),
      unit: 'soru/gün',
      color: 'pink',
      description: `Ortalama ${stats.avgQuestionsPerDay.toFixed(1)} soru/gün`,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'from-blue-500 to-blue-600',
        ring: 'ring-blue-400',
        text: 'text-blue-100',
        progress: 'bg-blue-400',
      },
      orange: {
        bg: 'from-orange-500 to-red-500',
        ring: 'ring-orange-400',
        text: 'text-orange-100',
        progress: 'bg-orange-400',
      },
      purple: {
        bg: 'from-purple-500 to-pink-500',
        ring: 'ring-purple-400',
        text: 'text-purple-100',
        progress: 'bg-purple-400',
      },
      green: {
        bg: 'from-green-500 to-emerald-500',
        ring: 'ring-green-400',
        text: 'text-green-100',
        progress: 'bg-green-400',
      },
      cyan: {
        bg: 'from-cyan-500 to-blue-500',
        ring: 'ring-cyan-400',
        text: 'text-cyan-100',
        progress: 'bg-cyan-400',
      },
      pink: {
        bg: 'from-pink-500 to-rose-500',
        ring: 'ring-pink-400',
        text: 'text-pink-100',
        progress: 'bg-pink-400',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {badges.slice(0, 3).map((badge) => {
          const colorClasses = getColorClasses(badge.color);
          const progress = Math.min((badge.value / badge.target) * 100, 100);
          const IconComponent = badge.icon;

          return (
            <div
              key={badge.id}
              className={`
                relative bg-gradient-to-br ${colorClasses.bg}
                rounded-xl p-3 shadow-lg
                ring-1 ${colorClasses.ring} ring-opacity-25
                transition-all duration-300 hover:scale-105
                min-w-[120px]
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className={`w-4 h-4 ${colorClasses.text}`} />
                <span className={`text-xs font-medium ${colorClasses.text}`}>{badge.title}</span>
              </div>

              <div className={`text-lg font-bold ${colorClasses.text} mb-1`}>
                {badge.value}
                <span className="text-xs opacity-75 ml-1">/{badge.target}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/20 rounded-full h-1.5">
                <div
                  className={`${colorClasses.progress} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => {
        const colorClasses = getColorClasses(badge.color);
        const progress = Math.min((badge.value / badge.target) * 100, 100);
        const IconComponent = badge.icon;
        const isCompleted = badge.value >= badge.target;

        return (
          <div
            key={badge.id}
            className={`
              relative bg-gradient-to-br ${colorClasses.bg}
              rounded-2xl p-6 shadow-xl
              ring-1 ${colorClasses.ring} ring-opacity-25
              transition-all duration-300 hover:scale-[1.02]
              ${isCompleted ? 'animate-glow-pulse' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <IconComponent className={`w-5 h-5 ${colorClasses.text}`} />
                </div>
                <h3 className={`font-semibold ${colorClasses.text}`}>{badge.title}</h3>
              </div>

              {isCompleted && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-medium text-yellow-300">Tamamlandı!</span>
                </div>
              )}
            </div>

            {/* Progress Value */}
            <div className="mb-4">
              <div className={`text-3xl font-bold ${colorClasses.text} mb-1`}>
                {badge.value.toLocaleString()}
                <span className="text-lg opacity-75 ml-2">{badge.unit}</span>
              </div>
              <p className={`text-sm ${colorClasses.text} opacity-80`}>{badge.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className={`${colorClasses.text} opacity-75`}>İlerleme</span>
                <span className={`${colorClasses.text} font-medium`}>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2">
                <div
                  className={`${colorClasses.progress} h-full rounded-full transition-all duration-700 relative`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Progress glow effect */}
                  <div
                    className={`absolute inset-0 ${colorClasses.progress} rounded-full blur-sm opacity-50`}
                  />
                </div>
              </div>
            </div>

            {/* Target Info */}
            <div className="flex justify-between items-center">
              <span className={`text-xs ${colorClasses.text} opacity-75`}>
                Hedef: {badge.target.toLocaleString()} {badge.unit}
              </span>
              <span className={`text-xs ${colorClasses.text} font-medium`}>
                {badge.target - badge.value > 0
                  ? `${(badge.target - badge.value).toLocaleString()} kaldı`
                  : 'Hedef aşıldı! 🎉'}
              </span>
            </div>

            {/* Completion Sparkles */}
            {isCompleted && (
              <>
                <div className="absolute -top-1 -right-1 animate-bounce">
                  <Star className="w-4 h-4 text-yellow-300" />
                </div>
                <div
                  className="absolute -bottom-1 -left-1 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                >
                  <Award className="w-3 h-3 text-yellow-300" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Quick Stats Component for Dashboard
export const QuickProgressStats: React.FC<{ stats: ProgressStats }> = ({ stats }) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/20">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Günlük Durum
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">{stats.questionsToday}</div>
          <div className="text-xs text-gray-400">Bugün Çözülen</div>
          <div className="text-xs text-blue-400">/{stats.dailyGoal} hedef</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5" />
            {stats.currentStreak}
          </div>
          <div className="text-xs text-gray-400">Günlük Seri</div>
          <div className="text-xs text-orange-400">gün üst üste</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1 flex items-center justify-center gap-1">
            <Star className="w-5 h-5" />
            {stats.currentLevel}
          </div>
          <div className="text-xs text-gray-400">Mevcut Seviye</div>
          <div className="text-xs text-purple-400">{100 - (stats.totalXP % 100)} XP kaldı</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.questionsTotal}</div>
          <div className="text-xs text-gray-400">Toplam Soru</div>
          <div className="text-xs text-green-400">çözüldü</div>
        </div>
      </div>
    </div>
  );
};

// Weekly Progress Component
export const WeeklyProgress: React.FC<{
  weeklyData: { day: string; questions: number; xp: number }[];
}> = ({ weeklyData }) => {
  const maxQuestions = Math.max(...weeklyData.map((d) => d.questions));

  return (
    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-indigo-500/20">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Haftalık Aktivite
      </h3>

      <div className="flex justify-between items-end gap-2 h-32">
        {weeklyData.map((day, index) => {
          const height = maxQuestions > 0 ? (day.questions / maxQuestions) * 100 : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative flex-1 w-full flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-500 hover:scale-105"
                  style={{ height: `${height}%` }}
                >
                  {day.questions > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-gray-900 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                      {day.questions} soru
                      <br />
                      {day.xp} XP
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-medium">{day.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
