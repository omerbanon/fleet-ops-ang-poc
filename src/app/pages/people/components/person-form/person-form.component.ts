import { Component, output, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonInput, IonSelect, IonSelectOption, IonToggle, IonSpinner } from '@ionic/angular/standalone';
import type { PersonRole, PersonStatus } from '../../../../models/person.model';
import { PERSON_ROLE_LABELS, PERSON_STATUS_LABELS, ALL_PERSON_ROLES, ALL_PERSON_STATUSES } from '../../../../models/person.model';

export interface PersonFormData {
  full_name: string;
  role: PersonRole;
  phone: string;
  status: PersonStatus;
  return_date: string | null;
  rank: string | null;
  has_weapon: boolean;
  vehicle_license_class: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
}

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [IonButton, IonInput, IonSelect, IonSelectOption, IonToggle, IonSpinner, ReactiveFormsModule],
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss',
})
export class PersonFormComponent {
  addPerson = output<PersonFormData>();
  cancel = output<void>();

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  statusIsHome = signal(false);

  readonly roleLabels = PERSON_ROLE_LABELS;
  readonly statusLabels = PERSON_STATUS_LABELS;
  readonly allRoles = ALL_PERSON_ROLES;
  readonly allStatuses = ALL_PERSON_STATUSES;

  form = new FormGroup({
    full_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl<PersonRole>('driver', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<PersonStatus>('at_base', { nonNullable: true }),
    return_date: new FormControl<string | null>(null),
    rank: new FormControl<string | null>(null),
    has_weapon: new FormControl<boolean>(false, { nonNullable: true }),
    vehicle_license_class: new FormControl<string | null>(null),
    emergency_contact_name: new FormControl<string | null>(null),
    emergency_contact_phone: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null),
  });

  onStatusChange(): void {
    const status = this.form.getRawValue().status;
    this.statusIsHome.set(status === 'home');
    if (status !== 'home') {
      this.form.patchValue({ return_date: null });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    // Validate return_date required when home
    if (raw.status === 'home' && !raw.return_date) return;

    this.addPerson.emit({
      full_name: raw.full_name.trim(),
      role: raw.role,
      phone: raw.phone.trim(),
      status: raw.status,
      return_date: raw.status === 'home' ? raw.return_date : null,
      rank: raw.rank?.trim() || null,
      has_weapon: raw.has_weapon,
      vehicle_license_class: raw.vehicle_license_class?.trim() || null,
      emergency_contact_name: raw.emergency_contact_name?.trim() || null,
      emergency_contact_phone: raw.emergency_contact_phone?.trim() || null,
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
    this.form.reset({ status: 'at_base', has_weapon: false, role: 'driver' });
    this.statusIsHome.set(false);
    this.errorMessage.set(null);
    this.submitting.set(false);
  }
}
