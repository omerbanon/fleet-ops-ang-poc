import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import type { Mission, MissionStatus } from '../models/mission.model';
import { DataService, ResourceTotals } from './data-service.interface';
import { MOCK_MISSIONS, MOCK_TRUCKS, MOCK_PEOPLE } from '../mock/mock-data';
import type { WizardMissionData } from '../models/wizard.model';
import type { Truck } from '../models/truck.model';
import type { Person } from '../models/person.model';
import { wizardDataToMission } from '../utils/wizard-mission-converter.util';

const SIMULATED_DELAY = 300;
const POLL_INTERVAL = 30_000;

@Injectable({ providedIn: 'root' })
export class MissionService extends DataService {
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  private resourceTotalsSubject = new BehaviorSubject<ResourceTotals>({
    trucks: MOCK_TRUCKS.length,
    people: MOCK_PEOPLE.length,
  });
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  missions$: Observable<Mission[]> = this.missionsSubject.asObservable();
  resourceTotals$: Observable<ResourceTotals> = this.resourceTotalsSubject.asObservable();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {
    super();
    this.loadMissions();
    this.startPolling();
  }

  loadMissions(): void {
    this.loadingSubject.next(true);
    setTimeout(() => {
      if (this.missionsSubject.value.length === 0) {
        this.missionsSubject.next([...MOCK_MISSIONS]);
      }
      this.loadingSubject.next(false);
    }, SIMULATED_DELAY);
  }

  async changeMissionStatus(missionId: string, status: MissionStatus): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const current = this.missionsSubject.value;
        const updated = current.map(m =>
          m.id === missionId
            ? { ...m, status, updated_at: new Date().toISOString() }
            : m
        );
        this.missionsSubject.next(updated);
        resolve();
      }, SIMULATED_DELAY);
    });
  }

  async deleteDraft(missionId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const current = this.missionsSubject.value;
        this.missionsSubject.next(current.filter(m => m.id !== missionId));
        resolve();
      }, SIMULATED_DELAY);
    });
  }

  /** Synchronous lookup from current state. Returns null if not found. */
  getMissionById(id: string): Mission | null {
    return this.missionsSubject.value.find(m => m.id === id) ?? null;
  }

  /** Wizard → Mission. Creates mission with status 'scheduled' (or override). 500ms simulated delay. */
  createMission(
    data: WizardMissionData,
    ctx: { teamId: string; trucks: Truck[]; people: Person[] },
    status: MissionStatus = 'scheduled',
  ): Observable<Mission> {
    return new Observable<Mission>(sub => {
      setTimeout(() => {
        const partial = wizardDataToMission(data, ctx) as Mission;
        const mission: Mission = { ...partial, status } as Mission;
        this.missionsSubject.next([...this.missionsSubject.value, mission]);
        sub.next(mission);
        sub.complete();
      }, 500);
    });
  }

  /** Wizard → Mission update. 300ms simulated delay. */
  updateMission(
    id: string,
    data: WizardMissionData,
    ctx: { teamId: string; trucks: Truck[]; people: Person[] },
  ): Observable<{ error: string | null }> {
    return new Observable<{ error: string | null }>(sub => {
      setTimeout(() => {
        const current = this.missionsSubject.value;
        const existing = current.find(m => m.id === id);
        if (!existing) {
          sub.next({ error: 'משימה לא נמצאה' });
          sub.complete();
          return;
        }
        const merged = wizardDataToMission(data, ctx, existing) as Mission;
        this.missionsSubject.next(current.map(m => (m.id === id ? merged : m)));
        sub.next({ error: null });
        sub.complete();
      }, SIMULATED_DELAY);
    });
  }

  /** STUBBED: real impl POSTs to /api/missions to auto-save draft. POC returns null id immediately. */
  saveDraft(_data: WizardMissionData): Observable<{ id: string | null }> {
    return of({ id: null });
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      // In real app, this would fetch from WebSocket/API
      // For POC, just emit current state
      this.missionsSubject.next([...this.missionsSubject.value]);
    }, POLL_INTERVAL);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}
