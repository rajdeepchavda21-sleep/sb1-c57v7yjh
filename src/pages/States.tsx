import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to connect',
  message = 'Check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-error/10 mb-4">
        <AlertCircle className="w-7 h-7 text-error" />
      </div>
      <h3 className="text-h3 font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-small text-text-secondary mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No room yet',
  message = 'Create a room to start syncing.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in">
      <h3 className="text-h3 font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-small text-text-secondary mb-6">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
