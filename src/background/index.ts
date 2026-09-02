import { generateRoomCode } from '@/lib/utils';
import { getThumbnailUrl } from '@/adapters/youtube/youtube-utils';
import { RemoteMediaAdapter } from '@/adapters/RemoteMediaAdapter';
import { SyncEngine, LocalTransport } from '@/sync';

console.log('[Musync][Background] Service worker initialized');

import type {
  ExtensionState,
  ExtensionMessage,
  ParticipantData,
  PlayerCommandMessage,
} from '@/types/messages';

const state: ExtensionState = {
  screen: 'welcome',
  room: null,
  connectionStatus: 'disconnected',
  youtube: null,
  sync: null,
};

let remoteAdapter: RemoteMediaAdapter | null = null;
let transport: LocalTransport | null = null;
let syncEngine: SyncEngine | null = null;

function createDemoParticipants(isHost: boolean): ParticipantData[] {
  const me: ParticipantData = {
    id: 'me',
    name: 'You',
    isHost,
    status: 'synced',
  };

  const others: ParticipantData[] = isHost
    ? [
        { id: 'p2', name: 'Alex', isHost: false, status: 'synced' },
        { id: 'p3', name: 'Sam', isHost: false, status: 'syncing' },
      ]
    : [
        { id: 'host', name: 'Host', isHost: true, status: 'synced' },
        { id: 'p2', name: 'Alex', isHost: false, status: 'synced' },
      ];

  return isHost ? [me, ...others] : [...others, me];
}

function broadcastState(): void {
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATE',
    state,
  } as ExtensionMessage).catch(() => {
    // Popup might not be open
  });
}

function updateRoomMedia(): void {
  if (!state.room || !state.youtube) return;

  state.room.media = {
    id: state.youtube.videoId,
    title: state.youtube.title,
    channel: state.youtube.channel,
    thumbnail: getThumbnailUrl(state.youtube.videoId),
    duration: state.youtube.duration,
  };

  broadcastState();
}

function startSyncEngine(asHost: boolean): void {
  if (syncEngine) {
    syncEngine.stop();
  }

  remoteAdapter = new RemoteMediaAdapter();
  transport = new LocalTransport();

  transport.connect(state.room?.code || 'LOCAL', asHost).then(() => {
    syncEngine = new SyncEngine(remoteAdapter!, transport!);

    syncEngine.on((syncState) => {
      state.sync = {
        role: syncState.role,
        synced: syncState.synced,
        drift: syncState.drift,
        rtt: syncState.rtt,
        clockOffset: syncState.clockOffset,
        lastCorrection: syncState.lastCorrection,
      };

      state.connectionStatus = syncState.synced ? 'synced' : 'syncing';
      broadcastState();
    });

    syncEngine.start();
  });
}

function stopSyncEngine(): void {
  if (syncEngine) {
    syncEngine.stop();
    syncEngine = null;
  }
  if (transport) {
    transport.disconnect();
    transport = null;
  }
  if (remoteAdapter) {
    remoteAdapter.destroy();
    remoteAdapter = null;
  }
  state.sync = null;
}

function handleCreateRoom(roomName: string, playbackControl: 'host' | 'everyone'): ExtensionState {
  const code = generateRoomCode();
  const isHost = true;

  state.room = {
    code,
    name: roomName,
    hostId: 'me',
    playbackControl,
    participants: createDemoParticipants(isHost),
    media: null,
  };
  state.screen = 'room';
  state.connectionStatus = 'syncing';

  startSyncEngine(true);
  broadcastState();
  return state;
}

function handleJoinRoom(code: string): ExtensionState {
  const isHost = false;

  state.room = {
    code,
    name: 'Joined Room',
    hostId: 'host',
    playbackControl: 'host',
    participants: createDemoParticipants(isHost),
    media: null,
  };
  state.screen = 'room';
  state.connectionStatus = 'syncing';

  startSyncEngine(false);
  broadcastState();
  return state;
}

function handleLeaveRoom(): ExtensionState {
  stopSyncEngine();
  state.room = null;
  state.screen = 'welcome';
  state.connectionStatus = 'disconnected';

  broadcastState();
  return state;
}

function handleYouTubeDetected(videoId: string, title: string, channel: string): void {
  state.youtube = {
    videoId,
    title,
    channel,
    playing: false,
    position: 0,
    duration: 0,
    ready: false,
  };
  updateRoomMedia();
}

function handlePlayerState(
  videoId: string | null,
  title: string,
  channel: string,
  playing: boolean,
  position: number,
  duration: number,
  ready: boolean
): void {
  if (!videoId) return;

  state.youtube = {
    videoId,
    title,
    channel,
    playing,
    position,
    duration,
    ready,
  };

  if (remoteAdapter) {
    remoteAdapter.updateState(videoId, playing, position, duration, ready);
  }

  updateRoomMedia();
}

function handlePlayerCommand(command: 'play' | 'pause' | 'seek', position?: number): void {
  if (syncEngine) {
    syncEngine.sendCommand(command, position);
  } else {
    const msg: PlayerCommandMessage = {
      type: 'PLAYER_COMMAND',
      command,
      position,
    };
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
    });
  }
}

chrome.runtime.onInstalled.addListener((): void => {
  console.log('[Musync][Background] Extension installed');
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: ExtensionState) => void): boolean => {
    switch (message.type) {
      case 'CREATE_ROOM':
        sendResponse(handleCreateRoom(message.roomName, message.playbackControl));
        break;
      case 'JOIN_ROOM':
        sendResponse(handleJoinRoom(message.code));
        break;
      case 'LEAVE_ROOM':
        sendResponse(handleLeaveRoom());
        break;
      case 'GET_STATE':
        sendResponse(state);
        break;
      case 'COPY_ROOM_CODE':
        break;
      case 'YOUTUBE_DETECTED':
        handleYouTubeDetected(message.videoId, message.title, message.channel);
        break;
      case 'YOUTUBE_VIDEO_CHANGED':
        handleYouTubeDetected(message.videoId, message.title, message.channel);
        break;
      case 'PLAYER_STATE':
        handlePlayerState(
          message.videoId,
          message.title,
          message.channel,
          message.playing,
          message.position,
          message.duration,
          message.ready
        );
        break;
      case 'PLAYER_COMMAND':
        handlePlayerCommand(message.command, message.position);
        break;
      default:
        break;
    }

    return true;
  }
);
