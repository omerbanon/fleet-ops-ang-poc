import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { AuthService } from './auth.service';
import type { Team } from '../models/user.model';

const STORAGE_KEY = 'dispatch_selected_team';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private authService = inject(AuthService);

  private selectedTeamIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(STORAGE_KEY)
  );

  readonly selectedTeamId$ = this.selectedTeamIdSubject.asObservable();

  readonly selectedTeam$ = combineLatest([
    this.authService.teams$,
    this.selectedTeamIdSubject,
  ]).pipe(
    map(([teams, selectedId]) => {
      if (!teams.length) return null;
      return teams.find(t => t.id === selectedId) ?? teams[0];
    }),
    distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
  );

  readonly teams$ = this.authService.teams$;

  constructor() {
    this.authService.teams$.subscribe(teams => {
      if (!teams.length) return;
      const storedId = this.selectedTeamIdSubject.value;
      const valid = teams.some(t => t.id === storedId);
      if (!valid) {
        this.setSelectedTeam(teams[0].id);
      }
    });
  }

  setSelectedTeam(teamId: string): void {
    localStorage.setItem(STORAGE_KEY, teamId);
    this.selectedTeamIdSubject.next(teamId);
  }
}
