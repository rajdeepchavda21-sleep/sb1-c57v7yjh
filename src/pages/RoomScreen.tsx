import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Divider } from '@/components/ui/Divider';
import {
  RoomCode,
  MediaCard,
  PlaybackControls,
  SyncIndicator,
  ConnectionIndicator,
  ParticipantList,
} from '@/components/musync';
import type { Room, ConnectionStatus, MediaInfo } from '@/types';
import type { SyncStateData } from '@/types/messages';

function formatDriftValue(drift: number): string {
  const abs = Math.abs(drift);
  const sign = drift > 0 ? '+' : '-';
  if (abs < 1000) return `${sign}${Math.round(abs)}ms`;
  return `${sign}${(abs / 1000).toFixed(1)}s`;
}

interface RoomScreenProps {
  room: Room;
  connectionStatus: ConnectionStatus;
  onLeave: () => void;
  onCopyCode: () => void;
  playerState: {
    playing: boolean;
    position: number;
    duration: number;
    ready: boolean;
  };
  syncState: SyncStateData | null;
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  demoMedia: MediaInfo;
}

export function RoomScreen({
  room,
  connectionStatus,
  onLeave,
  onCopyCode,
  playerState,
  syncState,
  onPlayPause,
  onSeek,
  demoMedia,
}: RoomScreenProps) {
  const [devPosition, setDevPosition] = useState(0);
  const [devPlaying, setDevPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRealPlayer = playerState.ready;
  const media = room.media || demoMedia;
  const duration = isRealPlayer ? playerState.duration || media.duration : media.duration;
  const playing = isRealPlayer ? playerState.playing : devPlaying;
  const position = isRealPlayer ? playerState.position : devPosition;

  const handlePlayPause = useCallback(() => {
    if (isRealPlayer) {
      onPlayPause();
    } else {
      setDevPlaying((p) => !p);
    }
  }, [isRealPlayer, onPlayPause]);

  const handleSeek = useCallback(
    (newPos: number) => {
      const clamped = Math.min(duration, Math.max(0, newPos));
      if (isRealPlayer) {
        onSeek(clamped);
      } else {
        setDevPosition(clamped);
      }
    },
    [isRealPlayer, duration, onSeek]
  );

  const handleSkipBack = useCallback(() => {
    if (isRealPlayer) {
      onSeek(Math.max(0, position - 10));
    } else {
      setDevPosition((p) => Math.max(0, p - 10));
    }
  }, [isRealPlayer, position, onSeek]);

  const handleSkipForward = useCallback(() => {
    if (isRealPlayer) {
      onSeek(Math.min(duration, position + 10));
    } else {
      setDevPosition((p) => Math.min(duration, p + 10));
    }
  }, [isRealPlayer, position, duration, onSeek]);

  useEffect(() => {
    if (isRealPlayer) return;

    if (devPlaying) {
      intervalRef.current = setInterval(() => {
        setDevPosition((p) => {
          if (p >= duration) {
            setDevPlaying(false);
            return duration;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [devPlaying, duration, isRealPlayer]);

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <IconButton label="Back" size="sm" onClick={onLeave}>
          <ArrowLeft className="w-4 h-4" />
        </IconButton>
        <div className="flex-1 min-w-0">
          <h2 className="text-h3 font-semibold text-text-primary truncate">{room.name}</h2>
        </div>
        <ConnectionIndicator status={connectionStatus} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        <RoomCode code={room.code} onCopy={onCopyCode} />

        <SyncIndicator status={connectionStatus} />

        {syncState && (
          <div className="flex items-center justify-between px-3 py-2 rounded-medium bg-white/5 border border-border animate-scale-in">
            <div className="flex items-center gap-2">
              <span className="text-tiny text-text-muted">Sync quality</span>
            </div>
            <div className="flex items-center gap-3">
              {syncState.role === 'host' ? (
                <span className="text-tiny text-success font-medium">Host</span>
              ) : (
                <span className="text-tiny text-text-muted">Follower</span>
              )}
              <span className="text-tiny text-text-muted">
                Drift: {formatDriftValue(syncState.drift)}
              </span>
              {syncState.rtt > 0 && (
                <span className="text-tiny text-text-muted">
                  RTT: {Math.round(syncState.rtt)}ms
                </span>
              )}
            </div>
          </div>
        )}

        <MediaCard media={media} playing={playing} />

        <div className="px-1">
          <PlaybackControls
            playing={playing}
            position={position}
            duration={duration}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
          />
        </div>

        {!isRealPlayer && (
          <p className="text-tiny text-text-muted text-center px-4">
            Demo playback — open a YouTube video to sync real content
          </p>
        )}

        <Divider label="Participants" />

        <div>
          <div className="flex items-center gap-1.5 mb-2 px-2">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-tiny text-text-muted font-medium">
              {room.participants.length} {room.participants.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          <ParticipantList participants={room.participants} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border">
        <Button variant="danger" fullWidth onClick={onLeave}>
          <LogOut className="w-4 h-4" />
          Leave Room
        </Button>
      </div>
    </div>
  );
}
