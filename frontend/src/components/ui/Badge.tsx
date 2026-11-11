import { cn } from '@/utils';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-destructive text-white': variant === 'destructive',
          'border border-border text-foreground': variant === 'outline',
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
        },
        className
      )}
      {...props}
    />
  );
}
