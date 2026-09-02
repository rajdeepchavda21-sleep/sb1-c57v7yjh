/**
 * SyncEngine — coordinates synchronized playback
 *
 * Responsibilities:
 *   1. When host: broadcast play/pause/seek commands to followers
 *   2. When follower: receive commands and apply them to the local adapter
 *   3. Continuously monitor drift between local and reference position
 *   4. Correct drift by seeking when it exceeds thresholds
 *   5. Maintain clock sync via ping/pong exchange
 *
 * The engine is transport-agnostic. It sends/receives via the Transport
 * interface and controls playback via the MediaAdapter interface.
 */

import type { MediaAdapter, MediaEvent } from '@/adapters/MediaAdapter';
import type {
  SyncCommand,
  SyncState,
  TransportMessage,
  TransportEvent,
} from './types';
import type { Transport } from './Transport';
import { ClockSync } from './ClockSync';
import { computeDrift, formatDrift } from './DriftCorrector';

const SYNC_POLL_INTERVAL_MS = 2000;
const CLOCK_SYNC_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_SEEKS = 3;
const SEEK_COOLDOWN_MS = 5000;

export type SyncEngineEventListener = (state: SyncState) => void;

export class SyncEngine {
  private adapter: MediaAdapter;
  private transport: Transport;
  private clockSync: ClockSync = new ClockSync();
  private listeners: Set<SyncEngineEventListener> = new Set();

  private syncPoll: ReturnType<typeof setInterval> | null = null;
  private clockPoll: ReturnType<typeof setInterval> | null = null;
  private adapterUnsubscribe: (() => void) | null = null;
  private transportUnsubscribe: (() => void) | null = null;

  private lastReference: { position: number; timestamp: number; playing: boolean; mediaId: string | null } | null = null;
  private consecutiveSeeks = 0;
  private lastSeekTime = 0;
  private pendingPing: { t1: number } | null = null;

  private state: SyncState = {
    role: 'host',
    synced: true,
    drift: 0,
    lastCorrection: null,
    clockOffset: 0,
    rtt: 0,
    mediaId: null,
    playing: false,
    position: 0,
    duration: 0,
  };

  constructor(adapter: MediaAdapter, transport: Transport) {
    this.adapter = adapter;
    this.transport = transport;
  }

  on(listener: SyncEngineEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  start(): void {
    if (this.syncPoll) return;

    this.state.role = this.transport.isHost() ? 'host' : 'follower';

    this.adapterUnsubscribe = (this.adapter as unknown as { on: (l: (e: MediaEvent) => void) => () => void }).on((event: MediaEvent) => {
      this.onAdapterEvent(event);
    });

    this.transportUnsubscribe = this.transport.on((event: TransportEvent) => {
      this.onTransportEvent(event);
    });

    this.syncPoll = setInterval(() => this.runSyncCycle(), SYNC_POLL_INTERVAL_MS);

    if (!this.transport.isHost()) {
      this.clockPoll = setInterval(() => this.runClockSync(), CLOCK_SYNC_INTERVAL_MS);
    }

    this.emit();
  }

  stop(): void {
    if (this.syncPoll) {
      clearInterval(this.syncPoll);
      this.syncPoll = null;
    }
    if (this.clockPoll) {
      clearInterval(this.clockPoll);
      this.clockPoll = null;
    }
    this.adapterUnsubscribe?.();
    this.transportUnsubscribe?.();
    this.clockSync.reset();
    this.consecutiveSeeks = 0;
    this.lastSeekTime = 0;
    this.lastReference = null;
    this.pendingPing = null;
  }

  private onAdapterEvent(event: MediaEvent): void {
    if (this.state.role === 'host') {
      this.broadcastCommand(
        event.type === 'play' ? 'play' : event.type === 'pause' ? 'pause' : event.type === 'seek' ? 'seek' : 'play',
        event.state.position,
        event.state.mediaId
      );
    }

    this.state.playing = event.state.playing;
    this.state.position = event.state.position;
    this.state.duration = event.state.duration;
    this.state.mediaId = event.state.mediaId;
    this.emit();
  }

  private onTransportEvent(event: TransportEvent): void {
    if (event.type === 'message') {
      this.onTransportMessage(event.data as TransportMessage);
    } else if (event.type === 'disconnected') {
      this.state.synced = false;
      this.emit();
    } else if (event.type === 'connected') {
      this.state.synced = true;
      this.emit();
    }
  }

  private onTransportMessage(msg: TransportMessage): void {
    switch (msg.kind) {
      case 'command':
        this.handleIncomingCommand(msg.payload as SyncCommand);
        break;
      case 'state':
        this.handleIncomingState(msg.payload as SyncState);
        break;
      case 'ping':
        this.handlePing(msg);
        break;
      case 'pong':
        this.handlePong(msg);
        break;
      default:
        break;
    }
  }

  private broadcastCommand(type: SyncCommand['type'], position: number, mediaId: string | null): void {
    const cmd: SyncCommand = {
      type,
      position,
      mediaId,
      timestamp: Date.now(),
      senderId: 'me',
    };

    this.transport.send({
      kind: 'command',
      payload: cmd,
      senderId: 'me',
      timestamp: Date.now(),
    });
  }

  private handleIncomingCommand(cmd: SyncCommand): void {
    if (cmd.senderId === 'me') return;

    this.lastReference = {
      position: cmd.position,
      timestamp: cmd.timestamp,
      playing: cmd.type === 'play',
      mediaId: cmd.mediaId,
    };

    switch (cmd.type) {
      case 'play':
        this.adapter.play().catch((e) => console.warn('[SyncEngine] play failed:', e));
        break;
      case 'pause':
        this.adapter.pause().catch((e) => console.warn('[SyncEngine] pause failed:', e));
        break;
      case 'seek':
        this.adapter.seek(cmd.position).catch((e) => console.warn('[SyncEngine] seek failed:', e));
        break;
    }
  }

  private handleIncomingState(remoteState: SyncState & { timestamp?: number }): void {
    if (remoteState.mediaId !== this.state.mediaId) return;

    this.lastReference = {
      position: remoteState.position,
      timestamp: remoteState.timestamp || Date.now(),
      playing: remoteState.playing,
      mediaId: remoteState.mediaId,
    };
  }

  private runSyncCycle(): void {
    this.state.position = this.adapter.getPosition();
    this.state.duration = this.adapter.getDuration();
    this.state.mediaId = this.adapter.getMediaId();
    this.state.clockOffset = this.clockSync.getOffset();
    this.state.rtt = this.clockSync.getRtt();

    if (this.state.role === 'host') {
      this.transport.send({
        kind: 'state',
        payload: { ...this.state, timestamp: Date.now() },
        senderId: 'me',
        timestamp: Date.now(),
      });
      this.state.synced = true;
      this.state.drift = 0;
      this.emit();
      return;
    }

    if (!this.lastReference) {
      this.state.synced = false;
      this.state.drift = 0;
      this.emit();
      return;
    }

    const localTs = Date.now();
    const drift = computeDrift({
      localPosition: this.state.position,
      referencePosition: this.lastReference.position,
      referenceTimestamp: this.lastReference.timestamp,
      localTimestamp: localTs,
      clockOffset: this.state.clockOffset,
      playing: this.state.playing,
      rtt: this.state.rtt,
    });

    this.state.drift = drift.drift;

    switch (drift.action) {
      case 'seek':
        if (this.canSeek()) {
          console.log(`[SyncEngine] Correcting drift: ${formatDrift(drift.drift)} -> seek to ${drift.correctedPosition}`);
          this.adapter.seek(drift.correctedPosition).catch((e) => console.warn('[SyncEngine] correction seek failed:', e));
          this.lastSeekTime = Date.now();
          this.consecutiveSeeks++;
          this.state.lastCorrection = Date.now();
        }
        this.state.synced = drift.severity !== 'severe';
        break;
      case 'none':
        if (drift.severity === 'in_sync' || drift.severity === 'minor') {
          this.consecutiveSeeks = 0;
        }
        this.state.synced = drift.severity !== 'severe';
        break;
      case 'desync':
        this.state.synced = false;
        break;
    }

    this.emit();
  }

  private canSeek(): boolean {
    if (this.consecutiveSeeks >= MAX_CONSECUTIVE_SEEKS) return false;
    if (Date.now() - this.lastSeekTime < SEEK_COOLDOWN_MS) return false;
    return true;
  }

  private runClockSync(): void {
    if (!this.transport.getState().connected) return;

    this.pendingPing = { t1: Date.now() };
    this.transport.send({
      kind: 'ping',
      payload: { t1: this.pendingPing.t1 },
      senderId: 'me',
      timestamp: Date.now(),
    });
  }

  private handlePing(msg: TransportMessage): void {
    const t2 = Date.now();
    const t3 = Date.now();
    this.transport.send({
      kind: 'pong',
      payload: { t1: (msg.payload as { t1: number }).t1, t2, t3 },
      senderId: 'me',
      timestamp: Date.now(),
    });
  }

  private handlePong(msg: TransportMessage): void {
    if (!this.pendingPing) return;
    const t4 = Date.now();
    const payload = msg.payload as { t1: number; t2: number; t3: number };

    this.clockSync.addSample({
      t1: payload.t1,
      t2: payload.t2,
      t3: payload.t3,
      t4,
    });

    this.pendingPing = null;
    this.state.clockOffset = this.clockSync.getOffset();
    this.state.rtt = this.clockSync.getRtt();
    this.emit();
  }

  getState(): SyncState {
    return { ...this.state };
  }

  sendCommand(type: SyncCommand['type'], position?: number): void {
    const pos = position ?? this.adapter.getPosition();
    this.broadcastCommand(type, pos, this.adapter.getMediaId());

    if (type === 'play') {
      this.adapter.play().catch(() => {});
    } else if (type === 'pause') {
      this.adapter.pause().catch(() => {});
    } else if (type === 'seek' && position !== undefined) {
      this.adapter.seek(position).catch(() => {});
    }
  }
}
