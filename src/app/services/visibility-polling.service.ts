import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

/**
 * Visibility-aware polling utility.
 * - Subscribe to interval(intervalMs) but only fire while document.visibilityState === 'visible'.
 * - Pauses when tab is hidden.
 * - Fires immediately on becoming visible (catch up).
 *
 * Mirrors React `useVisibilityPolling(fetchFn, intervalMs, enabled)`.
 */
@Injectable({ providedIn: 'root' })
export class VisibilityPollingService {
  readonly visible$: Observable<boolean>;
  private visibleSubject: BehaviorSubject<boolean>;

  constructor() {
    const initial = typeof document === 'undefined' ? true : document.visibilityState === 'visible';
    this.visibleSubject = new BehaviorSubject<boolean>(initial);
    this.visible$ = this.visibleSubject.asObservable();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.visibleSubject.next(document.visibilityState === 'visible');
      });
    }
  }

  start(tickFn: () => void, intervalMs: number, enabledFn: () => boolean): () => void {
    let timer: ReturnType<typeof setInterval> | null = null;

    const setupTimer = () => {
      teardownTimer();
      if (this.visibleSubject.value && enabledFn()) {
        timer = setInterval(() => {
          if (this.visibleSubject.value && enabledFn()) tickFn();
        }, intervalMs);
      }
    };

    const teardownTimer = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const sub = this.visible$.subscribe(visible => {
      if (visible && enabledFn()) tickFn();
      setupTimer();
    });

    setupTimer();

    return () => {
      teardownTimer();
      sub.unsubscribe();
    };
  }
}
