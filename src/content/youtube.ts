/**
 * YouTube Content Script
 *
 * Runs on youtube.com pages. Uses the YouTubeAdapter to detect and
 * control the YouTube player. Receives commands from the background
 * service worker and reports player state changes back.
 *
 * Phase 2 scope: detection + play/pause/seek control + state reporting.
 */

import { YouTubeAdapter } from '@/adapters/youtube/YouTubeAdapter';
import { isYouTubePage } from '@/adapters/youtube/youtube-utils';
import { getThumbnailUrl } from '@/adapters/youtube/youtube-utils';
import type { ExtensionMessage, PlayerCommandMessage } from '@/types/messages';

console.log('[Musync][YouTube] Content script loaded');

const adapter = new YouTubeAdapter();

function reportState(): void {
  const state = adapter.getState();
  const info = adapter.getVideoInfo();

  const message: ExtensionMessage = {
    type: 'PLAYER_STATE',
    videoId: state.mediaId,
    title: info.title,
    channel: info.channel,
    playing: state.playing,
    position: state.position,
    duration: state.duration,
    ready: state.ready,
  };

  chrome.runtime.sendMessage(message).catch(() => {
    // Background might not be ready
  });
}

function reportDetected(): void {
  const state = adapter.getState();
  const info = adapter.getVideoInfo();
  const videoId = state.mediaId;

  if (!videoId) return;

  const message: ExtensionMessage = {
    type: 'YOUTUBE_DETECTED',
    videoId,
    title: info.title,
    channel: info.channel,
  };

  chrome.runtime.sendMessage(message).catch(() => {});
}

async function init(): Promise<void> {
  if (!isYouTubePage(window.location.href)) {
    console.log('[Musync][YouTube] Not a YouTube watch page, skipping');
    return;
  }

  console.log('[Musync][YouTube] YouTube watch page detected, looking for player');
  const found = await adapter.detectPlayer();
  if (!found) {
    console.warn('[Musync][YouTube] Could not find YouTube player');
    return;
  }

  reportDetected();
  reportState();

  adapter.on((event) => {
    console.log('[Musync][YouTube] Event:', event.type);

    if (event.type === 'media_change') {
      reportDetected();
    }
    reportState();
  });
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void): boolean => {
    if (message.type === 'GET_YOUTUBE_STATE') {
      const state = adapter.getState();
      const info = adapter.getVideoInfo();
      sendResponse({
        videoId: state.mediaId,
        title: info.title,
        channel: info.channel,
        playing: state.playing,
        position: state.position,
        duration: state.duration,
        ready: state.ready,
        thumbnail: state.mediaId ? getThumbnailUrl(state.mediaId) : null,
      });
      return true;
    }

    if (message.type === 'PLAYER_COMMAND') {
      const cmd = message as PlayerCommandMessage;
      handlePlayerCommand(cmd.command, cmd.position).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        console.warn('[Musync][YouTube] Command failed:', err);
        sendResponse({ success: false, error: String(err) });
      });
      return true;
    }

    return false;
  }
);

async function handlePlayerCommand(command: string, position?: number): Promise<void> {
  switch (command) {
    case 'play':
      await adapter.play();
      break;
    case 'pause':
      await adapter.pause();
      break;
    case 'seek':
      if (position !== undefined) {
        await adapter.seek(position);
      }
      break;
    default:
      console.warn('[Musync][YouTube] Unknown command:', command);
  }
}

init().catch((err) => {
  console.error('[Musync][YouTube] Init failed:', err);
});
