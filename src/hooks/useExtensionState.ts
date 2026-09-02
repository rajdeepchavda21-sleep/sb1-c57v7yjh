import { useState, useEffect, useCallback } from 'react';
import { sendMessage, onMessage, isExtension } from '@/lib/messaging';
import { generateRoomCode } from '@/lib/utils';
import type {
  RoomData,
  ParticipantData,
  PlayerCommandMessage,
  SyncStateData,
} from '@/types/messages';
import type {
  Screen,
  Room,
  PlaybackControlMode,
  ConnectionStatus,
  Participant,
  MediaInfo,
} from '@/types';

function createDemoParticipants(isHost: boolean): Participant[] {
  const me: Participant = {
    id: 'me',
    name: 'You',
    isHost,
    status: 'synced',
  };

  const others: Participant[] = isHost
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

function mapRoomData(room: RoomData): Room {
  return {
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    playbackControl: room.playbackControl,
    participants: room.participants.map((p: ParticipantData): Participant => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      status: p.status,
    })),
    media: room.media
      ? {
          id: room.media.id,
          title: room.media.title,
          channel: room.media.channel,
          thumbnail: room.media.thumbnail,
          duration: room.media.duration,
        }
      : null,
  };
}

const DEMO_MEDIA: MediaInfo = {
  id: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  channel: 'Rick Astley',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  duration: 213,
};

export function useExtensionState() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<{
    playing: boolean;
    position: number;
    duration: number;
    ready: boolean;
  }>({ playing: false, position: 0, duration: 0, ready: false });
  const [syncState, setSyncState] = useState<SyncStateData | null>(null);
  const extension = isExtension();

  useEffect(() => {
    if (!extension) return;

    const unsubscribe = onMessage((message) => {
      if (message.type === 'STATE_UPDATE') {
        const s = message.state;
        setScreen(s.screen);
        setRoom(s.room ? mapRoomData(s.room) : null);
        setConnectionStatus(s.connectionStatus);
        if (s.youtube) {
          setYoutubeVideoId(s.youtube.videoId);
          setPlayerState({
            playing: s.youtube.playing,
            position: s.youtube.position,
            duration: s.youtube.duration,
            ready: s.youtube.ready,
          });
        }
        setSyncState(s.sync || null);
      }
    });

    sendMessage({ type: 'GET_STATE' }).then((s) => {
      if (s) {
        setScreen(s.screen);
        setRoom(s.room ? mapRoomData(s.room) : null);
        setConnectionStatus(s.connectionStatus);
        if (s.youtube) {
          setYoutubeVideoId(s.youtube.videoId);
          setPlayerState({
            playing: s.youtube.playing,
            position: s.youtube.position,
            duration: s.youtube.duration,
            ready: s.youtube.ready,
          });
        }
        setSyncState(s.sync || null);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [extension]);

  const createRoom = useCallback(
    async (roomName: string, playbackControl: PlaybackControlMode) => {
      if (extension) {
        const s = await sendMessage({
          type: 'CREATE_ROOM',
          roomName,
          playbackControl,
        });
        if (s) {
          setScreen(s.screen);
          setRoom(s.room ? mapRoomData(s.room) : null);
          setConnectionStatus(s.connectionStatus);
        }
        return;
      }

      const code = generateRoomCode();
      const isHost = true;
      setRoom({
        code,
        name: roomName,
        hostId: 'me',
        playbackControl,
        participants: createDemoParticipants(isHost),
        media: null,
      });
      setConnectionStatus('syncing');
      setScreen('room');
      setTimeout(() => setConnectionStatus('synced'), 1500);
    },
    [extension]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      if (extension) {
        const s = await sendMessage({ type: 'JOIN_ROOM', code });
        if (s) {
          setScreen(s.screen);
          setRoom(s.room ? mapRoomData(s.room) : null);
          setConnectionStatus(s.connectionStatus);
        }
        return;
      }

      const isHost = false;
      setRoom({
        code,
        name: 'Joined Room',
        hostId: 'host',
        playbackControl: 'host',
        participants: createDemoParticipants(isHost),
        media: null,
      });
      setConnectionStatus('syncing');
      setScreen('room');
      setTimeout(() => setConnectionStatus('synced'), 1500);
    },
    [extension]
  );

  const leaveRoom = useCallback(async () => {
    if (extension) {
      const s = await sendMessage({ type: 'LEAVE_ROOM' });
      if (s) {
        setScreen(s.screen);
        setRoom(null);
        setConnectionStatus(s.connectionStatus);
      }
      return;
    }

    setRoom(null);
    setScreen('welcome');
  }, [extension]);

  const navigateTo = useCallback(
    (target: Screen) => {
      if (!extension) {
        setScreen(target);
      }
    },
    [extension]
  );

  const sendPlayerCommand = useCallback(
    async (command: 'play' | 'pause' | 'seek', position?: number) => {
      if (extension) {
        const msg: PlayerCommandMessage = {
          type: 'PLAYER_COMMAND',
          command,
          position,
        };
        await sendMessage(msg);
        return;
      }
    },
    [extension]
  );

  return {
    screen,
    room,
    connectionStatus,
    youtubeVideoId,
    playerState,
    syncState,
    isExtension: extension,
    createRoom,
    joinRoom,
    leaveRoom,
    navigateTo,
    sendPlayerCommand,
    demoMedia: DEMO_MEDIA,
  };
}
