import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  label: string;
}

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 rounded-small',
  md: 'w-9 h-9 rounded-medium',
  lg: 'w-11 h-11 rounded-medium',
};

const iconSizes: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

interface IconButtonComponentProps extends IconButtonProps {
  children: React.ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonComponentProps>(
  ({ size = 'md', label, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center text-text-secondary hover:text-text-primary',
        'bg-transparent hover:bg-white/5 active:scale-95 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-40 disabled:pointer-events-none',
        sizes[size],
        className
      )}
      {...props}
    >
      <span className={cn('flex items-center justify-center', iconSizes[size])}>
        {children}
      </span>
    </button>
  )
);

IconButton.displayName = 'IconButton';
export { IconButton };
