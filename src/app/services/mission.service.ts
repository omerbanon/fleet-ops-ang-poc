import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Mission, MissionStatus } from '../models/mission.model';
import { DataService, ResourceTotals } from './data-service.interface';
import { MOCK_MISSIONS, MOCK_TRUCKS, MOCK_PEOPLE } from '../mock/mock-data';

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
