/**
 * DriftCorrector — detects and corrects playback position drift
 *
 * Compares the local player position against a reference position
 * (the host's position, adjusted for clock offset and playback time).
 *
 * Correction strategy:
 *   - If drift is within the tolerance band, do nothing (avoid jitter).
 *   - If drift is moderate, seek to the corrected position.
 *   - If drift is severe and persists, flag as desynced.
 *
 * The corrector is stateless — it just computes what action to take
 * given the current state. The SyncEngine decides whether to act on it.
 */

export interface DriftInput {
  localPosition: number;
  referencePosition: number;
  referenceTimestamp: number;
  localTimestamp: number;
  clockOffset: number;
  playing: boolean;
  rtt: number;
}

export interface DriftResult {
  drift: number;
  correctedPosition: number;
  action: 'none' | 'seek' | 'desync';
  severity: 'in_sync' | 'minor' | 'moderate' | 'severe';
}

const DRIFT_TOLERANCE_MS = 1500;
const DRIFT_SEEK_THRESHOLD_MS = 3000;
const DRIFT_DESYNC_THRESHOLD_MS = 10000;

export function computeDrift(input: DriftInput): DriftResult {
  const { localPosition, referencePosition, referenceTimestamp, localTimestamp, clockOffset, playing, rtt } = input;

  // Adjust reference position for elapsed time since the reference was measured
  const elapsedRef = localTimestamp - referenceTimestamp - clockOffset;
  const adjustedReference = playing
    ? referencePosition + Math.max(0, elapsedRef)
    : referencePosition;

  const drift = localPosition - adjustedReference;
  const absDrift = Math.abs(drift);

  let action: DriftResult['action'] = 'none';
  let severity: DriftResult['severity'] = 'in_sync';

  if (absDrift <= DRIFT_TOLERANCE_MS) {
    action = 'none';
    severity = 'in_sync';
  } else if (absDrift <= DRIFT_SEEK_THRESHOLD_MS) {
    action = 'none';
    severity = 'minor';
  } else if (absDrift <= DRIFT_DESYNC_THRESHOLD_MS) {
    action = 'seek';
    severity = 'moderate';
  } else {
    action = 'seek';
    severity = 'severe';
  }

  // If RTT is very high, seeking might make things worse
  if (rtt > 5000 && severity === 'moderate') {
    action = 'none';
    severity = 'minor';
  }

  const correctedPosition = Math.max(0, adjustedReference);

  return {
    drift,
    correctedPosition,
    action,
    severity,
  };
}

export function formatDrift(drift: number): string {
  const abs = Math.abs(drift);
  const sign = drift > 0 ? '+' : '-';
  if (abs < 1000) return `${sign}${Math.round(abs)}ms`;
  return `${sign}${(abs / 1000).toFixed(1)}s`;
}
