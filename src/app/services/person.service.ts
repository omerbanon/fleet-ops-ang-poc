import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Person } from '../models/person.model';
import { validatePhone } from '../models/person.model';
import { MOCK_PEOPLE } from '../mock/mock-people';

const SIMULATED_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class PersonService {
  private peopleSubject = new BehaviorSubject<Person[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private nextId = MOCK_PEOPLE.length + 1;

  readonly people$ = this.peopleSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadPeople();
  }

  loadPeople(): void {
    this.loadingSubject.next(true);
    setTimeout(() => {
      if (this.peopleSubject.value.length === 0) {
        this.peopleSubject.next([...MOCK_PEOPLE]);
      }
      this.loadingSubject.next(false);
    }, SIMULATED_DELAY);
  }

  async addPerson(data: Omit<Person, 'id' | 'scheduled_mission_count'>): Promise<{ error: string | null }> {
    await this.delay();

    if (!validatePhone(data.phone)) {
      return { error: 'מספר טלפון לא תקין (9-15 ספרות)' };
    }

    const cleanPhone = data.phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');

    const newPerson: Person = {
      id: `person-${String(this.nextId++).padStart(3, '0')}`,
      full_name: data.full_name,
      role: data.role,
      phone: cleanPhone,
      status: data.status,
      return_date: data.status === 'home' ? data.return_date : null,
      rank: data.rank,
      has_weapon: data.has_weapon,
      vehicle_license_class: data.vehicle_license_class,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      notes: data.notes,
      team_id: data.team_id,
      scheduled_mission_count: 0,
    };

    this.peopleSubject.next([...this.peopleSubject.value, newPerson]);
    return { error: null };
  }

  async updatePerson(
    id: string,
    data: Partial<Pick<Person, 'full_name' | 'role' | 'phone' | 'status' | 'return_date' | 'rank' | 'has_weapon' | 'vehicle_license_class' | 'emergency_contact_name' | 'emergency_contact_phone' | 'notes'>>,
  ): Promise<{ error: string | null }> {
    await this.delay();

    if (data.phone && !validatePhone(data.phone)) {
      return { error: 'מספר טלפון לא תקין (9-15 ספרות)' };
    }

    if (data.phone) {
      data = { ...data, phone: data.phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') };
    }

    // Clear return_date if status is not 'home'
    if (data.status && data.status !== 'home') {
      data = { ...data, return_date: null };
    }

    const updated = this.peopleSubject.value.map(p => (p.id === id ? { ...p, ...data } : p));
    this.peopleSubject.next(updated);
    return { error: null };
  }

  async deletePerson(id: string): Promise<{ error: string | null }> {
    await this.delay();

    const current = this.peopleSubject.value;
    const person = current.find(p => p.id === id);

    if (person && person.scheduled_mission_count > 0) {
      return { error: 'לאדם זה יש משימות מתוזמנות. יש להסיר אותו מהמשימות לפני המחיקה.' };
    }

    this.peopleSubject.next(current.filter(p => p.id !== id));
    return { error: null };
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
  }
}
