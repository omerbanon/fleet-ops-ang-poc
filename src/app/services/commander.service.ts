import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { CommanderMissionsResponse, TeamTotal } from '../models/commander.model';
import type { EquipmentCategory, EquipmentReport, MobilizationReport } from '../models/readiness.model';
import type { Mission } from '../models/mission.model';
import { MissionService } from './mission.service';
import {
  MOCK_COMMANDER_TEAMS,
  MOCK_TEAM_TOTALS,
  MOCK_EQUIPMENT_CATEGORIES,
  MOCK_MOBILIZATION_REPORTS,
  MOCK_EQUIPMENT_REPORTS,
  MOCK_TEAM_002_MISSIONS,
} from '../mock/mock-commander';

const FETCH_DELAY = 300;
const SAVE_DELAY = 200;

/**
 * Mock impl of all /api/commander/* endpoints.
 * Real impl wires HTTP client.
 */
@Injectable({ providedIn: 'root' })
export class CommanderService {
  private missionService = inject(MissionService);

  // In-memory mock state for readiness so saves persist within session
  private mobilization: MobilizationReport[] = structuredClone(MOCK_MOBILIZATION_REPORTS);
  private equipment: EquipmentReport[] = structuredClone(MOCK_EQUIPMENT_REPORTS);

  fetchMissions(): Observable<CommanderMissionsResponse> {
    return new Observable(sub => {
      setTimeout(() => {
        // Combine team-001 missions (from MissionService) with synthetic team-002 missions
        this.missionService.missions$.subscribe({
          next: team1Missions => {
            const all: Mission[] = [
              ...team1Missions.map(m => ({ ...m, team_name: m.team_name ?? 'צוות הובלות' })),
              ...MOCK_TEAM_002_MISSIONS,
            ];
            sub.next({
              role: 'commander',
              teams: MOCK_COMMANDER_TEAMS,
              missions: all,
            });
            sub.complete();
          },
          error: e => sub.error(e),
        }).unsubscribe();
      }, FETCH_DELAY);
    });
  }

  fetchTotals(): Observable<{ teams: TeamTotal[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        sub.next({ teams: MOCK_TEAM_TOTALS });
        sub.complete();
      }, FETCH_DELAY);
    });
  }

  fetchMobilization(date: string): Observable<{ date: string; reports: MobilizationReport[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        sub.next({ date, reports: this.mobilization.filter(r => r.report_date === date) });
        sub.complete();
      }, FETCH_DELAY);
    });
  }

  fetchEquipment(date: string): Observable<{ date: string; reports: EquipmentReport[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        sub.next({ date, reports: this.equipment.filter(r => r.report_date === date) });
        sub.complete();
      }, FETCH_DELAY);
    });
  }

  fetchEquipmentCategories(): Observable<{ categories: EquipmentCategory[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        sub.next({ categories: [...MOCK_EQUIPMENT_CATEGORIES].sort((a, b) => a.display_order - b.display_order) });
        sub.complete();
      }, FETCH_DELAY);
    });
  }

  saveMobilization(teamId: string, reportDate: string, payload: Partial<Omit<MobilizationReport, 'id' | 'team_id' | 'team_name' | 'report_date' | 'created_at' | 'updated_at' | 'created_by'>>): Observable<MobilizationReport> {
    return new Observable(sub => {
      setTimeout(() => {
        const team = MOCK_COMMANDER_TEAMS.find(t => t.id === teamId);
        if (!team) { sub.error(new Error('team not found')); return; }
        const existing = this.mobilization.find(r => r.team_id === teamId && r.report_date === reportDate);
        const now = new Date().toISOString();
        const merged: MobilizationReport = existing
          ? { ...existing, ...payload, updated_at: now }
          : {
              id: `mob-${teamId}-${reportDate}`,
              team_id: teamId,
              team_name: team.name,
              report_date: reportDate,
              authorized_strength: 0, current_manning: 0, called_up: 0, reported: 0,
              exemptions: 0, external_screening: 0, deployed_screening: 0, idf_wide: 0,
              notes: null,
              created_by: 'user-002',
              created_at: now,
              updated_at: now,
              ...payload,
            };
        this.mobilization = existing
          ? this.mobilization.map(r => r === existing ? merged : r)
          : [...this.mobilization, merged];
        sub.next(merged);
        sub.complete();
      }, SAVE_DELAY);
    });
  }

  saveEquipment(teamId: string, categoryId: string, reportDate: string, payload: Partial<Omit<EquipmentReport, 'id' | 'team_id' | 'team_name' | 'category_id' | 'category_name' | 'category_display_order' | 'report_date' | 'created_at' | 'updated_at' | 'created_by'>>): Observable<EquipmentReport> {
    return new Observable(sub => {
      setTimeout(() => {
        const team = MOCK_COMMANDER_TEAMS.find(t => t.id === teamId);
        const cat = MOCK_EQUIPMENT_CATEGORIES.find(c => c.id === categoryId);
        if (!team || !cat) { sub.error(new Error('team or category not found')); return; }
        const existing = this.equipment.find(r => r.team_id === teamId && r.category_id === categoryId && r.report_date === reportDate);
        const now = new Date().toISOString();
        const merged: EquipmentReport = existing
          ? { ...existing, ...payload, updated_at: now }
          : {
              id: `eq-${teamId}-${categoryId}-${reportDate}`,
              team_id: teamId, team_name: team.name,
              category_id: categoryId, category_name: cat.name, category_display_order: cat.display_order,
              report_date: reportDate,
              authorized: 0, manned: 0, operational: 0, faults: 0,
              notes: null,
              created_by: 'user-002',
              created_at: now,
              updated_at: now,
              ...payload,
            };
        this.equipment = existing
          ? this.equipment.map(r => r === existing ? merged : r)
          : [...this.equipment, merged];
        sub.next(merged);
        sub.complete();
      }, SAVE_DELAY);
    });
  }
}
