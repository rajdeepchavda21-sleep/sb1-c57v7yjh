import { Check, RefreshCw, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/types';

interface SyncIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const config: Record<
  ConnectionStatus,
  { icon: React.ReactNode; label: string; description: string; color: string; bg: string }
> = {
  synced: {
    icon: <Check className="w-3.5 h-3.5" />,
    label: 'Synced',
    description: 'Playback is in sync',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  syncing: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Syncing',
    description: 'Aligning playback',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  reconnecting: {
    icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
    label: 'Reconnecting',
    description: 'Restoring connection',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  disconnected: {
    icon: <WifiOff className="w-3.5 h-3.5" />,
    label: 'Disconnected',
    description: 'Not connected to room',
    color: 'text-text-muted',
    bg: 'bg-white/5',
  },
  error: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: 'Error',
    description: 'Sync connection failed',
    color: 'text-error',
    bg: 'bg-error/10',
  },
};

export function SyncIndicator({ status, className }: SyncIndicatorProps) {
  const { icon, label, description, color, bg } = config[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-2 rounded-medium border border-border',
        'animate-scale-in',
        className
      )}
      role="status"
      aria-label={`Sync: ${label}. ${description}`}
    >
      <span
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full shrink-0',
          bg,
          color
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col">
        <span className={cn('text-small font-medium leading-tight', color)}>{label}</span>
        <span className="text-tiny text-text-muted leading-tight">{description}</span>
      </div>
    </div>
  );
}
