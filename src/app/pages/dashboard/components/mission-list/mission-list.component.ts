import { Component, input, output } from '@angular/core';
import type { Mission } from '../../../../models/mission.model';
import { getTodayStr, formatDateHeader } from '../../../../models/mission.model';
import { MissionCardComponent } from '../mission-card/mission-card.component';

interface DateGroup {
  date: string;
  label: string;
  missions: Mission[];
}

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [MissionCardComponent],
  templateUrl: './mission-list.component.html',
  styleUrl: './mission-list.component.scss',
})
export class MissionListComponent {
  missions = input.required<Mission[]>();
  expandedMissionId = input<string | null>(null);
  toggleExpand = output<string>();
  startMission = output<Mission>();
  completeMission = output<Mission>();
  cancelMission = output<Mission>();

  get groups(): DateGroup[] {
    return this.groupAndSort(this.missions());
  }

  private groupAndSort(missions: Mission[]): DateGroup[] {
    const today = getTodayStr();

    const todayActive: Mission[] = [];
    const upcoming: Mission[] = [];
    const past: Mission[] = [];

    for (const m of missions) {
      if (m.mission_date === today && (m.status === 'active' || m.status === 'scheduled')) {
        todayActive.push(m);
      } else if (m.mission_date >= today) {
        upcoming.push(m);
      } else {
        past.push(m);
      }
    }

    todayActive.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return a.mission_name.localeCompare(b.mission_name, 'he');
    });
    upcoming.sort((a, b) => a.mission_date.localeCompare(b.mission_date));
    past.sort((a, b) => b.mission_date.localeCompare(a.mission_date));

    const ordered = [...todayActive, ...upcoming, ...past];

    const groupMap = new Map<string, Mission[]>();
    const groupOrder: string[] = [];

    for (const m of ordered) {
      if (!groupMap.has(m.mission_date)) {
        groupMap.set(m.mission_date, []);
        groupOrder.push(m.mission_date);
      }
      groupMap.get(m.mission_date)!.push(m);
    }

    return groupOrder.map(date => ({
      date,
      label: formatDateHeader(date),
      missions: groupMap.get(date)!,
    }));
  }

  onToggle(id: string): void {
    this.toggleExpand.emit(id);
  }

  onStart(mission: Mission): void {
    this.startMission.emit(mission);
  }

  onComplete(mission: Mission): void {
    this.completeMission.emit(mission);
  }

  onCancel(mission: Mission): void {
    this.cancelMission.emit(mission);
  }
}
