import React from 'react';
import { Flame, TrendingUp, Calendar, Trophy } from 'lucide-react';
import BaseWidget from './BaseWidget';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

const StreakWidget: React.FC<StreakWidgetProps> = ({
  currentStreak,
  longestStreak,
  className = '',
}) => {
  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Hadi başlayalım! 💪";
    if (streak === 1) return "Harika bir başlangıç! 🌟";
    if (streak <= 7) return `${streak} gündür harikasın! 🎯`;
    if (streak <= 30) return `${streak} günlük süper seri! 🏆`;
    return `${streak} günlük efsane seri! 🔥🔥🔥`;
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return "text-gray-400";
    if (streak <= 3) return "text-orange-400";
    if (streak <= 7) return "text-orange-500";
    if (streak <= 15) return "text-red-500";
    if (streak <= 30) return "text-red-600";
    return "text-red-700";
  };

  const getStreakBgColor = (streak: number) => {
    if (streak === 0) return "from-gray-100 to-gray-200";
    if (streak <= 3) return "from-orange-100 to-orange-200";
    if (streak <= 7) return "from-orange-200 to-red-200";
    if (streak <= 15) return "from-red-200 to-red-300";
    if (streak <= 30) return "from-red-300 to-red-400";
    return "from-red-400 to-red-500";
  };

  const getFlameEmoji = (streak: number) => {
    if (streak === 0) return "💤";
    if (streak <= 3) return "🔥";
    if (streak <= 7) return "🔥🔥";
    if (streak <= 15) return "🔥🔥🔥";
    return "🔥🔥🔥🔥";
  };

  // Collapsed view content - summary info
  const collapsedView = (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-xl border border-orange-100/50">
      {/* Sol: Flame & Current Streak */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStreakBgColor(currentStreak)} flex items-center justify-center shadow-md`}>
          <span className="text-xl">
            {getFlameEmoji(currentStreak)}
          </span>
        </div>
        
        <div>
          <p className={`text-lg font-bold ${getStreakColor(currentStreak)}`}>
            {currentStreak} gün
          </p>
          <p className="text-xs text-gray-500">
            {currentStreak === 0 ? "Seriyi başlat!" : "aktif seri"}
          </p>
        </div>
      </div>
      
      {/* Sağ: Best Streak */}
      <div className="text-right">
        <div className="flex items-center gap-1 text-yellow-600">
          <Trophy size={14} />
          <span className="text-sm font-semibold">{longestStreak}</span>
        </div>
        <p className="text-xs text-gray-500">en uzun</p>
      </div>
    </div>
  );

  return (
    <BaseWidget
      title="Çalışma Serisi"
      icon={<Flame className={getStreakColor(currentStreak)} />}
      defaultExpanded={false}
      className={className}
      widgetId="streak-widget"
      collapsedContent={collapsedView}
      onAction={() => alert('Seri ayarları açılacak! 🔥')}
    >
      <div className="space-y-6">
        {/* Ana Seri Gösterimi */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getStreakBgColor(currentStreak)} mb-4 shadow-lg`}>
            <div className="text-3xl">
              {getFlameEmoji(currentStreak)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getStreakColor(currentStreak)} transition-colors duration-300`}>
              {currentStreak}
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {currentStreak === 1 ? "gün" : "gün"}
            </p>
            <p className="text-sm text-gray-600 max-w-48 mx-auto leading-relaxed">
              {getStreakMessage(currentStreak)}
            </p>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-blue-600">{longestStreak}</div>
            <p className="text-xs text-blue-500 font-medium">En Uzun Seri</p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-green-600">
              {currentStreak > 0 ? "Aktif" : "Başla"}
            </div>
            <p className="text-xs text-green-500 font-medium">Durum</p>
          </div>
        </div>

        {/* Motivasyon Çubuğu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>İlerleme</span>
            <span>Sonraki seviye: {Math.ceil((currentStreak + 1) / 7) * 7} gün</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${currentStreak > 0 ? 'from-orange-400 to-red-500' : 'from-gray-300 to-gray-400'} transition-all duration-500 ease-out`}
              style={{ 
                width: `${Math.min(((currentStreak % 7) / 7) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Eylem Çağrısı */}
        {currentStreak === 0 && (
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm font-medium text-yellow-800 mb-3">
              İlk adımı at ve serini başlat!
            </p>
            <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-medium rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 transform hover:scale-105">
              Bugün Çalışmaya Başla
            </button>
          </div>
        )}

        {/* Seri Devam Ediyor */}
        {currentStreak > 0 && (
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-medium text-green-800">
              Harika gidiyorsun! Seriyi sürdür 💪
            </p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default StreakWidget;
