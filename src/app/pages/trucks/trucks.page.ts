import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { TruckService } from '../../services/truck.service';
import type { Truck, TruckStatus } from '../../models/truck.model';
import { isOperational } from '../../models/truck.model';
import { TruckSummaryComponent } from './components/truck-summary/truck-summary.component';
import { TruckTableComponent } from './components/truck-table/truck-table.component';
import { TruckFormComponent, type TruckFormData } from './components/truck-form/truck-form.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-trucks',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner,
    TruckSummaryComponent, TruckTableComponent, TruckFormComponent, ConfirmModalComponent,
  ],
  templateUrl: './trucks.page.html',
  styleUrl: './trucks.page.scss',
})
export class TrucksPage {
  private truckService = inject(TruckService);

  private trucks = toSignal(this.truckService.trucks$, { initialValue: [] as Truck[] });
  private loading = toSignal(this.truckService.loading$, { initialValue: true });

  truckForm = viewChild<TruckFormComponent>('truckForm');
  activeTable = viewChild<TruckTableComponent>('activeTable');

  isLoading = computed(() => this.loading());

  activeTrucks = computed(() =>
    this.trucks()
      .filter(isOperational)
      .sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id))
  );

  inactiveTrucks = computed(() =>
    this.trucks()
      .filter(t => !isOperational(t))
      .sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id))
  );

  activeCount = computed(() => this.activeTrucks().length);
  inactiveCount = computed(() => this.inactiveTrucks().length);
  maintenanceCount = computed(() => this.trucks().filter(t => t.status === 'maintenance').length);
  outOfServiceCount = computed(() => this.trucks().filter(t => t.status === 'out_of_service').length);

  showAddForm = signal(false);
  editingTruckId = signal<string | null>(null);
  deleteTarget = signal<Truck | null>(null);
  statusWarning = signal<{ truck: Truck; newStatus: TruckStatus } | null>(null);

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
  }

  async onAdd(data: TruckFormData): Promise<void> {
    const form = this.truckForm();
    if (!form) return;

    form.setSubmitting(true);
    form.setError(null);

    const { error } = await this.truckService.addTruck({
      ...data,
      team_id: 'team-001', // From TeamService in real implementation
    });

    if (error) {
      form.setError(error);
      form.setSubmitting(false);
      return;
    }

    form.reset();
    this.showAddForm.set(false);
  }

  onStartEdit(truckId: string): void {
    this.editingTruckId.set(truckId);
  }

  onCancelEdit(): void {
    this.editingTruckId.set(null);
  }

  async onSaveEdit(data: { id: string; vehicle_id: string; type: string; capacity_kg: number | null; status: TruckStatus; notes: string | null }): Promise<void> {
    const { error } = await this.truckService.updateTruck(data.id, {
      vehicle_id: data.vehicle_id,
      type: data.type,
      capacity_kg: data.capacity_kg,
      status: data.status,
      notes: data.notes,
    });

    if (error) {
      this.activeTable()?.setError(error);
      return;
    }

    this.editingTruckId.set(null);
  }

  onRequestDelete(truck: Truck): void {
    this.deleteTarget.set(truck);
  }

  async confirmDelete(): Promise<void> {
    const truck = this.deleteTarget();
    if (!truck) return;

    const { error } = await this.truckService.deleteTruck(truck.id);

    if (error) {
      // Close modal, show error via alert (matches dispatch-system behavior)
      this.deleteTarget.set(null);
      alert(error);
      return;
    }

    this.deleteTarget.set(null);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  onRequestStatusChange(event: { truck: Truck; newStatus: TruckStatus }): void {
    this.statusWarning.set(event);
  }

  async confirmStatusChange(): Promise<void> {
    const warning = this.statusWarning();
    if (!warning) return;

    this.statusWarning.set(null);
    // Proceed with the save — the table component has the form data ready
    this.activeTable()?.emitSave(warning.truck.id);
  }

  cancelStatusChange(): void {
    this.statusWarning.set(null);
  }
}
