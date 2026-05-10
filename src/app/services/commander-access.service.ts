import { Injectable, inject } from '@angular/core';
import { Observable, map, distinctUntilChanged } from 'rxjs';
import { AuthService } from './auth.service';
import type { CommanderAccess } from '../models/commander.model';

/**
 * Port of React `useCommanderAccess` hook.
 *
 * Real impl: server checks team_members rows for the user. Any row with role
 * in ('commander' | 'viewer' | 'admin') grants hasAccess=true. isReadOnly=true
 * iff the user's only role(s) is 'viewer'.
 *
 * POC: derive from existing AuthService teams$ (which carries `role` per team).
 */
@Injectable({ providedIn: 'root' })
export class CommanderAccessService {
  private auth = inject(AuthService);

  readonly access$: Observable<CommanderAccess> = this.auth.teams$.pipe(
    map(teams => {
      const roles = teams.map(t => t.role);
      const hasAccess = roles.some(r => r === 'commander' || r === 'admin' || r === 'viewer');
      const isReadOnly = hasAccess && roles.every(r => r === 'viewer');
      return { hasAccess, isReadOnly };
    }),
    distinctUntilChanged((a, b) => a.hasAccess === b.hasAccess && a.isReadOnly === b.isReadOnly),
  );
}
