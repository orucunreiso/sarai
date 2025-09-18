import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'gradient' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      glow = false,
      ...props
    },
    ref,
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium transition-all duration-300',
      'focus-ring rounded-xl border relative overflow-hidden group',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
      'active:scale-[0.98] transform hover:scale-[1.02]',
      'backdrop-blur-sm',
    ];

    const variantClasses = {
      primary: [
        'bg-primary-solid text-white shadow-button hover:shadow-button-hover',
        'border-primary-solid hover:bg-primary-hover',
        'focus:ring-2 focus:ring-primary-solid/30',
      ],
      secondary: [
        'glass text-foreground shadow-card hover:shadow-card-hover',
        'border-border hover:bg-surface-hover hover:border-border-hover',
        'focus:ring-2 focus:ring-secondary-solid/30',
      ],
      accent: [
        'bg-accent-solid text-white shadow-button hover:shadow-button-hover',
        'border-accent-solid hover:bg-accent-hover',
        'focus:ring-2 focus:ring-accent-solid/30',
      ],
      ghost: [
        'bg-transparent text-foreground hover:bg-surface',
        'border-transparent hover:border-border',
        'focus:ring-2 focus:ring-neutral-500/30',
      ],
      outline: [
        'bg-transparent text-foreground hover:bg-surface',
        'border-border hover:border-border-hover',
        'focus:ring-2 focus:ring-primary-solid/30',
      ],
      gradient: [
        'bg-gradient-primary text-white shadow-button hover:shadow-button-hover',
        'border-transparent animate-gradient',
        'focus:ring-2 focus:ring-primary-solid/30',
        'before:absolute before:inset-0 before:bg-gradient-primary before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-20',
      ],
      glow: [
        'bg-gradient-primary text-white shadow-button hover:shadow-button-hover',
        'border-transparent glow-primary hover:animate-glow-pulse',
        'focus:ring-2 focus:ring-primary-solid/30',
      ],
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm gap-2 rounded-lg',
      md: 'px-6 py-3 text-base gap-2.5 rounded-xl',
      lg: 'px-8 py-4 text-lg gap-3 rounded-xl',
      xl: 'px-10 py-5 text-xl gap-3.5 rounded-2xl',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      loading && 'cursor-wait',
      glow && 'glow-primary',
      className,
    );

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {/* Background gradient overlay for interactive states */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />

        {loading ? (
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-5 h-5 relative">
              <div className="absolute inset-0 border-2 border-current/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
            {children}
          </div>
        ) : (
          <div className="flex items-center relative z-10">
            {leftIcon && (
              <span className="shrink-0 transition-transform group-hover:scale-110">
                {leftIcon}
              </span>
            )}
            <span className="transition-all group-hover:tracking-wider">{children}</span>
            {rightIcon && (
              <span className="shrink-0 transition-transform group-hover:scale-110">
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
