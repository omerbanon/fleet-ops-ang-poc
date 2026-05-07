import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

import type { WizardMissionData } from '../../../../models/wizard.model';
import { MISSION_TYPE_LABELS, STAGE_ACTION_LABELS } from '../../../../models/wizard.model';
import type { Truck } from '../../../../models/truck.model';
import type { Person } from '../../../../models/person.model';

@Component({
  selector: 'app-step5-review',
  standalone: true,
  imports: [IonButton],
  templateUrl: './step5-review.component.html',
  styleUrl: './step5-review.component.scss',
})
export class Step5ReviewComponent {
  @Input({ required: true }) missionData!: WizardMissionData;
  @Input() trucks: Truck[] = [];
  @Input() people: Person[] = [];
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() jumpTo = new EventEmitter<number>();

  missionTypeLabels = MISSION_TYPE_LABELS;
  stageActionLabels = STAGE_ACTION_LABELS;

  formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  truckLabelById(truckId: string): string {
    const t = this.trucks.find(x => x.id === truckId);
    if (t) return `${t.vehicle_id} (${t.type})`;
    const c = this.missionData.customTrucks.find(x => x.id === truckId);
    if (c) return `${c.vehicleId} (${c.type})`;
    return truckId;
  }

  personName(id: string | null): string {
    if (!id) return '—';
    const p = this.people.find(x => x.id === id);
    if (p) return p.full_name;
    const c = this.missionData.customPeople.find(x => x.id === id);
    return c?.fullName ?? '—';
  }

  truckCount = computed(() => this.missionData.truckAssignments.length);
  peopleCount = computed(() => {
    const ids = new Set<string>();
    for (const a of this.missionData.truckAssignments) {
      if (a.driver) ids.add(a.driver);
      a.coDrivers.filter(Boolean).forEach(id => ids.add(id!));
    }
    return ids.size;
  });

  onSubmit(): void { this.next.emit(); }
  onBack(): void { this.back.emit(); }
  onEdit(step: number): void { this.jumpTo.emit(step); }
}
