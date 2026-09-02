import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-tiny',
  md: 'w-9 h-9 text-small',
  lg: 'w-12 h-12 text-body',
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed[0].toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-success/20 text-success',
    'bg-info/20 text-info',
    'bg-warning/20 text-warning',
    'bg-error/20 text-error',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold shrink-0',
        sizes[size],
        getColorFromName(name),
        className
      )}
      aria-hidden="true"
    >
      {getInitial(name)}
    </div>
  );
}
