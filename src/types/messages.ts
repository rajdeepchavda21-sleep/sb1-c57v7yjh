export type MessageType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'GET_STATE'
  | 'STATE_UPDATE'
  | 'COPY_ROOM_CODE'
  | 'YOUTUBE_DETECTED'
  | 'YOUTUBE_VIDEO_CHANGED'
  | 'YOUTUBE_STATE'
  | 'GET_YOUTUBE_STATE'
  | 'PLAYER_COMMAND'
  | 'PLAYER_STATE';

export interface CreateRoomMessage {
  type: 'CREATE_ROOM';
  roomName: string;
  playbackControl: 'host' | 'everyone';
}

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  code: string;
}

export interface LeaveRoomMessage {
  type: 'LEAVE_ROOM';
}

export interface GetStateMessage {
  type: 'GET_STATE';
}

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  state: ExtensionState;
}

export interface CopyRoomCodeMessage {
  type: 'COPY_ROOM_CODE';
}

export interface YouTubeDetectedMessage {
  type: 'YOUTUBE_DETECTED';
  videoId: string;
  title: string;
  channel: string;
}

export interface YouTubeVideoChangedMessage {
  type: 'YOUTUBE_VIDEO_CHANGED';
  videoId: string;
  title: string;
  channel: string;
}

export interface YouTubeStateMessage {
  type: 'YOUTUBE_STATE';
  videoId: string | null;
  title: string;
  channel: string;
  playing: boolean;
  position: number;
  duration: number;
}

export interface GetYouTubeStateMessage {
  type: 'GET_YOUTUBE_STATE';
}

export type PlayerCommandType = 'play' | 'pause' | 'seek';

export interface PlayerCommandMessage {
  type: 'PLAYER_COMMAND';
  command: PlayerCommandType;
  position?: number;
}

export interface PlayerStateMessage {
  type: 'PLAYER_STATE';
  videoId: string | null;
  title: string;
  channel: string;
  playing: boolean;
  position: number;
  duration: number;
  ready: boolean;
}

export type PopupMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | GetStateMessage
  | CopyRoomCodeMessage
  | PlayerCommandMessage;

export type BackgroundMessage =
  | StateUpdateMessage
  | YouTubeStateMessage
  | PlayerStateMessage;

export type ContentMessage =
  | GetYouTubeStateMessage
  | PlayerCommandMessage;

export type ExtensionMessage =
  | PopupMessage
  | BackgroundMessage
  | ContentMessage
  | YouTubeDetectedMessage
  | YouTubeVideoChangedMessage
  | PlayerStateMessage;

export interface ExtensionState {
  screen: 'welcome' | 'create' | 'join' | 'room';
  room: RoomData | null;
  connectionStatus: 'synced' | 'syncing' | 'reconnecting' | 'disconnected' | 'error';
  youtube: YouTubeData | null;
  sync: SyncStateData | null;
}

export interface SyncStateData {
  role: 'host' | 'follower';
  synced: boolean;
  drift: number;
  rtt: number;
  clockOffset: number;
  lastCorrection: number | null;
}

export interface RoomData {
  code: string;
  name: string;
  hostId: string;
  playbackControl: 'host' | 'everyone';
  participants: ParticipantData[];
  media: MediaData | null;
}

export interface ParticipantData {
  id: string;
  name: string;
  isHost: boolean;
  status: 'synced' | 'syncing' | 'reconnecting' | 'disconnected' | 'error';
}

export interface MediaData {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}

export interface YouTubeData {
  videoId: string;
  title: string;
  channel: string;
  playing: boolean;
  position: number;
  duration: number;
  ready: boolean;
}
