import { useEffect, useState, useCallback } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastData {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <Check className="w-4 h-4 text-success" />,
  error: <AlertCircle className="w-4 h-4 text-error" />,
  info: <Info className="w-4 h-4 text-info" />,
};

const borders = {
  success: 'border-success/20',
  error: 'border-error/20',
  info: 'border-info/20',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 3000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-medium bg-surface-elevated border shadow-elevated',
        'animate-toast-in',
        leaving && 'animate-toast-out',
        borders[toast.variant]
      )}
      role="status"
      aria-live="polite"
    >
      {icons[toast.variant]}
      <span className="text-small text-text-primary flex-1">{toast.message}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)]">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
