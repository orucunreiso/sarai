import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'glow' | 'float';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      interactive = false,
      ...props
    },
    ref,
  ) => {
    const baseClasses = [
      'rounded-2xl transition-all duration-300 relative overflow-hidden group',
      'border border-border backdrop-blur-sm',
    ];

    const variantClasses = {
      default: [
        'glass shadow-card hover:shadow-card-hover',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100',
      ],
      glass: ['glass-strong shadow-card hover:shadow-card-hover', 'border-border-hover'],
      gradient: [
        'bg-gradient-primary border-transparent shadow-card hover:shadow-card-hover',
        'before:absolute before:inset-0 before:bg-gradient-secondary before:opacity-0 before:transition-opacity before:duration-500',
        'hover:before:opacity-30',
      ],
      glow: ['glass shadow-card hover:shadow-card-hover glow-primary', 'hover:animate-glow-pulse'],
      float: [
        'glass shadow-card hover:shadow-card-hover animate-float',
        'hover:animate-none hover:transform hover:scale-105',
      ],
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const interactiveClasses =
      hover || interactive
        ? [
            'cursor-pointer hover:scale-[1.02] hover:-translate-y-1',
            'transform transition-transform duration-300',
            'hover:shadow-card-hover',
          ]
        : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          interactiveClasses,
          className,
        )}
        {...props}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        <div className="relative z-10">{props.children}</div>
      </div>
    );
  },
);

Card.displayName = 'Card';

// Card sub-components
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pb-6 border-b border-border/50 mb-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-bold text-foreground tracking-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-foreground-muted mt-3 leading-relaxed', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-6 border-t border-border/50 mt-4 flex items-center', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps };
