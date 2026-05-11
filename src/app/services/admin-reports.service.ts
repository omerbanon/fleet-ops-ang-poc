import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { TeamStats } from '../models/admin-reports.model';
import { MissionService } from './mission.service';
import type { Mission } from '../models/mission.model';
import { getTodayStr } from '../models/mission.model';

const FETCH_DELAY = 300;

const SYNTHETIC_TEAMS = [
  { team_id: 'team-001', team_name: 'צוות הובלות' },
  { team_id: 'team-002', team_name: 'צוות חירום' },
];

// Synthetic team-002 missions so the second team's row in the report isn't empty.
// Identical concept to mock-commander.ts; inlined here so the admin-reports
// branch doesn't depend on the commander branch.
function buildTeam002Missions(): Mission[] {
  const today = getTodayStr();
  const base: Omit<Mission, 'id' | 'mission_name' | 'status'> = {
    mission_date: today,
    commander_name: 'אבי מזרחי',
    mission_type: 'supply',
    enabled_risks: [],
    commander_phone: '050-2233445',
    traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: 'team-002',
    team_name: 'צוות חירום',
    created_at: `${today}T05:00:00Z`,
    updated_at: `${today}T05:00:00Z`,
    mission_stages: [],
    mission_personnel: [],
    custom_risks: [],
  };
  return [
    { ...base, id: 'm-t2-001', mission_name: 'תגבור צוות חירום למוצב', status: 'active' },
    { ...base, id: 'm-t2-002', mission_name: 'אספקה למחנה הצפוני', status: 'scheduled' },
  ];
}

/**
 * Mock impl of GET /api/admin/reports?from&to.
 * Real impl wires the server query.
 */
@Injectable({ providedIn: 'root' })
export class AdminReportsService {
  private missionService = inject(MissionService);
  private syntheticTeam2 = buildTeam002Missions();

  fetchReports(range: { from: string; to: string } | null): Observable<{ teams: TeamStats[] }> {
    return new Observable(sub => {
      setTimeout(() => {
        this.missionService.missions$.subscribe({
          next: team1Missions => {
            const all: Mission[] = [...team1Missions, ...this.syntheticTeam2];
            const teams: TeamStats[] = SYNTHETIC_TEAMS.map(t => this.computeStats(t, all, range));
            sub.next({ teams });
            sub.complete();
          },
          error: e => sub.error(e),
        }).unsubscribe();
      }, FETCH_DELAY);
    });
  }

  private computeStats(team: { team_id: string; team_name: string }, all: Mission[], range: { from: string; to: string } | null): TeamStats {
    const inRange = (m: Mission) => !range || (m.mission_date >= range.from && m.mission_date <= range.to);
    const ofTeam = all.filter(m => m.team_id === team.team_id && inRange(m));
    const nonDraft = ofTeam.filter(m => m.status === 'scheduled' || m.status === 'active' || m.status === 'completed');

    const truckSet = new Set<string>();
    const personSet = new Set<string>();
    for (const m of nonDraft) {
      for (const mp of m.mission_personnel) {
        if (mp.truck_id) truckSet.add(mp.truck_id);
        if (mp.person_id) personSet.add(mp.person_id);
      }
    }

    return {
      team_id: team.team_id,
      team_name: team.team_name,
      completed_missions: ofTeam.filter(m => m.status === 'completed').length,
      scheduled_missions: ofTeam.filter(m => m.status === 'scheduled').length,
      active_missions: ofTeam.filter(m => m.status === 'active').length,
      unique_trucks: truckSet.size,
      unique_people: personSet.size,
    };
  }

  /** CSV download — POC stand-in for the React ExcelPreviewModal export. */
  exportCsv(teams: TeamStats[], range: { from: string; to: string } | null): void {
    const headers = ['צוות', 'פעילות', 'מתוזמנות', 'הושלמו', 'משאיות', 'אנשי כוח'];
    const rows = teams.map(t => [
      t.team_name, t.active_missions, t.scheduled_missions,
      t.completed_missions, t.unique_trucks, t.unique_people,
    ]);
    const escape = (v: string | number) => {
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    // Prepend BOM so Excel reads UTF-8 Hebrew correctly
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוחות_${range?.from ?? 'all'}_${range?.to ?? 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
