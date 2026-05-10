import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { AdminTeam, AdminMember } from '../models/admin.model';
import { MOCK_TEAM_MEMBERSHIPS } from '../mock/mock-auth';

const DELAY = 250;

/**
 * Mock impl of /api/admin. Real impl wires:
 *   GET  /api/admin                                            → { teams, members }
 *   POST /api/admin { action: 'create-team', name, userId }    → { team }
 *   POST /api/admin { action: 'assign-user', userId, teamId, role } → { success: true }
 *   POST /api/admin { action: 'remove-member', memberId }      → { success: true }
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private teams: AdminTeam[] = this.seedTeams();
  private members: AdminMember[] = this.seedMembers();

  private seedTeams(): AdminTeam[] {
    const seen = new Set<string>();
    const out: AdminTeam[] = [];
    for (const teams of Object.values(MOCK_TEAM_MEMBERSHIPS)) {
      for (const t of teams) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        out.push({ id: t.id, name: t.name, created_at: '2026-01-01T00:00:00Z' });
      }
    }
    return out;
  }

  private seedMembers(): AdminMember[] {
    const out: AdminMember[] = [];
    for (const [userId, teams] of Object.entries(MOCK_TEAM_MEMBERSHIPS)) {
      for (const t of teams) {
        out.push({
          id: `${userId}:${t.id}`,
          user_id: userId,
          team_id: t.id,
          role: t.role === 'admin' ? 'admin' : 'member',
          created_at: '2026-01-01T00:00:00Z',
          teams: { name: t.name },
        });
      }
    }
    return out;
  }

  fetchAll(): Observable<{ teams: AdminTeam[]; members: AdminMember[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        sub.next({ teams: [...this.teams], members: [...this.members] });
        sub.complete();
      }, DELAY);
    });
  }

  createTeam(name: string, userId: string): Observable<{ team: AdminTeam }> {
    return new Observable(sub => {
      setTimeout(() => {
        const id = `team-${Date.now()}`;
        const team: AdminTeam = { id, name, created_at: new Date().toISOString() };
        this.teams.push(team);
        // Auto-add creator as admin (matches React backend behavior)
        this.members.push({
          id: `${userId}:${id}`,
          user_id: userId,
          team_id: id,
          role: 'admin',
          created_at: new Date().toISOString(),
          teams: { name },
        });
        sub.next({ team });
        sub.complete();
      }, DELAY);
    });
  }

  assignUser(userId: string, teamId: string, role: string): Observable<{ success: true }> {
    return new Observable(sub => {
      setTimeout(() => {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) {
          sub.error(new Error('Team not found'));
          return;
        }
        const dupe = this.members.find(m => m.user_id === userId && m.team_id === teamId);
        if (dupe) {
          sub.error(new Error('User already in this team'));
          return;
        }
        this.members.push({
          id: `${userId}:${teamId}`,
          user_id: userId,
          team_id: teamId,
          role: role || 'member',
          created_at: new Date().toISOString(),
          teams: { name: team.name },
        });
        sub.next({ success: true });
        sub.complete();
      }, DELAY);
    });
  }

  removeMember(memberId: string): Observable<{ success: true }> {
    return new Observable(sub => {
      setTimeout(() => {
        this.members = this.members.filter(m => m.id !== memberId);
        sub.next({ success: true });
        sub.complete();
      }, DELAY);
    });
  }
}
