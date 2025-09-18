'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modern Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-all duration-500"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modern Modal */}
      <div
        className={cn(
          'relative glass-strong border border-border-hover rounded-3xl shadow-xl mx-4 w-full',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500',
          'before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none',
          'overflow-hidden group',
          sizeClasses[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10">
          {/* Modern Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-8 border-b border-border/30">
              <div>
                {title && (
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">{title}</h2>
                )}
                {description && (
                  <p className="text-foreground-muted mt-2 text-lg leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-12 w-12 p-0 rounded-full hover:bg-surface-hover shrink-0"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Kapat</span>
                </Button>
              )}
            </div>
          )}

          {/* Modern Content */}
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Modern Modal sub-components for flexible usage
const ModalHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-8 border-b border-border/30', className)} {...props}>
    {children}
  </div>
);

const ModalTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-3xl font-bold text-foreground tracking-tight', className)} {...props}>
    {children}
  </h2>
);

const ModalDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-foreground-muted mt-2 text-lg leading-relaxed', className)} {...props}>
    {children}
  </p>
);

const ModalContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-8', className)} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('p-8 border-t border-border/30 flex items-center justify-end gap-4', className)}
    {...props}
  >
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };
export type { ModalProps };
