import { useState, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';

interface PlaybackControlsProps {
  playing: boolean;
  position: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  className?: string;
}

export function PlaybackControls({
  playing,
  position,
  duration,
  onPlayPause,
  onSeek,
  onSkipBack,
  onSkipForward,
  className,
}: PlaybackControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!barRef.current || duration === 0) return;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);

      const rect = barRef.current.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setDragPosition(pct * duration);
    },
    [duration]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !barRef.current || duration === 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setDragPosition(pct * duration);
    },
    [isDragging, duration]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      const rect = barRef.current?.getBoundingClientRect();
      if (rect && duration > 0) {
        const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        onSeek(pct * duration);
      }
    },
    [isDragging, duration, onSeek]
  );

  const displayPosition = isDragging ? dragPosition : position;
  const progressPct = duration > 0 ? (displayPosition / duration) * 100 : 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onSkipBack}
          aria-label="Skip back 10 seconds"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          aria-label={playing ? 'Pause' : 'Play'}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full text-white transition-all active:scale-90',
            'bg-primary hover:bg-primary-hover shadow-glow hover:shadow-glow-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          onClick={onSkipForward}
          aria-label="Skip forward 10 seconds"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-tiny text-text-muted tabular-nums w-8 text-right">
          {formatTime(displayPosition)}
        </span>
        <div
          ref={barRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex-1 h-1.5 bg-surface rounded-pill cursor-pointer relative group"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={displayPosition}
        >
          <div
            className="h-full bg-primary rounded-pill pointer-events-none transition-all"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-subtle pointer-events-none transition-opacity',
              isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'
            )}
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
        </div>
        <span className="text-tiny text-text-muted tabular-nums w-8">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
