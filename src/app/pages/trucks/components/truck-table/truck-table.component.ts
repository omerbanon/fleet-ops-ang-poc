import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonInput, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import type { Truck, TruckStatus } from '../../../../models/truck.model';
import { TRUCK_STATUS_LABELS, TRUCK_STATUS_COLORS, ALL_TRUCK_STATUSES, formatCapacity } from '../../../../models/truck.model';

export interface TruckUpdateData {
  id: string;
  vehicle_id: string;
  type: string;
  capacity_kg: number | null;
  status: TruckStatus;
  notes: string | null;
}

@Component({
  selector: 'app-truck-table',
  standalone: true,
  imports: [IonButton, IonInput, IonSelect, IonSelectOption, ReactiveFormsModule],
  templateUrl: './truck-table.component.html',
  styleUrl: './truck-table.component.scss',
})
export class TruckTableComponent {
  trucks = input.required<Truck[]>();
  editingTruckId = input<string | null>(null);
  sectionTitle = input<string | null>(null);
  dimmed = input<boolean>(false);

  startEdit = output<string>();
  cancelEdit = output<void>();
  saveEdit = output<TruckUpdateData>();
  requestDelete = output<Truck>();
  requestStatusChange = output<{ truck: Truck; newStatus: TruckStatus }>();

  editForm = new FormGroup({
    vehicle_id: new FormControl('', { nonNullable: true }),
    type: new FormControl('', { nonNullable: true }),
    capacity_kg: new FormControl<number | null>(null),
    status: new FormControl<TruckStatus>('operational', { nonNullable: true }),
    notes: new FormControl<string | null>(null),
  });

  editError = signal<string | null>(null);

  readonly statusLabels = TRUCK_STATUS_LABELS;
  readonly statusColors = TRUCK_STATUS_COLORS;
  readonly allStatuses = ALL_TRUCK_STATUSES;
  readonly formatCapacity = formatCapacity;

  onStartEdit(truck: Truck): void {
    this.editForm.patchValue({
      vehicle_id: truck.vehicle_id,
      type: truck.type,
      capacity_kg: truck.capacity_kg,
      status: truck.status,
      notes: truck.notes,
    });
    this.editError.set(null);
    this.startEdit.emit(truck.id);
  }

  onSaveEdit(truck: Truck): void {
    const raw = this.editForm.getRawValue();

    // Check if status changed from operational and truck has missions
    if (raw.status !== truck.status && truck.status === 'operational' && truck.scheduled_mission_count > 0) {
      this.requestStatusChange.emit({ truck, newStatus: raw.status });
      return;
    }

    this.emitSave(truck.id);
  }

  emitSave(truckId: string): void {
    const raw = this.editForm.getRawValue();
    this.saveEdit.emit({
      id: truckId,
      vehicle_id: raw.vehicle_id.trim(),
      type: raw.type.trim(),
      capacity_kg: raw.capacity_kg,
      status: raw.status,
      notes: raw.notes?.trim() || null,
    });
  }

  setError(message: string | null): void {
    this.editError.set(message);
  }
}
