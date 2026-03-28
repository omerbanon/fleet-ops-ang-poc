import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { PersonService } from '../../services/person.service';
import type { Person, PersonStatus } from '../../models/person.model';
import { isAtBase } from '../../models/person.model';
import { PeopleSummaryComponent } from './components/people-summary/people-summary.component';
import { PeopleTableComponent } from './components/people-table/people-table.component';
import { PersonFormComponent, type PersonFormData } from './components/person-form/person-form.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner,
    PeopleSummaryComponent, PeopleTableComponent, PersonFormComponent, ConfirmModalComponent,
  ],
  templateUrl: './people.page.html',
  styleUrl: './people.page.scss',
})
export class PeoplePage {
  private personService = inject(PersonService);

  private people = toSignal(this.personService.people$, { initialValue: [] as Person[] });
  private loading = toSignal(this.personService.loading$, { initialValue: true });

  personForm = viewChild<PersonFormComponent>('personForm');
  atBaseTable = viewChild<PeopleTableComponent>('atBaseTable');

  isLoading = computed(() => this.loading());

  atBasePeople = computed(() =>
    this.people()
      .filter(isAtBase)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'))
  );

  notAtBasePeople = computed(() =>
    this.people()
      .filter(p => !isAtBase(p))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'))
  );

  atBaseCount = computed(() => this.atBasePeople().length);
  notAtBaseCount = computed(() => this.notAtBasePeople().length);
  homeCount = computed(() => this.people().filter(p => p.status === 'home').length);
  onTaskCount = computed(() => this.people().filter(p => p.status === 'on_task').length);

  showAddForm = signal(false);
  editingPersonId = signal<string | null>(null);
  deleteTarget = signal<Person | null>(null);
  statusWarning = signal<{ person: Person; newStatus: PersonStatus } | null>(null);

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
  }

  async onAdd(data: PersonFormData): Promise<void> {
    const form = this.personForm();
    if (!form) return;

    form.setSubmitting(true);
    form.setError(null);

    const { error } = await this.personService.addPerson({
      ...data,
      team_id: 'team-001',
    });

    if (error) {
      form.setError(error);
      form.setSubmitting(false);
      return;
    }

    form.reset();
    this.showAddForm.set(false);
  }

  onStartEdit(personId: string): void {
    this.editingPersonId.set(personId);
  }

  onCancelEdit(): void {
    this.editingPersonId.set(null);
  }

  async onSaveEdit(data: { id: string; full_name: string; role: string; phone: string; status: PersonStatus; return_date: string | null; rank: string | null; has_weapon: boolean; vehicle_license_class: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; notes: string | null }): Promise<void> {
    const { error } = await this.personService.updatePerson(data.id, {
      full_name: data.full_name,
      role: data.role as Person['role'],
      phone: data.phone,
      status: data.status,
      return_date: data.return_date,
      rank: data.rank,
      has_weapon: data.has_weapon,
      vehicle_license_class: data.vehicle_license_class,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      notes: data.notes,
    });

    if (error) {
      this.atBaseTable()?.setError(error);
      return;
    }

    this.editingPersonId.set(null);
  }

  onRequestDelete(person: Person): void {
    this.deleteTarget.set(person);
  }

  async confirmDelete(): Promise<void> {
    const person = this.deleteTarget();
    if (!person) return;

    const { error } = await this.personService.deletePerson(person.id);

    if (error) {
      this.deleteTarget.set(null);
      alert(error);
      return;
    }

    this.deleteTarget.set(null);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  onRequestStatusChange(event: { person: Person; newStatus: PersonStatus }): void {
    this.statusWarning.set(event);
  }

  async confirmStatusChange(): Promise<void> {
    const warning = this.statusWarning();
    if (!warning) return;

    this.statusWarning.set(null);
    this.atBaseTable()?.emitSave(warning.person.id);
  }

  cancelStatusChange(): void {
    this.statusWarning.set(null);
  }
}
