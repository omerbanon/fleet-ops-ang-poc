import { Component, EventEmitter, Input, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import type { DriverData, DriverStage } from '../../../../models/driver.model';
import { DriverService } from '../../../../services/driver.service';
import { VisibilityPollingService } from '../../../../services/visibility-polling.service';
import { StageProgressComponent } from '../stage-progress/stage-progress.component';
import { StageCardComponent } from '../stage-card/stage-card.component';
import { DriverButtonComponent } from '../driver-button/driver-button.component';

type DriverViewState = 'loading' | 'ready' | 'expired' | 'invalid' | 'error';

const POLL_INTERVAL_MS = 60_000;
const SWIPE_THRESHOLD_PX = 50;

@Component({
  selector: 'app-driver-view',
  standalone: true,
  imports: [IonSpinner, StageProgressComponent, StageCardComponent, DriverButtonComponent],
  templateUrl: './driver-view.component.html',
  styleUrl: './driver-view.component.scss',
})
export class DriverViewComponent implements OnInit, OnDestroy {
  private driverService = inject(DriverService);
  private visibility = inject(VisibilityPollingService);

  @Input({ required: true }) token = '';

  state = signal<DriverViewState>('loading');
  data = signal<DriverData | null>(null);
  viewedIndex = signal<number | null>(null);
  advancing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Derived
  stages = computed<DriverStage[]>(() => this.data()?.stages ?? []);
  totalStages = computed(() => this.stages().length);

  currentStageIndex = computed<number>(() => {
    const ss = this.stages();
    if (ss.length === 0) return 0;
    const idx = ss.findIndex(s => s.stage_status !== 'completed');
    return idx === -1 ? ss.length - 1 : idx;
  });

  viewedStage = computed<DriverStage | null>(() => {
    const i = this.viewedIndex();
    if (i == null) return null;
    return this.stages()[i] ?? null;
  });

  isViewingCurrentStage = computed(() => this.viewedIndex() === this.currentStageIndex());

  allCompleted = computed(() => {
    const ss = this.stages();
    return ss.length > 0 && ss.every(s => s.stage_status === 'completed');
  });

  // Branch the expired screen by errorMessage
  expiredBranch = computed<'success' | 'cancelled' | 'default'>(() => {
    const m = this.errorMessage() ?? '';
    if (m === 'המשימה הושלמה') return 'success';
    if (m === 'המשימה בוטלה') return 'cancelled';
    return 'default';
  });

  private stopPolling: (() => void) | null = null;

  // Swipe state (private, no signal needed)
  private touchStartX: number | null = null;
  private touchStartY: number | null = null;

  constructor() {
    // Effect: when data lands or viewedIndex resets to null, pick the current stage
    effect(() => {
      const d = this.data();
      const vi = this.viewedIndex();
      if (d && vi == null && d.stages.length > 0) {
        // setTimeout to escape effect's signal-write protection
        queueMicrotask(() => this.viewedIndex.set(this.currentStageIndex()));
      }
    });
  }

  ngOnInit(): void {
    this.fetch();
    this.stopPolling = this.visibility.start(
      () => this.fetch(/* silent */ true),
      POLL_INTERVAL_MS,
      () => this.state() === 'ready',
    );
  }

  ngOnDestroy(): void {
    if (this.stopPolling) this.stopPolling();
  }

  private fetch(silent = false): void {
    if (!silent) this.state.set('loading');
    this.driverService.validateAndFetch(this.token).subscribe({
      next: result => {
        if (result.valid) {
          this.data.set(result.data);
          this.state.set('ready');
          this.errorMessage.set(null);
        } else if (result.reason === 'invalid' || result.reason === 'used') {
          this.state.set('invalid');
          this.errorMessage.set(result.message ?? null);
        } else {
          this.state.set('expired');
          this.errorMessage.set(result.message ?? null);
        }
      },
      error: () => {
        if (!silent) this.state.set('error');
      },
    });
  }

  onAdvance(): void {
    if (this.advancing()) return;
    this.advancing.set(true);
    this.driverService.advanceStage(this.token).subscribe({
      next: result => {
        this.advancing.set(false);
        if (result.ok) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(50); } catch { /* ignore */ }
          }
          // Reset viewedIndex so the effect picks the new active stage
          this.viewedIndex.set(null);
          this.errorMessage.set(null);
          this.fetch(true);
        } else {
          this.errorMessage.set(result.error ?? 'שגיאת רשת — נסה שוב');
        }
      },
      error: () => {
        this.advancing.set(false);
        this.errorMessage.set('שגיאת רשת — נסה שוב');
      },
    });
  }

  goPrev(): void {
    const i = this.viewedIndex();
    if (i == null || i <= 0) return;
    this.viewedIndex.set(i - 1);
  }

  goNext(): void {
    const i = this.viewedIndex();
    const max = this.totalStages() - 1;
    if (i == null || i >= max) return;
    this.viewedIndex.set(i + 1);
  }

  onStageDotSelect(i: number): void {
    this.viewedIndex.set(i);
  }

  // ── Swipe handlers (RTL-aware: right→prev, left→next) ─────────────────────

  onTouchStart(e: TouchEvent): void {
    if (!e.touches[0]) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    if (this.touchStartX == null || this.touchStartY == null) return;
    const endTouch = e.changedTouches[0];
    if (!endTouch) { this.touchStartX = null; this.touchStartY = null; return; }
    const dx = endTouch.clientX - this.touchStartX;
    const dy = endTouch.clientY - this.touchStartY;
    this.touchStartX = null;
    this.touchStartY = null;
    if (Math.abs(dy) > Math.abs(dx)) return;       // dominant vertical = scroll
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    // RTL: swipe right (dx > 0) = previous; swipe left (dx < 0) = next
    if (dx > 0) this.goPrev();
    else this.goNext();
  }

  // ── Helpers for template ───────────────────────────────────────────────────

  hasPrev = computed(() => (this.viewedIndex() ?? 0) > 0);
  hasNext = computed(() => {
    const i = this.viewedIndex();
    return i != null && i < this.totalStages() - 1;
  });

  isCommanderPhoneShown = computed(() => {
    const m = this.data()?.mission;
    return !!m?.commander_phone;
  });

  driverCrewLabel(role: string): string {
    return role === 'driver' || role === 'both' ? '(נהג)' : '';
  }
}
