import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { DriverAccessResult, DriverData } from '../models/driver.model';
import { MOCK_DRIVER_TOKENS } from '../mock/mock-driver';

const FETCH_DELAY = 500;
const ADVANCE_DELAY = 600;

interface AdvanceResult {
  ok: boolean;
  error?: string;
}

/**
 * Mock implementation of the driver-side data layer.
 * Real impl wires to:
 *   GET    /api/driver/{token}            → 200 DriverData | 404 invalid | 410 {error: string}
 *   PATCH  /api/driver/{token}/advance    → no body. 200 OK | non-OK {error: string}
 */
@Injectable({ providedIn: 'root' })
export class DriverService {
  // In-memory clone of the mock data per token, so advance mutations persist within a session
  private sessionState = new Map<string, DriverData>();

  validateAndFetch(token: string): Observable<DriverAccessResult> {
    return new Observable(sub => {
      setTimeout(() => {
        const entry = MOCK_DRIVER_TOKENS[token];
        if (!entry) {
          sub.next({ valid: false, reason: 'invalid' });
          sub.complete();
          return;
        }
        if ('expired' in entry) {
          sub.next({ valid: false, reason: 'expired', message: entry.message });
          sub.complete();
          return;
        }
        // Hydrate per-session clone on first access
        if (!this.sessionState.has(token)) {
          this.sessionState.set(token, structuredClone(entry));
        }
        sub.next({ valid: true, data: this.sessionState.get(token)! });
        sub.complete();
      }, FETCH_DELAY);
    });
  }

  advanceStage(token: string): Observable<AdvanceResult> {
    return new Observable(sub => {
      setTimeout(() => {
        const data = this.sessionState.get(token);
        if (!data) {
          sub.next({ ok: false, error: 'משימה לא נמצאה' });
          sub.complete();
          return;
        }
        const nowTime = new Date().toTimeString().slice(0, 5);
        const idx = data.stages.findIndex(s => s.stage_status !== 'completed');
        if (idx === -1) {
          sub.next({ ok: false, error: 'אין שלב פעיל לקידום' });
          sub.complete();
          return;
        }
        const stage = data.stages[idx];
        if (stage.stage_status === 'pending') {
          stage.stage_status = 'departed';
          stage.actual_departure_time = nowTime;
        } else if (stage.stage_status === 'departed') {
          stage.stage_status = 'completed';
          stage.actual_completion_time = nowTime;
        }
        // Auto-activate scheduled missions on first advance
        if (data.mission.status === 'scheduled') {
          data.mission.status = 'active';
        }
        sub.next({ ok: true });
        sub.complete();
      }, ADVANCE_DELAY);
    });
  }
}
