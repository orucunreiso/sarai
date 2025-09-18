'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';
import '@/components/widgets/widgets.css';
import { Flame, Trophy, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats } from '@/lib/database/dashboard-api';
import StreakWidget from '@/components/widgets/StreakWidget';
import DailyGoalsWidget from '@/components/widgets/DailyGoalsWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import GoalsModal from '@/components/modals/GoalsModal';
import GoalsHistoryModal from '@/components/modals/GoalsHistoryModal';

interface DashboardStats {
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
  isGoalCompleted: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [achievementsCount] = useState(3); // Mock data for now
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0); // Widget'ı yenilemek için

  const [stats, setStats] = useState<DashboardStats>({
    questionsToday: 0,
    questionsTotal: 0,
    currentStreak: 0,
    longestStreak: 0,
    currentLevel: 1,
    totalXP: 0,
    xpToNextLevel: 100,
    dailyGoal: 5,
    weeklyGoal: 35,
    monthlyGoal: 150,
    activeDays: 0,
    avgQuestionsPerDay: 0,
    isGoalCompleted: false,
  });

  // Load user stats
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const userStatsResult = await getUserStats(user.id);
      if (userStatsResult.data) {
        const userStats = userStatsResult.data;
        setStats({
          questionsToday: userStats.questionsToday || 0,
            questionsTotal: userStats.questionsTotal || 0,
            currentStreak: userStats.currentStreak || 0,
            longestStreak: userStats.currentStreak || 0,
          currentLevel: userStats.currentLevel || 1,
            totalXP: userStats.totalXP || 0,
            xpToNextLevel: 100 - ((userStats.totalXP || 0) % 100),
          dailyGoal: userStats.dailyGoal || 5,
          weeklyGoal: userStats.weeklyGoal || 35,
          monthlyGoal: userStats.monthlyGoal || 150,
          activeDays: userStats.activeDays || 0,
          avgQuestionsPerDay: userStats.avgQuestionsPerDay || 0,
            isGoalCompleted: false,
          });
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

    loadStats();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const levelProgress = ((stats.totalXP % 100) / 100) * 100;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center notebook-background">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full mb-4 mx-auto"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen notebook-background">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Merhaba Sara! ☀️</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600">Level {stats.currentLevel}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-pink-200 rounded-full h-2">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-coral-500 rounded-full transition-all duration-300"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{stats.totalXP} XP</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.currentStreak} gün</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">{achievementsCount} rozet</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  3
                </div>
              </button>
              <button className="p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors">
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content - Notebook Style */}
      <div className="notebook-paper">
        {/* Widget Grid */}
        <div className="widget-grid">
          {/* Quick Actions Widget - Enhanced */}
          <QuickActionsWidget
            onAddQuestion={() => router.push('/solve')}
            onAddMockExam={() => alert('Deneme oluşturma sayfası açılacak!')}
            onStartFocusSession={() => alert('Odak seansı başlatılıyor!')}
            onStartStudy={() => router.push('/solve')}
          />

          {/* Daily Goals Widget - Completed */}
          <DailyGoalsWidget
            key={`daily-goals-widget-${widgetKey}`}
            onGoalsModalOpen={() => setIsGoalsModalOpen(true)}
            onHistoryModalOpen={() => setIsHistoryModalOpen(true)}
          />

          {/* Seri Widget - Completed */}
          <StreakWidget
            key="streak-widget"
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
          />
              </div>
            </div>

      {/* Goals Modal */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onGoalsUpdate={() => {
          // Widget'ı yeniden render etmek için key'i değiştir
          setWidgetKey(prev => prev + 1);
        }}
      />

      {/* Goals History Modal */}
      <GoalsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}
