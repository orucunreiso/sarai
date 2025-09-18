import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({
        message,
        type,
        isVisible: true,
      });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
