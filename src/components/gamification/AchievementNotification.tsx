'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, Award } from 'lucide-react';

export interface AchievementNotificationProps {
  isVisible: boolean;
  achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xp_reward: number;
  };
  onComplete?: () => void;
  duration?: number;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  isVisible,
  achievement,
  onComplete,
  duration = 4000,
}) => {
  const [animationPhase, setAnimationPhase] = useState<
    'entering' | 'showing' | 'exiting' | 'hidden'
  >('hidden');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('entering');

      const enterTimer = setTimeout(() => setAnimationPhase('showing'), 100);
      const exitTimer = setTimeout(() => setAnimationPhase('exiting'), duration - 500);
      const completeTimer = setTimeout(() => {
        setAnimationPhase('hidden');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setAnimationPhase('hidden');
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible && animationPhase === 'hidden') {
    return null;
  }

  const getRarityStyles = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          glow: 'rgba(250, 204, 21, 0.6)',
          border: 'border-yellow-400/50',
          sparkles: 'text-yellow-300',
        };
      case 'epic':
        return {
          gradient: 'from-purple-500 via-pink-500 to-purple-600',
          glow: 'rgba(168, 85, 247, 0.6)',
          border: 'border-purple-400/50',
          sparkles: 'text-purple-300',
        };
      case 'rare':
        return {
          gradient: 'from-blue-500 via-cyan-500 to-blue-600',
          glow: 'rgba(59, 130, 246, 0.6)',
          border: 'border-blue-400/50',
          sparkles: 'text-blue-300',
        };
      default:
        return {
          gradient: 'from-green-500 via-emerald-500 to-green-600',
          glow: 'rgba(34, 197, 94, 0.6)',
          border: 'border-green-400/50',
          sparkles: 'text-green-300',
        };
    }
  };

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'entering':
        return 'opacity-0 scale-50 translate-y-8';
      case 'showing':
        return 'opacity-100 scale-100 translate-y-0';
      case 'exiting':
        return 'opacity-0 scale-95 -translate-y-4';
      default:
        return 'opacity-0 scale-50';
    }
  };

  const rarityStyles = getRarityStyles();

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`
          ${getAnimationClasses()}
          transition-all duration-700 ease-out
          bg-gradient-to-r ${rarityStyles.gradient}
          text-white px-8 py-6 rounded-3xl shadow-2xl
          border-2 ${rarityStyles.border}
          backdrop-blur-sm
          max-w-md mx-auto
        `}
        style={{
          boxShadow: `0 0 30px ${rarityStyles.glow}, 0 10px 25px rgba(0, 0, 0, 0.3)`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h3 className="text-lg font-bold">Rozet Kazandın!</h3>
            <Trophy className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider">
            {achievement.rarity === 'legendary' && '🏆 Efsanevi'}
            {achievement.rarity === 'epic' && '💜 Epik'}
            {achievement.rarity === 'rare' && '💎 Nadir'}
            {achievement.rarity === 'common' && '⭐ Ortak'}
          </div>
        </div>

        {/* Achievement Info */}
        <div className="text-center">
          {/* Achievement Icon */}
          <div className="relative mb-4">
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-75 animate-pulse"
              style={{ background: rarityStyles.glow }}
            ></div>
            <div className="relative bg-white/20 rounded-full p-4 inline-block">
              <span className="text-4xl">{achievement.icon}</span>
            </div>
          </div>

          {/* Achievement Name */}
          <h2 className="text-2xl font-bold mb-2">{achievement.name}</h2>

          {/* Achievement Description */}
          <p className="text-white/90 text-sm mb-4 leading-relaxed">{achievement.description}</p>

          {/* XP Reward */}
          {achievement.xp_reward > 0 && (
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-full px-4 py-2 inline-block">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="font-bold">+{achievement.xp_reward} XP</span>
            </div>
          )}
        </div>

        {/* Sparkle Effects */}
        <div className="absolute -top-2 -right-2 animate-ping">
          <Sparkles className={`w-5 h-5 ${rarityStyles.sparkles}`} />
        </div>
        <div className="absolute -top-1 -left-3 animate-ping" style={{ animationDelay: '0.3s' }}>
          <Star className={`w-4 h-4 ${rarityStyles.sparkles}`} />
        </div>
        <div
          className="absolute -bottom-2 -right-1 animate-ping"
          style={{ animationDelay: '0.6s' }}
        >
          <Award className={`w-4 h-4 ${rarityStyles.sparkles}`} />
        </div>
        <div className="absolute -bottom-1 -left-2 animate-ping" style={{ animationDelay: '0.9s' }}>
          <Sparkles className={`w-3 h-3 ${rarityStyles.sparkles}`} />
        </div>

        {/* Rarity Glow Animation */}
        <div
          className="absolute inset-0 rounded-3xl opacity-20 animate-pulse"
          style={{
            background: `linear-gradient(45deg, ${rarityStyles.glow}, transparent, ${rarityStyles.glow})`,
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite, pulse 2s ease-in-out infinite',
          }}
        ></div>
      </div>
    </div>
  );
};

// Achievement Progress Badge Component
interface AchievementBadgeProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  isUnlocked: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  isUnlocked,
  progress = 0,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const getRarityStyles = () => {
    if (!isUnlocked) {
      return {
        gradient: 'from-gray-600 to-gray-700',
        border: 'border-gray-500',
        text: 'text-gray-400',
      };
    }

    switch (achievement.rarity) {
      case 'legendary':
        return {
          gradient: 'from-yellow-400 to-orange-500',
          border: 'border-yellow-400',
          text: 'text-yellow-100',
        };
      case 'epic':
        return {
          gradient: 'from-purple-500 to-pink-500',
          border: 'border-purple-400',
          text: 'text-purple-100',
        };
      case 'rare':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          border: 'border-blue-400',
          text: 'text-blue-100',
        };
      default:
        return {
          gradient: 'from-green-500 to-emerald-500',
          border: 'border-green-400',
          text: 'text-green-100',
        };
    }
  };

  const rarityStyles = getRarityStyles();

  return (
    <div className="relative group">
      {/* Badge */}
      <div
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br ${rarityStyles.gradient}
          border-2 ${rarityStyles.border}
          rounded-full flex items-center justify-center
          transition-all duration-300 hover:scale-105
          ${isUnlocked ? 'shadow-lg' : 'opacity-50'}
        `}
      >
        <span className={`${rarityStyles.text}`}>{achievement.icon}</span>

        {/* Progress Ring for Unlocked Achievements */}
        {!isUnlocked && progress > 0 && (
          <div className="absolute inset-0 rounded-full">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="rgba(34, 197, 94, 0.8)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress * 2.83} 283`}
                className="transition-all duration-300"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{achievement.name}</div>
        <div className="text-xs opacity-80">{achievement.description}</div>
        {!isUnlocked && progress > 0 && (
          <div className="text-xs text-green-400 mt-1">{progress}% tamamlandı</div>
        )}

        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};
