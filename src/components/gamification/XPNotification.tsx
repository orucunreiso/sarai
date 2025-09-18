'use client';

import { useState, useEffect } from 'react';
import { Star, Trophy, Zap, Target } from 'lucide-react';

export interface XPNotificationProps {
  isVisible: boolean;
  xpGained: number;
  description: string;
  leveledUp?: boolean;
  newLevel?: number;
  onComplete?: () => void;
  duration?: number;
}

export const XPNotification: React.FC<XPNotificationProps> = ({
  isVisible,
  xpGained,
  description,
  leveledUp = false,
  newLevel,
  onComplete,
  duration = 3000,
}) => {
  const [animationPhase, setAnimationPhase] = useState<
    'entering' | 'showing' | 'exiting' | 'hidden'
  >('hidden');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('entering');

      // Sequence: enter -> show -> exit
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

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'entering':
        return 'opacity-0 scale-50 translate-y-4';
      case 'showing':
        return 'opacity-100 scale-100 translate-y-0';
      case 'exiting':
        return 'opacity-0 scale-95 -translate-y-2';
      default:
        return 'opacity-0 scale-50';
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`
          ${getAnimationClasses()}
          transition-all duration-500 ease-out
          bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600
          text-white px-6 py-4 rounded-2xl shadow-2xl
          border border-purple-400/30
          backdrop-blur-sm
        `}
      >
        <div className="flex items-center gap-3">
          {/* XP Icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex flex-col">
            {/* XP Amount */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-300">+{xpGained} XP</span>
              {leveledUp && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-1 rounded-full text-xs font-bold">
                  <Trophy className="w-3 h-3" />
                  Seviye {newLevel}!
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-purple-100 opacity-90">{description}</p>
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute -top-1 -right-1">
          <Zap
            className="w-4 h-4 text-yellow-300 animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
        <div className="absolute -bottom-1 -left-1">
          <Target
            className="w-3 h-3 text-pink-300 animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
};

// XP Floating Animation Component
interface FloatingXPProps {
  xp: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export const FloatingXP: React.FC<FloatingXPProps> = ({ xp, x, y, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      <div className="animate-bounce-up-fade text-green-400 font-bold text-lg">+{xp} XP</div>
    </div>
  );
};

// Level Up Celebration Component
interface LevelUpCelebrationProps {
  isVisible: boolean;
  newLevel: number;
  onComplete?: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  isVisible,
  newLevel,
  onComplete,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in"></div>

      {/* Celebration content */}
      <div className="relative animate-scale-bounce">
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-12 py-8 rounded-3xl shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-50 animate-pulse scale-150"></div>
              <Trophy className="relative w-16 h-16 text-yellow-200 animate-bounce" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Seviye Atladın! 🎉</h2>
          <p className="text-xl mb-4">
            Artık <span className="font-bold">Seviye {newLevel}</span> 'sin!
          </p>
          <p className="text-yellow-100 text-sm opacity-90">
            Harika gidiyorsun! Çalışmaya devam et.
          </p>

          {/* Sparkle effects */}
          <div className="absolute -top-2 -left-2 animate-ping">
            <Star className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="absolute -top-1 -right-3 animate-ping" style={{ animationDelay: '0.3s' }}>
            <Star className="w-3 h-3 text-orange-300" />
          </div>
          <div
            className="absolute -bottom-2 -right-1 animate-ping"
            style={{ animationDelay: '0.6s' }}
          >
            <Star className="w-4 h-4 text-red-300" />
          </div>
          <div
            className="absolute -bottom-1 -left-3 animate-ping"
            style={{ animationDelay: '0.9s' }}
          >
            <Star className="w-3 h-3 text-yellow-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
