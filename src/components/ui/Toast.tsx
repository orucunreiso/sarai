import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Check className="w-5 h-5 text-green-500" />;
    }
  };

  const getStyles = () => {
    const base = 'border shadow-lg backdrop-blur-sm';
    switch (type) {
      case 'success':
        return `${base} bg-green-50/90 border-green-200 text-green-800`;
      case 'error':
        return `${base} bg-red-50/90 border-red-200 text-red-800`;
      case 'warning':
        return `${base} bg-yellow-50/90 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${base} bg-blue-50/90 border-blue-200 text-blue-800`;
      default:
        return `${base} bg-green-50/90 border-green-200 text-green-800`;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95',
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg', getStyles())}>
        {getIcon()}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 text-current/60 hover:text-current transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export { Toast };
export type { ToastProps };
