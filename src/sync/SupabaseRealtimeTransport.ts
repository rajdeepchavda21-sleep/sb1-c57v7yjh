/**
 * SupabaseRealtimeTransport
 *
 * Implements the Transport interface using Supabase Realtime:
 *   - Broadcast channels for command/state/ping/pong messages
 *   - Presence for participant tracking (join/leave/status)
 *   - Database for room persistence (create/join room records)
 *
 * This replaces LocalTransport from Phase 3 with real networking.
 * The SyncEngine talks to this the same way — no changes needed.
 */

import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { Transport } from './Transport';
import type {
  TransportMessage,
  TransportEvent,
  TransportEventListener,
  TransportState,
  TransportParticipant,
} from './types';

type BroadcastPayload = Record<string, unknown>;

interface PresenceState {
  id: string;
  name: string;
  isHost: boolean;
  status: TransportParticipant['status'];
}

export class SupabaseRealtimeTransport implements Transport {
  private listeners: Set<TransportEventListener> = new Set();
  private roomCode: string | null = null;
  private host = false;
  private localId: string;
  private localName: string;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private connected = false;
  private participants: TransportParticipant[] = [];

  constructor(localId: string, localName: string) {
    this.localId = localId;
    this.localName = localName;
  }

  private emit(type: TransportEvent['type'], data?: unknown): void {
    this.listeners.forEach((l) => l({ type, data }));
  }

  async connect(roomCode: string, asHost: boolean): Promise<void> {
    this.roomCode = roomCode;
    this.host = asHost;

    if (!supabaseConfigured) {
      console.warn('[Musync][Transport] Supabase not configured, falling back to local-only');
      this.connected = true;
      this.participants = [
        { id: this.localId, name: this.localName, isHost: asHost, status: 'synced' },
      ];
      this.emit('connected');
      this.emit('state');
      return;
    }

    const channelName = `room:${roomCode}`;

    this.channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: this.localId,
        },
      },
    });

    this.channel
      .on('broadcast', { event: 'message' }, (payload: { payload: BroadcastPayload }) => {
        const msg = payload.payload as unknown as TransportMessage;
        if (msg.senderId === this.localId) return;
        this.emit('message', msg);
      })
      .on('presence', { event: 'sync' }, () => {
        this.updateParticipantsFromPresence();
      })
      .on('presence', { event: 'join' }, () => {
        this.updateParticipantsFromPresence();
        this.emit('participant_joined');
      })
      .on('presence', { event: 'leave' }, () => {
        this.updateParticipantsFromPresence();
        this.emit('participant_left');
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          const presenceState: PresenceState = {
            id: this.localId,
            name: this.localName,
            isHost: this.host,
            status: 'synced',
          };

          await this.channel!.track(presenceState);

          this.connected = true;
          this.updateParticipantsFromPresence();
          this.emit('connected');
          this.emit('state');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.connected = false;
          this.emit('error', status);
          this.emit('disconnected');
        }
      });
  }

  private updateParticipantsFromPresence(): void {
    if (!this.channel) return;

    const presenceState = this.channel.presenceState<PresenceState>();
    const participants: TransportParticipant[] = [];

    for (const [, states] of Object.entries(presenceState)) {
      if (states && states.length > 0) {
        const s = states[0];
        participants.push({
          id: s.id,
          name: s.name,
          isHost: s.isHost,
          status: s.status,
        });
      }
    }

    this.participants = participants;
    this.emit('state');
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.connected = false;
    this.participants = [];
    this.roomCode = null;
    this.emit('disconnected');
  }

  send(message: TransportMessage): void {
    if (!this.channel || !this.connected) return;

    this.channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message as unknown as BroadcastPayload,
    });
  }

  on(listener: TransportEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): TransportState {
    return {
      connected: this.connected,
      participants: [...this.participants],
      roomCode: this.roomCode,
    };
  }

  getParticipants(): TransportParticipant[] {
    return [...this.participants];
  }

  isHost(): boolean {
    return this.host;
  }

  getLocalId(): string {
    return this.localId;
  }
}
