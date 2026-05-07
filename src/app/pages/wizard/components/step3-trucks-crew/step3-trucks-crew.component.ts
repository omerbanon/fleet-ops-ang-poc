import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonSelect, IonSelectOption, IonButton, IonToggle } from '@ionic/angular/standalone';

import type {
  WizardMissionData,
  WizardTruckAssignment,
  CustomTruck,
  CustomPerson,
} from '../../../../models/wizard.model';
import { isStep3Valid } from '../../../../models/wizard.model';
import type { Truck } from '../../../../models/truck.model';
import { TRUCK_STATUS_LABELS } from '../../../../models/truck.model';
import type { Person } from '../../../../models/person.model';
import type { Mission } from '../../../../models/mission.model';
import { WizardService } from '../../../../services/wizard.service';

@Component({
  selector: 'app-step3-trucks-crew',
  standalone: true,
  imports: [FormsModule, IonInput, IonSelect, IonSelectOption, IonButton, IonToggle],
  templateUrl: './step3-trucks-crew.component.html',
  styleUrl: './step3-trucks-crew.component.scss',
})
export class Step3TrucksCrewComponent {
  private wizardService = inject(WizardService);

  @Input({ required: true }) missionData!: WizardMissionData;
  @Input() trucks: Truck[] = [];
  @Input() people: Person[] = [];
  @Input() missions: Mission[] = [];
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  search = signal('');
  showCustomTruckForm = signal(false);
  customTruckForm = signal<{ vehicleId: string; type: string }>({ vehicleId: '', type: 'משאית' });
  showCustomPersonFormFor = signal<string | null>(null); // truckId
  customPersonForm = signal<{ fullName: string; phone: string }>({ fullName: '', phone: '' });

  truckStatusLabels = TRUCK_STATUS_LABELS;

  // Day commitments — people/trucks already in another mission on the same date
  dayCommitments = computed(() => {
    const date = this.missionData.missionBasics.date;
    if (!date) return { trucks: 0, people: 0, missionMap: new Map<string, string[]>() };
    const truckIds = new Set<string>();
    const personIds = new Set<string>();
    const missionMap = new Map<string, string[]>();
    for (const m of this.missions) {
      if (m.mission_date !== date) continue;
      if (m.status === 'completed' || m.status === 'cancelled') continue;
      if (this.missionData && (m as Mission).id === this.wizardService.state.editingMissionId) continue;
      for (const mp of m.mission_personnel) {
        if (mp.truck_id) {
          truckIds.add(mp.truck_id);
          if (!missionMap.has(mp.truck_id)) missionMap.set(mp.truck_id, []);
          if (!missionMap.get(mp.truck_id)!.includes(m.mission_name)) missionMap.get(mp.truck_id)!.push(m.mission_name);
        }
        if (mp.person_id) {
          personIds.add(mp.person_id);
          if (!missionMap.has(mp.person_id)) missionMap.set(mp.person_id, []);
          if (!missionMap.get(mp.person_id)!.includes(m.mission_name)) missionMap.get(mp.person_id)!.push(m.mission_name);
        }
      }
    }
    return { trucks: truckIds.size, people: personIds.size, missionMap };
  });

  // Filter trucks by search
  filteredTrucks = computed(() => {
    const q = this.search().trim().toLowerCase();
    const all = [...this.trucks];
    if (!q) return all;
    return all.filter(t =>
      t.vehicle_id.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    );
  });

  selectedTruckIds = computed(() => new Set(this.missionData.truckAssignments.map(a => a.truckId)));

  truckCount = computed(() => this.missionData.truckAssignments.length);
  assignedPeopleCount = computed(() => {
    const ids = new Set<string>();
    for (const a of this.missionData.truckAssignments) {
      if (a.driver) ids.add(a.driver);
      a.coDrivers.filter(Boolean).forEach(id => ids.add(id!));
    }
    return ids.size;
  });

  staffingPercent = computed(() => {
    const trucks = this.truckCount();
    if (trucks === 0) return 100;
    const minNeeded = trucks; // at least 1 driver per truck
    return Math.round((this.assignedPeopleCount() / minNeeded) * 100);
  });

  isLowStaffing = computed(() => this.truckCount() > 0 && this.staffingPercent() < 50);

  canProceed = computed(() => isStep3Valid(this.missionData));

  // ── Truck selection ────────────────────────────────────────────────────────

  isSelected(truckId: string): boolean {
    return this.selectedTruckIds().has(truckId);
  }

  conflictMissionsFor(id: string): string[] {
    return this.dayCommitments().missionMap.get(id) ?? [];
  }

  toggleTruck(truck: Truck): void {
    if (truck.status !== 'operational') return;
    const current = this.missionData.truckAssignments;
    if (this.isSelected(truck.id)) {
      this.wizardService.setTruckAssignments(current.filter(a => a.truckId !== truck.id));
    } else {
      this.wizardService.setTruckAssignments([
        ...current,
        { truckId: truck.id, driver: null, coDrivers: [null, null], hasWeapon: {}, hasVestHelmet: {} },
      ]);
    }
  }

  // ── Custom truck ───────────────────────────────────────────────────────────

  toggleCustomTruckForm(): void {
    this.showCustomTruckForm.update(v => !v);
  }

  addCustomTruck(): void {
    const f = this.customTruckForm();
    if (!f.vehicleId.trim()) return;
    const id = `custom-truck-${Date.now()}`;
    const next: CustomTruck[] = [...this.missionData.customTrucks, { id, vehicleId: f.vehicleId.trim(), type: f.type || 'משאית' }];
    this.wizardService.setCustomTrucks(next);
    this.wizardService.setTruckAssignments([
      ...this.missionData.truckAssignments,
      { truckId: id, driver: null, coDrivers: [null, null], hasWeapon: {}, hasVestHelmet: {} },
    ]);
    this.customTruckForm.set({ vehicleId: '', type: 'משאית' });
    this.showCustomTruckForm.set(false);
  }

  // ── Per-truck crew assignment ─────────────────────────────────────────────

  customTrucks = computed(() => this.missionData.customTrucks);

  truckLabelById(truckId: string): { vehicleId: string; type: string } {
    const t = this.trucks.find(x => x.id === truckId);
    if (t) return { vehicleId: t.vehicle_id, type: t.type };
    const c = this.missionData.customTrucks.find(x => x.id === truckId);
    if (c) return { vehicleId: c.vehicleId, type: c.type };
    return { vehicleId: truckId, type: '' };
  }

  // For a truck, return people eligible as driver:
  //  - normal trucks: role === 'driver' || 'both'
  //  - custom trucks: any role except 'commander'
  // Filters out people already assigned to other trucks
  driverOptions(truckId: string): Array<{ id: string; full_name: string; conflict?: string[] }> {
    const isCustom = truckId.startsWith('custom-truck-');
    const others = this.missionData.truckAssignments.filter(a => a.truckId !== truckId);
    const taken = new Set<string>();
    for (const a of others) {
      if (a.driver) taken.add(a.driver);
      a.coDrivers.filter(Boolean).forEach(id => taken.add(id!));
    }

    const realPeople: Array<{ id: string; full_name: string; conflict?: string[] }> = this.people
      .filter(p => isCustom ? p.role !== 'commander' : (p.role === 'driver' || p.role === 'both'))
      .filter(p => !taken.has(p.id))
      .map(p => ({ id: p.id, full_name: p.full_name, conflict: this.conflictMissionsFor(p.id) }));

    const customPeople = this.missionData.customPeople
      .filter(p => isCustom ? true : (p.role === 'driver' || p.role === 'both'))
      .filter(p => !taken.has(p.id))
      .map(p => ({ id: p.id, full_name: p.fullName }));

    return [...realPeople, ...customPeople];
  }

  // For supplier slots: same filter but exclude commanders, exclude already-assigned including driver of same truck
  supplierOptions(truckId: string, exceptIndex: number): Array<{ id: string; full_name: string; conflict?: string[] }> {
    const a = this.missionData.truckAssignments.find(x => x.truckId === truckId);
    const others = this.missionData.truckAssignments.filter(x => x.truckId !== truckId);
    const taken = new Set<string>();
    for (const o of others) {
      if (o.driver) taken.add(o.driver);
      o.coDrivers.filter(Boolean).forEach(id => taken.add(id!));
    }
    if (a) {
      if (a.driver) taken.add(a.driver);
      a.coDrivers.forEach((id, i) => { if (id && i !== exceptIndex) taken.add(id); });
    }

    const realPeople: Array<{ id: string; full_name: string; conflict?: string[] }> = this.people
      .filter(p => p.role !== 'commander')
      .filter(p => !taken.has(p.id))
      .map(p => ({ id: p.id, full_name: p.full_name, conflict: this.conflictMissionsFor(p.id) }));

    const customPeople = this.missionData.customPeople
      .filter(p => !taken.has(p.id))
      .map(p => ({ id: p.id, full_name: p.fullName }));

    return [...realPeople, ...customPeople];
  }

  setDriver(truckId: string, personId: string | null): void {
    const next = this.missionData.truckAssignments.map(a =>
      a.truckId === truckId ? { ...a, driver: personId || null } : a
    );
    this.wizardService.setTruckAssignments(next);
  }

  setSupplier(truckId: string, slotIndex: number, personId: string | null): void {
    const next = this.missionData.truckAssignments.map(a => {
      if (a.truckId !== truckId) return a;
      const cd = [...a.coDrivers];
      cd[slotIndex] = personId || null;
      return { ...a, coDrivers: cd };
    });
    this.wizardService.setTruckAssignments(next);
  }

  addSupplierSlot(truckId: string): void {
    const next = this.missionData.truckAssignments.map(a =>
      a.truckId === truckId ? { ...a, coDrivers: [...a.coDrivers, null] } : a
    );
    this.wizardService.setTruckAssignments(next);
  }

  removeSupplierSlot(truckId: string, slotIndex: number): void {
    const next = this.missionData.truckAssignments.map(a =>
      a.truckId === truckId ? { ...a, coDrivers: a.coDrivers.filter((_, i) => i !== slotIndex) } : a
    );
    this.wizardService.setTruckAssignments(next);
  }

  toggleWeapon(truckId: string, personId: string | null, value: boolean): void {
    if (!personId) return;
    const next = this.missionData.truckAssignments.map(a =>
      a.truckId === truckId ? { ...a, hasWeapon: { ...a.hasWeapon, [personId]: value } } : a
    );
    this.wizardService.setTruckAssignments(next);
  }

  toggleVest(truckId: string, personId: string | null, value: boolean): void {
    if (!personId) return;
    const next = this.missionData.truckAssignments.map(a =>
      a.truckId === truckId ? { ...a, hasVestHelmet: { ...a.hasVestHelmet, [personId]: value } } : a
    );
    this.wizardService.setTruckAssignments(next);
  }

  hasWeapon(truckId: string, personId: string | null): boolean {
    if (!personId) return false;
    const a = this.missionData.truckAssignments.find(x => x.truckId === truckId);
    if (!a) return false;
    if (a.hasWeapon[personId] !== undefined) return a.hasWeapon[personId];
    // Default from real person data
    const p = this.people.find(x => x.id === personId);
    return !!p?.has_weapon;
  }

  hasVest(truckId: string, personId: string | null): boolean {
    if (!personId) return false;
    const a = this.missionData.truckAssignments.find(x => x.truckId === truckId);
    return !!a?.hasVestHelmet[personId];
  }

  resolvedPersonName(personId: string | null): string {
    if (!personId) return '';
    const real = this.people.find(p => p.id === personId);
    if (real) return real.full_name;
    const custom = this.missionData.customPeople.find(p => p.id === personId);
    return custom?.fullName ?? '';
  }

  // ── Custom person ──────────────────────────────────────────────────────────

  toggleCustomPersonForm(truckId: string): void {
    this.showCustomPersonFormFor.update(curr => curr === truckId ? null : truckId);
    this.customPersonForm.set({ fullName: '', phone: '' });
  }

  addCustomPerson(truckId: string): void {
    const f = this.customPersonForm();
    if (!f.fullName.trim()) return;
    const id = `custom-${Date.now()}`;
    const next: CustomPerson[] = [...this.missionData.customPeople, {
      id, fullName: f.fullName.trim(), phone: f.phone.trim(), role: 'both',
    }];
    this.wizardService.setCustomPeople(next);
    this.customPersonForm.set({ fullName: '', phone: '' });
    this.showCustomPersonFormFor.set(null);
  }

  // ── Sticky nav ─────────────────────────────────────────────────────────────

  onSubmit(): void { if (this.canProceed()) this.next.emit(); }
  onBack(): void { this.back.emit(); }

  truckCountText = computed(() => `המשך (${this.truckCount()} רכבים)`);
}
