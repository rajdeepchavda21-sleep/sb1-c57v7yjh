import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ elevated, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-large border',
        elevated ? 'bg-surface-elevated border-border shadow-elevated' : 'bg-surface border-border',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
