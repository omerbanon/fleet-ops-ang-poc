import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MOCK_TRUCKS, MOCK_PEOPLE } from '../mock/mock-data';

export interface ResourceTotals {
  trucks: number;
  people: number;
}

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private totalsSubject = new BehaviorSubject<ResourceTotals>({
    trucks: MOCK_TRUCKS.length,
    people: MOCK_PEOPLE.length,
  });

  totals$: Observable<ResourceTotals> = this.totalsSubject.asObservable();
}
