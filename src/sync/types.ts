/**
 * Sync Engine Types
 *
 * The sync engine coordinates playback timing across participants.
 * It uses a transport abstraction so the actual networking layer
 * (WebSocket, WebRTC, etc.) can be swapped without touching the engine.
 */

export type SyncRole = 'host' | 'follower';

export type SyncCommandType = 'play' | 'pause' | 'seek';

export interface SyncCommand {
  type: SyncCommandType;
  position: number;
  mediaId: string | null;
  timestamp: number;
  senderId: string;
}

export interface SyncState {
  role: SyncRole;
  synced: boolean;
  drift: number;
  lastCorrection: number | null;
  clockOffset: number;
  rtt: number;
  mediaId: string | null;
  playing: boolean;
  position: number;
  duration: number;
}

export type TransportEventType =
  | 'connected'
  | 'disconnected'
  | 'message'
  | 'error'
  | 'participant_joined'
  | 'participant_left'
  | 'state';

export interface TransportMessage {
  kind: 'command' | 'state' | 'ping' | 'pong' | 'hello' | 'welcome' | 'leave';
  payload: unknown;
  senderId: string;
  timestamp: number;
}

export interface TransportParticipant {
  id: string;
  name: string;
  isHost: boolean;
  status: 'synced' | 'syncing' | 'reconnecting' | 'disconnected' | 'error';
}

export interface TransportState {
  connected: boolean;
  participants: TransportParticipant[];
  roomCode: string | null;
}

export type TransportEventListener = (event: TransportEvent) => void;

export interface TransportEvent {
  type: TransportEventType;
  data?: unknown;
}

export interface ClockSample {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

export interface ClockSyncResult {
  offset: number;
  rtt: number;
}
