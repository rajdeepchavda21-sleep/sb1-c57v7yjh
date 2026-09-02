/**
 * YouTube Media Adapter
 *
 * Implements the generic MediaAdapter interface by communicating
 * with YouTube's embedded player on the page. All YouTube-specific
 * code lives here -- the sync engine never touches YouTube APIs directly.
 *
 * Architecture:
 *   Sync Engine -> MediaAdapter (interface) -> YouTubeAdapter -> YouTube Player
 *
 * This adapter runs in the content script context. It finds the YouTube
 * player element and calls its methods via the YT API.
 */

import type {
  MediaAdapter,
  MediaState,
  MediaEvent,
  MediaEventListener,
} from '../MediaAdapter';
import { extractVideoId } from './youtube-utils';

type YTPlayerState = number;

const YT_STATE: Record<number, string> = {
  [-1]: 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'cued',
};

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): YTPlayerState;
  getVideoData(): { video_id: string; title: string; author: string };
  addEventListener(event: string, listener: (event: { data: number }) => void): void;
}

const POLL_INTERVAL_MS = 1000;
const PLAYER_READY_TIMEOUT_MS = 10000;

export class YouTubeAdapter implements MediaAdapter {
  private player: YTPlayer | null = null;
  private listeners: Set<MediaEventListener> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastVideoId: string | null = null;
  private lastPlaying: boolean = false;
  private ready: boolean = false;

  on(listener: MediaEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(type: MediaEvent['type']): void {
    const state = this.getState();
    const event: MediaEvent = {
      type,
      state,
      timestamp: Date.now(),
    };
    this.listeners.forEach((l) => l(event));
  }

  /**
   * Attempts to locate the YouTube player on the page.
   * YouTube loads asynchronously, so we poll until it's available.
   */
  async detectPlayer(): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const tryDetect = () => {
        const player = this.findPlayer();
        if (player) {
          this.player = player;
          this.ready = true;
          this.setupEventListeners();
          this.startPolling();
          console.log('[Musync][YouTube] Player detected');
          this.emit('ready');
          resolve(true);
          return;
        }

        if (Date.now() - startTime > PLAYER_READY_TIMEOUT_MS) {
          console.warn('[Musync][YouTube] Player detection timed out');
          resolve(false);
          return;
        }

        setTimeout(tryDetect, 500);
      };
      tryDetect();
    });
  }

  private findPlayer(): YTPlayer | null {
    // Try the standard YouTube watch page player
    const el = document.querySelector('#movie_player') as unknown as YTPlayer | null;
    if (el && typeof el.playVideo === 'function') {
      return el;
    }

    // Try embedded iframe API player
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="youtube.com/embed/"]'
    );
    if (iframe && iframe.contentWindow) {
      // Embedded players need the postMessage API -- not supported in V1
      return null;
    }

    return null;
  }

  private setupEventListeners(): void {
    if (!this.player) return;

    try {
      this.player.addEventListener('onStateChange', (event: { data: number }) => {
        const stateName = YT_STATE[event.data] || 'unknown';
        console.log('[Musync][YouTube] Player state:', stateName);

        if (event.data === 1) {
          // playing
          if (!this.lastPlaying) {
            this.lastPlaying = true;
            this.emit('play');
          }
        } else if (event.data === 2) {
          // paused
          if (this.lastPlaying) {
            this.lastPlaying = false;
            this.emit('pause');
          }
        } else if (event.data === 0) {
          // ended
          this.lastPlaying = false;
          this.emit('pause');
        }

        this.checkVideoChange();
      });
    } catch (e) {
      console.warn('[Musync][YouTube] Failed to add event listener:', e);
    }
  }

  private checkVideoChange(): void {
    if (!this.player) return;
    try {
      const videoData = this.player.getVideoData();
      const videoId = videoData?.video_id || extractVideoId(window.location.href);
      if (videoId && videoId !== this.lastVideoId) {
        this.lastVideoId = videoId;
        this.emit('media_change');
      }
    } catch {
      // Player might not be ready
    }
  }

  private startPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.checkVideoChange();
      // Emit periodic state for drift detection (used by sync engine later)
      this.emit('state');
    }, POLL_INTERVAL_MS);
  }

  async play(): Promise<void> {
    if (!this.player) throw new Error('Player not ready');
    this.player.playVideo();
  }

  async pause(): Promise<void> {
    if (!this.player) throw new Error('Player not ready');
    this.player.pauseVideo();
  }

  async seek(position: number): Promise<void> {
    if (!this.player) throw new Error('Player not ready');
    this.player.seekTo(position, true);
  }

  getPosition(): number {
    if (!this.player) return 0;
    try {
      return this.player.getCurrentTime() || 0;
    } catch {
      return 0;
    }
  }

  getDuration(): number {
    if (!this.player) return 0;
    try {
      return this.player.getDuration() || 0;
    } catch {
      return 0;
    }
  }

  getMediaId(): string | null {
    if (!this.player) return extractVideoId(window.location.href);
    try {
      const data = this.player.getVideoData();
      return data?.video_id || extractVideoId(window.location.href);
    } catch {
      return extractVideoId(window.location.href);
    }
  }

  getVideoInfo(): { title: string; channel: string } {
    if (!this.player) return { title: '', channel: '' };
    try {
      const data = this.player.getVideoData();
      return {
        title: data?.title || document.title.replace(' - YouTube', ''),
        channel: data?.author || '',
      };
    } catch {
      return { title: '', channel: '' };
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  getState(): MediaState {
    const state = this.player?.getPlayerState();
    const playing = state === 1;
    return {
      mediaId: this.getMediaId(),
      playing,
      position: this.getPosition(),
      duration: this.getDuration(),
      ready: this.ready,
    };
  }

  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    this.player = null;
    this.ready = false;
  }
}
