import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaInfo } from '@/types';

interface MediaCardProps {
  media: MediaInfo | null;
  playing: boolean;
  className?: string;
}

export function MediaCard({ media, playing, className }: MediaCardProps) {
  if (!media) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-medium bg-surface border border-border',
          className
        )}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-small bg-surface-elevated">
          <Music className="w-5 h-5 text-text-muted" />
        </div>
        <div className="flex flex-col">
          <span className="text-small font-medium text-text-secondary">No media loaded</span>
          <span className="text-tiny text-text-muted">Open a YouTube video to sync</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-medium bg-surface border border-border overflow-hidden',
        className
      )}
    >
      <div className="relative w-16 h-12 rounded-small overflow-hidden shrink-0 bg-surface-elevated">
        <img
          src={media.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {playing && (
          <div className="absolute bottom-1 right-1 flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-primary rounded-full animate-pulse-soft" style={{ height: '40%', animationDelay: '0ms' }} />
            <span className="w-0.5 bg-primary rounded-full animate-pulse-soft" style={{ height: '80%', animationDelay: '150ms' }} />
            <span className="w-0.5 bg-primary rounded-full animate-pulse-soft" style={{ height: '60%', animationDelay: '300ms' }} />
            <span className="w-0.5 bg-primary rounded-full animate-pulse-soft" style={{ height: '90%', animationDelay: '450ms' }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-text-primary truncate">{media.title}</p>
        <p className="text-tiny text-text-muted truncate mt-0.5">{media.channel}</p>
      </div>
    </div>
  );
}
