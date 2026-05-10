import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { TeamMember } from '../models/team-management.model';
import { MOCK_USERS, MOCK_TEAM_MEMBERSHIPS } from '../mock/mock-auth';

const DELAY = 250;

interface MemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

/**
 * Mock impl of team-management endpoints.
 *
 * Real impl wires:
 *   GET    /api/teams/{id}/members     → MemberRow[]
 *   POST   /api/teams                  → { id, name }
 *   POST   /api/teams/{id}/members     → invites via Supabase auth.signUp
 *   DELETE /api/teams/members/{id}     → removes a row
 */
@Injectable({ providedIn: 'root' })
export class TeamManagementService {
  // Hydrate in-memory rows from the existing membership map. team_members keys = `${user_id}:${team_id}`
  private rows: MemberRow[] = this.seed();

  private seed(): MemberRow[] {
    const out: MemberRow[] = [];
    for (const [userId, teams] of Object.entries(MOCK_TEAM_MEMBERSHIPS)) {
      for (const team of teams) {
        out.push({
          id: `${userId}:${team.id}`,
          team_id: team.id,
          user_id: userId,
          role: team.role === 'admin' ? 'admin' : 'member',
          created_at: '2026-01-01T00:00:00Z',
        });
      }
    }
    return out;
  }

  listMembers(teamId: string, currentUser: { id: string; email: string } | null): Observable<TeamMember[]> {
    return new Observable(sub => {
      setTimeout(() => {
        const list = this.rows.filter(r => r.team_id === teamId).map<TeamMember>(r => {
          const u = MOCK_USERS.find(x => x.id === r.user_id);
          const email = r.user_id === currentUser?.id
            ? (currentUser.email ?? r.user_id)
            : (u?.email ?? r.user_id);
          return { id: r.id, user_id: r.user_id, role: r.role, email, created_at: r.created_at };
        });
        sub.next(list);
        sub.complete();
      }, DELAY);
    });
  }

  createTeam(_name: string, _currentUserId: string): Observable<{ id: string; name: string }> {
    return new Observable(sub => {
      setTimeout(() => {
        // POC: real impl creates row in `teams` then `team_members` admin row.
        // Returning a synthetic id; the React page reloads after to refresh AuthContext.
        sub.next({ id: `team-${Date.now()}`, name: _name });
        sub.complete();
      }, DELAY);
    });
  }

  inviteMember(teamId: string, email: string): Observable<{ user: { id: string; email: string }; tempPassword: string }> {
    return new Observable(sub => {
      setTimeout(() => {
        const tempPassword = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          : Math.random().toString(36).slice(2, 18);
        const newUserId = `user-${Date.now()}`;
        // Mutate in-memory state: append a new MOCK_USERS-style entry would require touching mock-auth;
        // for POC we just record the membership row.
        this.rows.push({
          id: `${newUserId}:${teamId}`,
          team_id: teamId,
          user_id: newUserId,
          role: 'member',
          created_at: new Date().toISOString(),
        });
        sub.next({ user: { id: newUserId, email }, tempPassword });
        sub.complete();
      }, DELAY);
    });
  }

  removeMember(memberId: string): Observable<void> {
    return new Observable(sub => {
      setTimeout(() => {
        this.rows = this.rows.filter(r => r.id !== memberId);
        sub.next();
        sub.complete();
      }, DELAY);
    });
  }
}
