/**
 * Transport Interface
 *
 * The transport layer handles all networking. The SyncEngine talks
 * to this interface and never touches networking directly.
 *
 * Phase 3: LocalTransport stub (no real networking)
 * Phase 4: WebSocketTransport implementation
 */

import type {
  TransportMessage,
  TransportEvent,
  TransportEventListener,
  TransportState,
  TransportParticipant,
} from './types';

export interface Transport {
  connect(roomCode: string, asHost: boolean): Promise<void>;
  disconnect(): Promise<void>;
  send(message: TransportMessage): void;
  on(listener: TransportEventListener): () => void;
  getState(): TransportState;
  getParticipants(): TransportParticipant[];
  isHost(): boolean;
}

/**
 * LocalTransport — a no-op transport for Phase 3.
 * Simulates a connection with just the local user.
 * Phase 4 replaces this with WebSocketTransport.
 */
export class LocalTransport implements Transport {
  private listeners: Set<TransportEventListener> = new Set();
  private state: TransportState = {
    connected: false,
    participants: [],
    roomCode: null,
  };
  private host = false;
  private localId = 'me';

  async connect(roomCode: string, asHost: boolean): Promise<void> {
    this.host = asHost;
    this.state = {
      connected: true,
      roomCode,
      participants: [
        {
          id: this.localId,
          name: 'You',
          isHost: asHost,
          status: 'synced',
        },
      ],
    };
    this.emit('connected');
    this.emit('state');
  }

  async disconnect(): Promise<void> {
    this.state = {
      connected: false,
      participants: [],
      roomCode: null,
    };
    this.emit('disconnected');
  }

  send(message: TransportMessage): void {
    void message;
  }

  on(listener: TransportEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): TransportState {
    return { ...this.state };
  }

  getParticipants(): TransportParticipant[] {
    return [...this.state.participants];
  }

  isHost(): boolean {
    return this.host;
  }

  private emit(type: TransportEvent['type'], data?: unknown): void {
    this.listeners.forEach((l) => l({ type, data }));
  }
}
