import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}

interface ConfirmationToastProps {
  options: ConfirmationOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationToast: React.FC<ConfirmationToastProps> = ({
  options,
  onConfirm,
  onCancel,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(onConfirm, 200);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 200);
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white shadow-2xl rounded-lg";
    
    switch (options.type) {
      case 'danger':
        return `${baseStyles} border-red-500`;
      case 'warning':
      default:
        return `${baseStyles} border-yellow-500`;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div 
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className={`${getStyles()} p-6 max-w-md w-full min-w-[350px]`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className={`w-6 h-6 ${
                options.type === 'danger' ? 'text-red-500' : 'text-yellow-500'
              }`} />
            </div>
            
            <div className="ml-4 w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {options.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {options.message}
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {options.cancelText || 'İptal'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    options.type === 'danger'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {options.confirmText || 'Onayla'}
                </button>
              </div>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationToast;
