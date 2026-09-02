/**
 * RemoteMediaAdapter — a MediaAdapter that proxies commands
 * to a content script via Chrome's tab messaging.
 *
 * The SyncEngine talks to this as if it were a local adapter,
 * but every play/pause/seek call is forwarded to the active tab's
 * content script. State (position, duration, etc.) is updated
 * via PLAYER_STATE messages from the content script.
 */

import type { MediaAdapter, MediaEvent, MediaEventListener } from '@/adapters/MediaAdapter';

export class RemoteMediaAdapter implements MediaAdapter {
  private listeners: Set<MediaEventListener> = new Set();
  private currentMediaId: string | null = null;
  private currentPlaying = false;
  private currentPosition = 0;
  private currentDuration = 0;
  private ready = false;

  on(listener: MediaEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(type: MediaEvent['type']): void {
    const event: MediaEvent = {
      type,
      state: {
        mediaId: this.currentMediaId,
        playing: this.currentPlaying,
        position: this.currentPosition,
        duration: this.currentDuration,
        ready: this.ready,
      },
      timestamp: Date.now(),
    };
    this.listeners.forEach((l) => l(event));
  }

  updateState(
    mediaId: string | null,
    playing: boolean,
    position: number,
    duration: number,
    ready: boolean
  ): void {
    const wasPlaying = this.currentPlaying;
    const oldMediaId = this.currentMediaId;

    this.currentMediaId = mediaId;
    this.currentPlaying = playing;
    this.currentPosition = position;
    this.currentDuration = duration;
    this.ready = ready;

    if (mediaId !== oldMediaId && mediaId) {
      this.emit('media_change');
    }
    if (playing !== wasPlaying) {
      this.emit(playing ? 'play' : 'pause');
    }
    this.emit('state');
  }

  async play(): Promise<void> {
    this.sendToContent('play');
    this.currentPlaying = true;
    this.emit('play');
  }

  async pause(): Promise<void> {
    this.sendToContent('pause');
    this.currentPlaying = false;
    this.emit('pause');
  }

  async seek(position: number): Promise<void> {
    this.sendToContent('seek', position);
    this.currentPosition = position;
    this.emit('seek');
  }

  private sendToContent(command: string, position?: number): void {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, {
        type: 'PLAYER_COMMAND',
        command,
        position,
      }).catch(() => {});
    });
  }

  getPosition(): number {
    return this.currentPosition;
  }

  getDuration(): number {
    return this.currentDuration;
  }

  getMediaId(): string | null {
    return this.currentMediaId;
  }

  isReady(): boolean {
    return this.ready;
  }

  destroy(): void {
    this.listeners.clear();
  }
}
