import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/angular/standalone';

import type { WizardMissionData, MissionType } from '../../../../models/wizard.model';
import { MISSION_TYPES, isStep1Valid } from '../../../../models/wizard.model';
import type { Person } from '../../../../models/person.model';
import { WizardService } from '../../../../services/wizard.service';

@Component({
  selector: 'app-step1-basics',
  standalone: true,
  imports: [FormsModule, IonInput, IonSelect, IonSelectOption, IonButton],
  templateUrl: './step1-basics.component.html',
  styleUrl: './step1-basics.component.scss',
})
export class Step1BasicsComponent {
  private wizardService = inject(WizardService);

  @Input({ required: true }) missionData!: WizardMissionData;
  @Input() people: Person[] = [];
  @Output() next = new EventEmitter<void>();

  missionTypes = MISSION_TYPES;

  get name(): string { return this.missionData.missionBasics.name; }
  get date(): string { return this.missionData.missionBasics.date; }
  get type(): MissionType { return this.missionData.missionBasics.type; }
  get commanderId(): string { return this.missionData.missionBasics.commander?.id ?? ''; }

  commanders = computed(() => this.people.filter(p => p.role === 'commander'));

  canProceed = signal<boolean>(false);

  ngOnInit(): void {
    this.canProceed.set(isStep1Valid(this.missionData));
  }

  onNameChange(value: string): void {
    this.wizardService.updateMissionBasics({ name: value });
    this.refreshValid();
  }

  onDateChange(value: string): void {
    this.wizardService.updateMissionBasics({ date: value });
    this.refreshValid();
  }

  onTypeChange(value: MissionType): void {
    this.wizardService.updateMissionBasics({ type: value });
    this.refreshValid();
  }

  onCommanderChange(personId: string): void {
    const p = this.people.find(x => x.id === personId);
    if (!p) return;
    this.wizardService.updateMissionBasics({
      commander: { id: p.id, name: p.full_name, phone: p.phone },
    });
    this.refreshValid();
  }

  private refreshValid(): void {
    this.canProceed.set(isStep1Valid(this.wizardService.state.missionData));
  }

  onSubmit(): void {
    if (!this.canProceed()) return;
    this.next.emit();
  }
}
