import { Observable } from 'rxjs';
import type { Mission, MissionStatus } from '../models/mission.model';

export interface ResourceTotals {
  trucks: number;
  people: number;
}

export abstract class DataService {
  abstract missions$: Observable<Mission[]>;
  abstract resourceTotals$: Observable<ResourceTotals>;
  abstract loading$: Observable<boolean>;

  abstract loadMissions(): void;
  abstract changeMissionStatus(missionId: string, status: MissionStatus): Promise<void>;
  abstract deleteDraft(missionId: string): Promise<void>;
}
