'use client';

import { useState, useEffect } from 'react';
import { Gift, Star, Sparkles, Trophy, Clock, Flame, Shield, Plus } from 'lucide-react';

export interface SurpriseBoxProps {
  box: {
    id: string;
    box_type: 'daily' | 'weekly' | 'achievement' | 'milestone' | 'special';
    earned_at: string;
    is_opened: boolean;
  };
  onOpen?: (boxId: string) => void;
  disabled?: boolean;
}

export const SurpriseBox: React.FC<SurpriseBoxProps> = ({ box, onOpen, disabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const getBoxStyles = () => {
    switch (box.box_type) {
      case 'daily':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          glow: 'rgba(59, 130, 246, 0.6)',
          sparkles: 'text-blue-300',
        };
      case 'weekly':
        return {
          gradient: 'from-green-500 to-emerald-500',
          glow: 'rgba(34, 197, 94, 0.6)',
          sparkles: 'text-green-300',
        };
      case 'achievement':
        return {
          gradient: 'from-purple-500 to-pink-500',
          glow: 'rgba(168, 85, 247, 0.6)',
          sparkles: 'text-purple-300',
        };
      case 'milestone':
        return {
          gradient: 'from-orange-500 to-red-500',
          glow: 'rgba(249, 115, 22, 0.6)',
          sparkles: 'text-orange-300',
        };
      case 'special':
        return {
          gradient: 'from-yellow-400 to-orange-500',
          glow: 'rgba(250, 204, 21, 0.8)',
          sparkles: 'text-yellow-300',
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          glow: 'rgba(107, 114, 128, 0.6)',
          sparkles: 'text-gray-300',
        };
    }
  };

  const getBoxName = () => {
    switch (box.box_type) {
      case 'daily':
        return 'Günlük Kutu';
      case 'weekly':
        return 'Haftalık Kutu';
      case 'achievement':
        return 'Başarı Kutusu';
      case 'milestone':
        return 'Milestone Kutu';
      case 'special':
        return 'Özel Kutu';
      default:
        return 'Sürpriz Kutu';
    }
  };

  const handleClick = async () => {
    if (disabled || box.is_opened) return;

    setIsOpening(true);
    await onOpen?.(box.id);
    setIsOpening(false);
  };

  const styles = getBoxStyles();

  if (box.is_opened) {
    return (
      <div className="relative group">
        <div className="w-24 h-24 bg-gray-700 border-2 border-gray-600 rounded-2xl flex items-center justify-center opacity-50">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
          Açılmış
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Box */}
      <div
        className={`
          w-24 h-24 bg-gradient-to-br ${styles.gradient}
          border-2 border-white/30 rounded-2xl
          flex items-center justify-center
          transition-all duration-300
          ${isHovered ? 'scale-110 rotate-3' : ''}
          ${isOpening ? 'animate-bounce' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'}
        `}
        style={{
          boxShadow: isHovered ? `0 0 30px ${styles.glow}` : `0 0 15px ${styles.glow}`,
        }}
      >
        <Gift className="w-10 h-10 text-white" />

        {/* Opening Animation */}
        {isOpening && <div className="absolute inset-0 rounded-2xl animate-ping bg-white/20"></div>}

        {/* Sparkle Effects */}
        <div className={`absolute -top-1 -right-1 ${isHovered ? 'animate-spin' : 'animate-pulse'}`}>
          <Star className={`w-4 h-4 ${styles.sparkles}`} />
        </div>
        <div
          className={`absolute -bottom-1 -left-1 ${isHovered ? 'animate-bounce' : 'animate-pulse'}`}
          style={{ animationDelay: '0.3s' }}
        >
          <Sparkles className={`w-3 h-3 ${styles.sparkles}`} />
        </div>
        <div
          className={`absolute -top-0 -left-2 ${isHovered ? 'animate-ping' : 'animate-pulse'}`}
          style={{ animationDelay: '0.6s' }}
        >
          <Star className={`w-3 h-3 ${styles.sparkles}`} />
        </div>
      </div>

      {/* Box Name */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 whitespace-nowrap font-medium">
        {getBoxName()}
      </div>

      {/* Hover Tooltip */}
      {isHovered && !disabled && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 pointer-events-none">
          Açmak için tıkla!
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Surprise Box Opening Animation Component
export interface SurpriseBoxOpeningProps {
  isVisible: boolean;
  reward: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    type: string;
    value: number;
  };
  onComplete?: () => void;
}

export const SurpriseBoxOpening: React.FC<SurpriseBoxOpeningProps> = ({
  isVisible,
  reward,
  onComplete,
}) => {
  const [animationPhase, setAnimationPhase] = useState<
    'opening' | 'revealing' | 'showing' | 'exiting'
  >('opening');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('opening');

      const revealTimer = setTimeout(() => setAnimationPhase('revealing'), 1000);
      const showTimer = setTimeout(() => setAnimationPhase('showing'), 1500);
      const exitTimer = setTimeout(() => setAnimationPhase('exiting'), 4500);
      const completeTimer = setTimeout(() => onComplete?.(), 5000);

      return () => {
        clearTimeout(revealTimer);
        clearTimeout(showTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getRarityStyles = () => {
    switch (reward.rarity) {
      case 'legendary':
        return {
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          glow: 'rgba(250, 204, 21, 0.8)',
          particles: 'text-yellow-300',
        };
      case 'epic':
        return {
          gradient: 'from-purple-500 via-pink-500 to-purple-600',
          glow: 'rgba(168, 85, 247, 0.8)',
          particles: 'text-purple-300',
        };
      case 'rare':
        return {
          gradient: 'from-blue-500 via-cyan-500 to-blue-600',
          glow: 'rgba(59, 130, 246, 0.8)',
          particles: 'text-blue-300',
        };
      default:
        return {
          gradient: 'from-green-500 via-emerald-500 to-green-600',
          glow: 'rgba(34, 197, 94, 0.8)',
          particles: 'text-green-300',
        };
    }
  };

  const styles = getRarityStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative">
        {/* Opening Box Animation */}
        {animationPhase === 'opening' && (
          <div className="animate-bounce">
            <div
              className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl border-4 border-yellow-400 flex items-center justify-center"
              style={{ boxShadow: `0 0 40px rgba(245, 158, 11, 0.8)` }}
            >
              <Gift className="w-16 h-16 text-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Box Opening Effect */}
        {animationPhase === 'revealing' && (
          <div className="relative">
            <div className="animate-ping w-32 h-32 bg-white rounded-full opacity-75"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-20 h-20 bg-gradient-to-br ${styles.gradient} rounded-full animate-scale-bounce flex items-center justify-center`}
                style={{ boxShadow: `0 0 60px ${styles.glow}` }}
              >
                <span className="text-4xl animate-bounce">{reward.icon}</span>
              </div>
            </div>

            {/* Particle Effects */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 ${styles.particles} animate-ping`}
                style={{
                  top: `${50 + 40 * Math.cos((i * Math.PI) / 6)}%`,
                  left: `${50 + 40 * Math.sin((i * Math.PI) / 6)}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>
        )}

        {/* Reward Display */}
        {(animationPhase === 'showing' || animationPhase === 'exiting') && (
          <div
            className={`
              ${animationPhase === 'showing' ? 'animate-zoom-in opacity-100' : 'animate-fade-out opacity-0'}
              bg-gradient-to-br ${styles.gradient}
              text-white p-8 rounded-3xl shadow-2xl
              border-2 border-white/30 max-w-md mx-auto text-center
            `}
            style={{ boxShadow: `0 0 50px ${styles.glow}` }}
          >
            {/* Reward Icon */}
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-75 animate-pulse"
                style={{ background: styles.glow }}
              ></div>
              <div className="relative bg-white/20 rounded-full p-6 inline-block">
                <span className="text-6xl">{reward.icon}</span>
              </div>
            </div>

            {/* Reward Info */}
            <div className="mb-4">
              <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-2">
                {reward.rarity === 'legendary' && '🏆 Efsanevi'}
                {reward.rarity === 'epic' && '💜 Epik'}
                {reward.rarity === 'rare' && '💎 Nadir'}
                {reward.rarity === 'common' && '⭐ Ortak'}
              </div>
              <h2 className="text-3xl font-bold mb-3">{reward.name}</h2>
              <p className="text-white/90 text-lg">{reward.description}</p>
            </div>

            {/* Value Display */}
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-full px-6 py-3 inline-block">
              {reward.type === 'xp' && <Star className="w-5 h-5 text-yellow-300" />}
              {reward.type === 'double_xp' && <Flame className="w-5 h-5 text-orange-300" />}
              {reward.type === 'streak_freeze' && <Shield className="w-5 h-5 text-blue-300" />}
              {reward.type === 'bonus_questions' && <Plus className="w-5 h-5 text-green-300" />}
              <span className="font-bold text-lg">
                {reward.type === 'double_xp' ? `${reward.value}x XP` : `+${reward.value}`}
                {reward.type === 'xp' && ' XP'}
                {reward.type === 'bonus_questions' && ' Soru'}
                {reward.type === 'streak_freeze' && ' Gün Koruma'}
              </span>
            </div>

            {/* Celebration Effects */}
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Trophy className={`w-6 h-6 ${styles.particles}`} />
            </div>
            <div
              className="absolute -top-1 -left-3 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            >
              <Star className={`w-5 h-5 ${styles.particles}`} />
            </div>
            <div
              className="absolute -bottom-2 -right-1 animate-bounce"
              style={{ animationDelay: '0.6s' }}
            >
              <Sparkles className={`w-5 h-5 ${styles.particles}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Surprise Box Collection Component
export interface SurpriseBoxCollectionProps {
  boxes: Array<{
    id: string;
    box_type: 'daily' | 'weekly' | 'achievement' | 'milestone' | 'special';
    earned_at: string;
    is_opened: boolean;
  }>;
  onOpenBox?: (boxId: string) => void;
  loading?: boolean;
}

export const SurpriseBoxCollection: React.FC<SurpriseBoxCollectionProps> = ({
  boxes,
  onOpenBox,
  loading = false,
}) => {
  const unopenedBoxes = boxes.filter((box) => !box.is_opened);
  const openedBoxes = boxes.filter((box) => box.is_opened);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Unopened Boxes */}
      {unopenedBoxes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            Açılmayı Bekleyen Kutular ({unopenedBoxes.length})
          </h3>
          <div className="flex flex-wrap gap-6">
            {unopenedBoxes.map((box) => (
              <SurpriseBox key={box.id} box={box} onOpen={onOpenBox} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Opened Boxes */}
      {openedBoxes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Son Açılan Kutular ({openedBoxes.length})
          </h3>
          <div className="flex flex-wrap gap-6">
            {openedBoxes.slice(0, 10).map((box) => (
              <SurpriseBox key={box.id} box={box} disabled={true} />
            ))}
          </div>
        </div>
      )}

      {/* No Boxes Message */}
      {boxes.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Henüz sürpriz kutun yok</h3>
          <p className="text-gray-500">
            Sorular çözerek ve başarıları tamamlayarak sürpriz kutular kazan!
          </p>
        </div>
      )}
    </div>
  );
};
