import { Component, EventEmitter, Input, Output, computed, input } from '@angular/core';
import type { Mission } from '../../../../models/mission.model';
import { getTodayStr, getTruckCount, getCrewCount } from '../../../../models/mission.model';
import type { TeamTotal } from '../../../../models/commander.model';

interface TeamCardData {
  team_id: string;
  team_name: string;
  active: number;
  completedToday: number;
  scheduled: number;
  trucks: number;
  totalTrucks: number;
  people: number;
  totalPeople: number;
  utilization: number;        // 0-100
}

@Component({
  selector: 'app-commander-summary',
  standalone: true,
  templateUrl: './commander-summary.component.html',
  styleUrl: './commander-summary.component.scss',
})
export class CommanderSummaryComponent {
  @Input({ required: true }) missions: Mission[] = [];
  @Input({ required: true }) teamTotals: TeamTotal[] = [];
  @Input({ required: true }) teams: { id: string; name: string }[] = [];
  @Output() selectTeam = new EventEmitter<string>();

  private todayStr = getTodayStr();
  private nextWeekStr(): string {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── Global stats ────────────────────────────────────────────────────────────
  activeCount(): number { return this.missions.filter(m => m.status === 'active').length; }
  completedToday(): number { return this.missions.filter(m => m.status === 'completed' && m.mission_date === this.todayStr).length; }
  scheduledThisWeek(): number {
    const max = this.nextWeekStr();
    return this.missions.filter(m => m.status === 'scheduled' && m.mission_date <= max).length;
  }
  deployedTrucks(): number {
    return this.missions.filter(m => m.status === 'active').reduce((sum, m) => sum + getTruckCount(m), 0);
  }
  totalTrucks(): number { return this.teamTotals.reduce((sum, t) => sum + t.trucks, 0); }
  deployedCrew(): number {
    return this.missions.filter(m => m.status === 'active').reduce((sum, m) => sum + getCrewCount(m), 0);
  }
  totalPeople(): number { return this.teamTotals.reduce((sum, t) => sum + t.people, 0); }

  // ── Per-team grid ───────────────────────────────────────────────────────────
  teamCards(): TeamCardData[] {
    const max = this.nextWeekStr();
    return this.teams.map(team => {
      const tt = this.teamTotals.find(t => t.team_id === team.id) ?? { trucks: 0, people: 0 } as TeamTotal;
      const teamMissions = this.missions.filter(m => m.team_id === team.id);
      const active = teamMissions.filter(m => m.status === 'active');
      const deployedTrucks = active.reduce((sum, m) => sum + getTruckCount(m), 0);
      const deployedCrew = active.reduce((sum, m) => sum + getCrewCount(m), 0);
      const totalTrucks = tt.trucks;
      return {
        team_id: team.id,
        team_name: team.name,
        active: active.length,
        completedToday: teamMissions.filter(m => m.status === 'completed' && m.mission_date === this.todayStr).length,
        scheduled: teamMissions.filter(m => m.status === 'scheduled' && m.mission_date <= max).length,
        trucks: deployedTrucks,
        totalTrucks,
        people: deployedCrew,
        totalPeople: tt.people,
        utilization: totalTrucks === 0 ? 0 : Math.round((deployedTrucks / totalTrucks) * 100),
      };
    });
  }

  onTeamClick(teamId: string): void { this.selectTeam.emit(teamId); }
}
