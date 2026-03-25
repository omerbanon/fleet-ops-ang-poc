import { Component, computed, input } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import type { Mission } from '../../../../models/mission.model';

@Component({
  selector: 'app-summary-bar',
  standalone: true,
  imports: [IonCard, IonCardContent],
  templateUrl: './summary-bar.component.html',
  styleUrl: './summary-bar.component.scss',
})
export class SummaryBarComponent {
  missions = input.required<Mission[]>();
  totalTrucks = input<number>(0);
  totalPeople = input<number>(0);

  private weekFromNow = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  activeMissions = computed(() =>
    this.missions().filter(m => m.status === 'active')
  );

  scheduledMissions = computed(() =>
    this.missions().filter(m => m.status === 'scheduled' && m.mission_date <= this.weekFromNow())
  );

  trucksDeployed = computed(() => {
    const ids = new Set<string>();
    for (const m of this.activeMissions()) {
      for (const mp of m.mission_personnel) {
        const key = mp.truck_id ?? mp.custom_truck_name ?? '';
        if (key) ids.add(key);
      }
    }
    return ids.size;
  });

  crewDeployed = computed(() => {
    const counted = new Set<string>();
    for (const m of this.activeMissions()) {
      for (const mp of m.mission_personnel) {
        counted.add(`${m.id}::${mp.id}`);
      }
    }
    return counted.size;
  });

  truckPct = computed(() => {
    const total = this.totalTrucks();
    return total > 0 ? Math.round((this.trucksDeployed() / total) * 100) : 0;
  });

  crewPct = computed(() => {
    const total = this.totalPeople();
    return total > 0 ? Math.round((this.crewDeployed() / total) * 100) : 0;
  });
}
