'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Trophy, Star, Gift } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'achievement' | 'xp' | 'level_up';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  data?: {
    xpGained?: number;
    newLevel?: number;
    achievements?: string[];
  };
}

interface NotificationToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto-close after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      case 'achievement':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'xp':
        return <Star className="w-6 h-6 text-purple-500" />;
      case 'level_up':
        return <Gift className="w-6 h-6 text-pink-500" />;
      default:
        return <Info className="w-6 h-6 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'achievement':
        return 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800';
      case 'xp':
        return 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800';
      case 'level_up':
        return 'border-pink-200 bg-gradient-to-r from-pink-50 to-coral-50 text-pink-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 min-w-[320px] max-w-[450px] p-4 rounded-2xl border-2 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${getColorClasses()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Main Content */}
      <div className="flex items-start gap-3 pr-8">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90 leading-relaxed">{notification.message}</p>

          {/* XP/Level Up Details */}
          {(notification.type === 'xp' ||
            notification.type === 'level_up' ||
            notification.type === 'achievement') &&
            notification.data && (
              <div className="mt-3 space-y-2">
                {notification.data.xpGained && (
                  <div className="flex items-center gap-2 text-xs">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">+{notification.data.xpGained} XP</span>
                  </div>
                )}

                {notification.data.newLevel && (
                  <div className="flex items-center gap-2 text-xs">
                    <Gift className="w-4 h-4" />
                    <span className="font-medium">Level {notification.data.newLevel}!</span>
                  </div>
                )}

                {notification.data.achievements && notification.data.achievements.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-4 h-4" />
                    <span className="font-medium">
                      {notification.data.achievements.length} yeni başarı!
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${
                      action.variant === 'primary'
                        ? 'bg-white/80 hover:bg-white text-current border border-current/20'
                        : 'text-current/70 hover:text-current hover:bg-white/20'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ notifications, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index,
          }}
        >
          <NotificationToast notification={notification} onClose={onRemove} />
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    setNotifications((prev) => [...prev, newNotification]);

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  const showAchievement = (
    title: string,
    message: string,
    achievements?: string[],
    duration?: number,
  ) => {
    return addNotification({
      type: 'achievement',
      title,
      message,
      duration,
      data: { achievements },
    });
  };

  const showXP = (title: string, message: string, xpGained: number, duration?: number) => {
    return addNotification({
      type: 'xp',
      title,
      message,
      duration,
      data: { xpGained },
    });
  };

  const showLevelUp = (
    title: string,
    message: string,
    newLevel: number,
    xpGained?: number,
    duration?: number,
  ) => {
    return addNotification({
      type: 'level_up',
      title,
      message,
      duration,
      data: { newLevel, xpGained },
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showAchievement,
    showXP,
    showLevelUp,
  };
}
