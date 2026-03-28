import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, IonSelect, IonSelectOption, IonToggle } from '@ionic/angular/standalone';
import type { Person, PersonRole, PersonStatus } from '../../../../models/person.model';
import {
  PERSON_ROLE_LABELS, PERSON_STATUS_LABELS, PERSON_STATUS_COLORS,
  ALL_PERSON_ROLES, ALL_PERSON_STATUSES, formatPhone,
} from '../../../../models/person.model';

export interface PersonUpdateData {
  id: string;
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
  selector: 'app-people-table',
  standalone: true,
  imports: [IonButton, IonInput, IonSelect, IonSelectOption, IonToggle, ReactiveFormsModule],
  templateUrl: './people-table.component.html',
  styleUrl: './people-table.component.scss',
})
export class PeopleTableComponent {
  people = input.required<Person[]>();
  editingPersonId = input<string | null>(null);
  sectionTitle = input<string | null>(null);
  dimmed = input<boolean>(false);

  startEdit = output<string>();
  cancelEdit = output<void>();
  saveEdit = output<PersonUpdateData>();
  requestDelete = output<Person>();
  requestStatusChange = output<{ person: Person; newStatus: PersonStatus }>();

  editForm = new FormGroup({
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

  editError = signal<string | null>(null);
  editStatusIsHome = signal(false);

  readonly roleLabels = PERSON_ROLE_LABELS;
  readonly statusLabels = PERSON_STATUS_LABELS;
  readonly statusColors = PERSON_STATUS_COLORS;
  readonly allRoles = ALL_PERSON_ROLES;
  readonly allStatuses = ALL_PERSON_STATUSES;
  readonly formatPhone = formatPhone;

  onStartEdit(person: Person): void {
    this.editForm.patchValue({
      full_name: person.full_name,
      role: person.role,
      phone: person.phone,
      status: person.status,
      return_date: person.return_date,
      rank: person.rank,
      has_weapon: person.has_weapon,
      vehicle_license_class: person.vehicle_license_class,
      emergency_contact_name: person.emergency_contact_name,
      emergency_contact_phone: person.emergency_contact_phone,
      notes: person.notes,
    });
    this.editStatusIsHome.set(person.status === 'home');
    this.editError.set(null);
    this.startEdit.emit(person.id);
  }

  onEditStatusChange(): void {
    const status = this.editForm.getRawValue().status;
    this.editStatusIsHome.set(status === 'home');
    if (status !== 'home') {
      this.editForm.patchValue({ return_date: null });
    }
  }

  onSaveEdit(person: Person): void {
    const raw = this.editForm.getRawValue();

    // Check if status changed from at_base and person has missions
    if (raw.status !== person.status && person.status === 'at_base' && person.scheduled_mission_count > 0) {
      this.requestStatusChange.emit({ person, newStatus: raw.status });
      return;
    }

    this.emitSave(person.id);
  }

  emitSave(personId: string): void {
    const raw = this.editForm.getRawValue();
    this.saveEdit.emit({
      id: personId,
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
    this.editError.set(message);
  }
}
