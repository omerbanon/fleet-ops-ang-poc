import type { WizardStage } from '../models/wizard.model';

/** '08:30' + 75 → '09:45'. Returns empty string for invalid input. Handles 24h wrap. */
export function addMinutesToTime(time: string, minutes: number): string {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(((total % (24 * 60)) + 24 * 60) % (24 * 60) / 60)).padStart(2, '0');
  const mm = String(((total % 60) + 60) % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Forward-recompute the time chain starting at fromIndex.
 * - This stage's arrival = departure + drive duration (no buffer included).
 * - Stage N's bufferMinutes pushes stage N+1's departure.
 * Stops chaining when a stage has no departure or no duration.
 */
export function recomputeChain(stages: WizardStage[], fromIndex: number): WizardStage[] {
  const next = [...stages];
  for (let i = Math.max(0, fromIndex); i < next.length; i++) {
    const s = next[i];
    const duration = s.routes?.primary?.durationMinutes;
    if (s.departureTime && duration != null) {
      next[i] = { ...s, arrivalTime: addMinutesToTime(s.departureTime, duration) };
    }
    const nextStage = next[i + 1];
    if (nextStage && next[i].arrivalTime) {
      const buffer = next[i].bufferMinutes ?? 0;
      next[i + 1] = {
        ...nextStage,
        departureTime: addMinutesToTime(next[i].arrivalTime, buffer),
      };
    } else {
      break;
    }
  }
  return next;
}
