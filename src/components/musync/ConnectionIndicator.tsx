import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/types';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const config: Record<ConnectionStatus, { color: string; label: string }> = {
  synced: { color: 'bg-success', label: 'Synced' },
  syncing: { color: 'bg-warning', label: 'Syncing' },
  reconnecting: { color: 'bg-warning', label: 'Reconnecting' },
  disconnected: { color: 'bg-text-muted', label: 'Disconnected' },
  error: { color: 'bg-error', label: 'Error' },
};

export function ConnectionIndicator({ status, className }: ConnectionIndicatorProps) {
  const { color, label } = config[status];
  const pulse = status === 'syncing' || status === 'reconnecting';

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={`Connection: ${label}`}
    >
      <span className="relative flex">
        <span className={cn('w-2 h-2 rounded-full', color)} />
        {pulse && (
          <span
            className={cn(
              'absolute inset-0 w-2 h-2 rounded-full animate-ping',
              color,
              'opacity-60'
            )}
          />
        )}
      </span>
      <span className="text-tiny font-medium text-text-secondary">{label}</span>
    </div>
  );
}
