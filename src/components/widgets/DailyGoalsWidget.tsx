import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Clock, TrendingUp, Calendar } from 'lucide-react';
import BaseWidget from './BaseWidget';
import GoalsModal from '../modals/GoalsModal';
import { getDailyGoals, calculateDailyGoalStats, type DailyGoal } from '@/lib/database/goals-api';
import { useAuth } from '@/contexts/AuthContext';

interface DailyGoalsWidgetProps {
  className?: string;
  onGoalsModalOpen?: () => void;
  onHistoryModalOpen?: () => void;
}

const DailyGoalsWidget: React.FC<DailyGoalsWidgetProps> = ({
  className = '',
  onGoalsModalOpen,
  onHistoryModalOpen,
}) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hedefleri veritabanından yükle
  useEffect(() => {
    if (user?.id) {
      loadDailyGoals();
    }
  }, [user?.id]);

  const loadDailyGoals = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const dailyGoals = await getDailyGoals(user.id);
      setGoals(dailyGoals);
    } catch (error) {
      console.error('Error loading daily goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentGoals = goals;
  const stats = calculateDailyGoalStats(currentGoals);
  const { completedGoals, totalGoals, completionRate, mainProgress } = stats;

  // Loading state
  if (isLoading) {
    return (
      <BaseWidget
        title="Günlük Hedefler"
        icon={<Target className="text-gray-400" />}
        defaultExpanded={false}
        className={className}
        widgetId="daily-goals"
        collapsedContent={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin w-6 h-6 border-2 border-pink-300 border-t-pink-600 rounded-full"></div>
            <span className="ml-3 text-sm text-gray-500">Hedefler yükleniyor...</span>
          </div>
        }
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-pink-300 border-t-pink-600 rounded-full"></div>
          <span className="ml-3 text-gray-500">Hedefler yükleniyor...</span>
        </div>
      </BaseWidget>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 75) return 'from-blue-500 to-cyan-500';
    if (progress >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-pink-500 to-coral-500';
  };

  const getMotivationMessage = () => {
    if (completionRate === 100) return "🎉 Tüm hedefler tamamlandı!";
    if (completionRate >= 75) return "💪 Harika gidiyorsun!";
    if (completionRate >= 50) return "🎯 Yarı yoldasın!";
    if (completionRate > 0) return "🚀 Güzel bir başlangıç!";
    return "📚 Hadi başlayalım!";
  };

  // Collapsed view content - sadece genel ilerleme
  const collapsedView = (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-xl border border-pink-100/50">
      {/* Sol: Circular Progress */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-pink-500"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={`${mainProgress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{Math.round(mainProgress)}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-base font-semibold text-gray-800">Genel İlerleme</p>
          <p className="text-sm text-gray-600">{completedGoals}/{totalGoals} hedef tamamlandı</p>
          <p className="text-xs text-gray-500 mt-1">
            {completionRate === 100 ? "🎉 Tüm hedefler tamamlandı!" : 
             completionRate >= 75 ? "🔥 Harika gidiyorsun!" : 
             completionRate >= 50 ? "💪 Yarı yoldasın!" : 
             "📚 Hadi başlayalım!"}
          </p>
        </div>
      </div>
      
      {/* Sağ: Status Icon */}
      <div className="text-right">
        <div className="text-2xl mb-1">
          {completionRate === 100 ? "🎉" : completionRate >= 75 ? "🔥" : completionRate >= 50 ? "💪" : "📚"}
        </div>
        <p className="text-xs text-gray-500 font-medium">{Math.round(mainProgress)}%</p>
      </div>
    </div>
  );

  return (
    <BaseWidget
      title="Günlük Hedefler"
      icon={<Target className={completionRate === 100 ? 'text-green-500' : 'text-pink-500'} />}
      defaultExpanded={false}
      className={className}
      widgetId="daily-goals"
      collapsedContent={collapsedView}
      onAction={() => {
        console.log('Modal açılıyor...');
        onGoalsModalOpen?.();
      }}
      secondaryAction={{
        icon: <Calendar size={16} />,
        onClick: () => {
          console.log('Geçmiş modal açılıyor...');
          onHistoryModalOpen?.();
        },
        label: 'Geçmiş hedefleri görüntüle'
      }}
    >
      <div className="space-y-4">
        {/* Basit İlerleme Göstergesi */}
        <div className="text-center">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor(mainProgress)} transition-all duration-500 rounded-full`}
              style={{ width: `${mainProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {completionRate === 100
              ? "🎉 Tüm hedefler tamamlandı!" 
              : `${completedGoals}/${totalGoals} hedef tamamlandı (%${Math.round(mainProgress)})`
            }
          </p>
        </div>

        {/* Hedef Listesi - Sadeleştirilmiş */}
        <div className="space-y-2">
          {currentGoals.map((goal) => (
            <div 
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                goal.completed 
                  ? 'bg-green-50' 
                  : 'bg-gray-50'
              }`}
            >
              <div className={`flex-shrink-0 ${goal.completed ? 'text-green-500' : 'text-gray-400'}`}>
                {goal.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${
                  goal.completed ? 'text-green-700 line-through' : 'text-gray-700'
                }`}>
                  {goal.title}
                </p>
                <p className="text-xs text-gray-500">
                  {goal.currentValue}/{goal.targetValue} {goal.unit}
                </p>
              </div>
              
              {goal.completed && (
                <div className="text-green-500">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
    </BaseWidget>
  );
};

export default DailyGoalsWidget;
