import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomCodeProps {
  code: string;
  className?: string;
  onCopy?: () => void;
}

export function RoomCode({ code, className, onCopy }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 flex items-center justify-center gap-1.5 h-12 bg-surface border border-border rounded-medium">
        <span className="text-h2 font-bold tracking-[0.2em] gradient-primary-text">
          {code}
        </span>
      </div>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Room code copied' : 'Copy room code'}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-medium border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          copied
            ? 'bg-success/10 border-success/20 text-success'
            : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
        )}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
