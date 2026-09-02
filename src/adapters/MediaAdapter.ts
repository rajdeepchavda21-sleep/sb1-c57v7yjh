/**
 * Generic media adapter interface.
 *
 * The sync engine talks to this interface. Platform-specific code
 * (YouTube, Spotify, etc.) implements it. The sync engine never
 * imports platform-specific code directly.
 */

export interface MediaAdapter {
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(position: number): Promise<void>;

  getPosition(): number;
  getDuration(): number;
  getMediaId(): string | null;

  isReady(): boolean;
  destroy(): void;
}

export interface MediaState {
  mediaId: string | null;
  playing: boolean;
  position: number;
  duration: number;
  ready: boolean;
}

export type MediaEventType = 'play' | 'pause' | 'seek' | 'media_change' | 'ready' | 'state';

export interface MediaEvent {
  type: MediaEventType;
  state: MediaState;
  timestamp: number;
}

export type MediaEventListener = (event: MediaEvent) => void;
