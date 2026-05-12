import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { SafetyExamPayload } from '../models/safety-exam.model';

const SUBMIT_DELAY = 600;

@Injectable({ providedIn: 'root' })
export class SafetyExamService {
  /** Mock POST /api/safety-exam. Real impl wires HTTP client. */
  submit(_payload: SafetyExamPayload): Observable<{ ok: true } | { ok: false; error: string }> {
    return new Observable(sub => {
      setTimeout(() => {
        // POC always succeeds
        sub.next({ ok: true });
        sub.complete();
      }, SUBMIT_DELAY);
    });
  }
}
