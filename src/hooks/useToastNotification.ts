import { useState, useCallback } from 'react';
import { Toast } from '@/components/ui/ToastNotification';
import { ConfirmationOptions } from '@/components/ui/ConfirmationToast';

export const useToastNotification = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<{
    options: ConfirmationOptions;
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({ options, resolve });
    });
  }, []);

  const handleConfirmationResult = useCallback((confirmed: boolean) => {
    if (confirmation) {
      confirmation.resolve(confirmed);
      setConfirmation(null);
    }
  }, [confirmation]);

  return {
    toasts,
    confirmation,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
    showConfirmation,
    handleConfirmationResult,
  };
};

export default useToastNotification;
