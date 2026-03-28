import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Truck, TruckStatus } from '../models/truck.model';
import { MOCK_TRUCKS } from '../mock/mock-trucks';

const SIMULATED_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class TruckService {
  private trucksSubject = new BehaviorSubject<Truck[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private nextId = MOCK_TRUCKS.length + 1;

  readonly trucks$ = this.trucksSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadTrucks();
  }

  loadTrucks(): void {
    this.loadingSubject.next(true);
    setTimeout(() => {
      if (this.trucksSubject.value.length === 0) {
        this.trucksSubject.next([...MOCK_TRUCKS]);
      }
      this.loadingSubject.next(false);
    }, SIMULATED_DELAY);
  }

  async addTruck(data: {
    vehicle_id: string;
    type: string;
    capacity_kg: number | null;
    notes: string | null;
    team_id: string;
  }): Promise<{ error: string | null }> {
    await this.delay();

    const current = this.trucksSubject.value;
    const duplicate = current.some(t => t.vehicle_id === data.vehicle_id);
    if (duplicate) {
      return { error: 'מספר רכב כבר קיים במערכת' };
    }

    const newTruck: Truck = {
      id: `truck-${String(this.nextId++).padStart(3, '0')}`,
      vehicle_id: data.vehicle_id,
      type: data.type,
      capacity_kg: data.capacity_kg,
      status: 'operational',
      notes: data.notes,
      team_id: data.team_id,
      scheduled_mission_count: 0,
    };

    this.trucksSubject.next([...current, newTruck]);
    return { error: null };
  }

  async updateTruck(
    id: string,
    data: Partial<Pick<Truck, 'vehicle_id' | 'type' | 'capacity_kg' | 'status' | 'notes'>>,
  ): Promise<{ error: string | null }> {
    await this.delay();

    const current = this.trucksSubject.value;

    if (data.vehicle_id) {
      const duplicate = current.some(t => t.vehicle_id === data.vehicle_id && t.id !== id);
      if (duplicate) {
        return { error: 'מספר רכב כבר קיים במערכת' };
      }
    }

    const updated = current.map(t => (t.id === id ? { ...t, ...data } : t));
    this.trucksSubject.next(updated);
    return { error: null };
  }

  async deleteTruck(id: string): Promise<{ error: string | null }> {
    await this.delay();

    const current = this.trucksSubject.value;
    const truck = current.find(t => t.id === id);

    if (truck && truck.scheduled_mission_count > 0) {
      return { error: 'לרכב זה יש משימות מתוזמנות. יש להסיר אותו מהמשימות לפני המחיקה.' };
    }

    this.trucksSubject.next(current.filter(t => t.id !== id));
    return { error: null };
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  }
}
