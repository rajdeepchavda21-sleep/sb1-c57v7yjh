import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indeterminate?: boolean;
}

export function Progress({ value, max = 100, className, indeterminate }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn('h-1 bg-surface rounded-pill overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemax={max}
    >
      {indeterminate ? (
        <div className="h-full w-1/3 bg-primary rounded-pill animate-pulse-soft" />
      ) : (
        <div
          className="h-full bg-primary rounded-pill transition-all duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      )}
    </div>
  );
}
