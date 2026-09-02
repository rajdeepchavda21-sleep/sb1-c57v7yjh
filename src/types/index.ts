export type Screen = 'welcome' | 'create' | 'join' | 'room';

export type ConnectionStatus =
  | 'synced'
  | 'syncing'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export type PlaybackControlMode = 'host' | 'everyone';

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  status: ConnectionStatus;
}

export interface MediaInfo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}

export interface PlaybackState {
  mediaId: string | null;
  playing: boolean;
  position: number;
  duration: number;
}

export interface Room {
  code: string;
  name: string;
  hostId: string;
  playbackControl: PlaybackControlMode;
  participants: Participant[];
  media: MediaInfo | null;
}
