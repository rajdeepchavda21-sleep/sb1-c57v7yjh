import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { HostBadge } from './HostBadge';
import type { ConnectionStatus } from '@/types';

interface ParticipantAvatarProps {
  name: string;
  isHost: boolean;
  status: ConnectionStatus;
  size?: 'sm' | 'md' | 'lg';
  showHostBadge?: boolean;
  className?: string;
}

const statusColors: Record<ConnectionStatus, string> = {
  synced: 'bg-success',
  syncing: 'bg-warning',
  reconnecting: 'bg-warning',
  disconnected: 'bg-text-muted',
  error: 'bg-error',
};

export function ParticipantAvatar({
  name,
  isHost,
  status,
  size = 'md',
  showHostBadge = false,
  className,
}: ParticipantAvatarProps) {
  const dotSize = size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <div className={cn('relative', className)}>
      <Avatar name={name} size={size} />
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
          dotSize,
          statusColors[status]
        )}
        aria-label={`Status: ${status}`}
      />
      {isHost && showHostBadge && (
        <span className="absolute -top-2 -right-2">
          <HostBadge />
        </span>
      )}
    </div>
  );
}
