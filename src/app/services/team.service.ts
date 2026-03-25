import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamService {
  readonly selectedTeamId = 'team-001';
  readonly teamName = 'צוות הובלות';
}
