import { Component, output, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonInput, IonSpinner } from '@ionic/angular/standalone';

export interface TruckFormData {
  vehicle_id: string;
  type: string;
  capacity_kg: number | null;
  notes: string | null;
}

@Component({
  selector: 'app-truck-form',
  standalone: true,
  imports: [IonButton, IonInput, IonSpinner, ReactiveFormsModule],
  templateUrl: './truck-form.component.html',
  styleUrl: './truck-form.component.scss',
})
export class TruckFormComponent {
  addTruck = output<TruckFormData>();
  cancel = output<void>();

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = new FormGroup({
    vehicle_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    capacity_kg: new FormControl<number | null>(null),
    notes: new FormControl<string | null>(null),
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    this.addTruck.emit({
      vehicle_id: raw.vehicle_id.trim(),
      type: raw.type.trim(),
      capacity_kg: raw.capacity_kg,
      notes: raw.notes?.trim() || null,
    });
  }

  setError(message: string | null): void {
    this.errorMessage.set(message);
  }

  setSubmitting(value: boolean): void {
    this.submitting.set(value);
  }

  reset(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.submitting.set(false);
  }
}
