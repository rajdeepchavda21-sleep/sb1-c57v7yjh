import { cn } from '@/lib/utils';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Toggle<T extends string>({ options, value, onChange, className }: ToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex p-1 bg-surface border border-border rounded-medium',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-small text-small font-medium transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value === option.value
              ? 'bg-primary text-white shadow-glow'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
