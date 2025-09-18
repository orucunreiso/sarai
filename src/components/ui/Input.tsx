import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, leftIcon, rightIcon, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const baseClasses = [
      'flex w-full rounded-xl border glass px-4 py-3',
      'text-base text-foreground placeholder:text-foreground-muted',
      'transition-all duration-300 backdrop-blur-sm',
      'focus-ring focus:border-primary-solid focus:ring-2 focus:ring-primary-solid/30',
      'focus:shadow-lg focus:shadow-primary-solid/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'hover:border-border-hover hover:shadow-md',
    ];

    const stateClasses = error
      ? 'border-error-solid focus:border-error-solid focus:ring-error-solid/30 focus:shadow-error-solid/20'
      : 'border-border hover:border-border-hover';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-foreground mb-2">
            {label}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted group-focus-within:text-primary-solid transition-colors duration-300">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              baseClasses,
              stateClasses,
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className,
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-foreground-muted group-focus-within:text-primary-solid transition-colors duration-300">
              {rightIcon}
            </div>
          )}

          {/* Focus glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-solid/0 via-primary-solid/5 to-primary-solid/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {(error || helperText) && (
          <div className="mt-2">
            {error && <p className="text-sm text-error-solid font-medium">{error}</p>}
            {helperText && !error && <p className="text-sm text-foreground-muted">{helperText}</p>}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
