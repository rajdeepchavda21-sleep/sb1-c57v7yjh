/**
 * ClockSync — NTP-style clock offset estimation
 *
 * Estimates the difference between the local clock and a reference clock
 * (the host's clock) using a ping/pong exchange.
 *
 * The 4-timestamp method:
 *   t1: sender sends ping (local clock)
 *   t2: receiver gets ping (reference clock)
 *   t3: receiver sends pong (reference clock)
 *   t4: sender gets pong (local clock)
 *
 *   offset = ((t2 - t1) + (t3 - t4)) / 2
 *   rtt = (t4 - t1) - (t3 - t2)
 *
 * We keep a rolling window of samples and use the median to reject outliers.
 */

import type { ClockSample, ClockSyncResult } from './types';

const SAMPLE_WINDOW_SIZE = 8;
const MIN_SAMPLES = 2;

export class ClockSync {
  private samples: ClockSample[] = [];
  private currentOffset = 0;
  private currentRtt = 0;

  addSample(sample: ClockSample): void {
    this.samples.push(sample);
    if (this.samples.length > SAMPLE_WINDOW_SIZE) {
      this.samples.shift();
    }
    this.recompute();
  }

  private recompute(): void {
    if (this.samples.length < MIN_SAMPLES) {
      const s = this.samples[this.samples.length - 1];
      this.currentOffset = this.computeOffset(s);
      this.currentRtt = this.computeRtt(s);
      return;
    }

    const offsets = this.samples.map((s) => this.computeOffset(s));
    const rtts = this.samples.map((s) => this.computeRtt(s));

    this.currentOffset = median(offsets);
    this.currentRtt = median(rtts);
  }

  private computeOffset(s: ClockSample): number {
    return ((s.t2 - s.t1) + (s.t3 - s.t4)) / 2;
  }

  private computeRtt(s: ClockSample): number {
    return (s.t4 - s.t1) - (s.t3 - s.t2);
  }

  getOffset(): number {
    return this.currentOffset;
  }

  getRtt(): number {
    return this.currentRtt;
  }

  reset(): void {
    this.samples = [];
    this.currentOffset = 0;
    this.currentRtt = 0;
  }

  hasEstimate(): boolean {
    return this.samples.length >= 1;
  }

  getResult(): ClockSyncResult {
    return { offset: this.currentOffset, rtt: this.currentRtt };
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
