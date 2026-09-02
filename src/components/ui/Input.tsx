import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full h-10 bg-surface border rounded-medium text-text-primary text-body',
          'placeholder:text-text-muted transition-colors duration-150',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          icon ? 'pl-10 pr-3' : 'px-3',
          error ? 'border-error/50' : 'border-border',
          className
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = 'Input';
export { Input };
