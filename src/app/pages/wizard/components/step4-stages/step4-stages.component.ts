import { Component, EventEmitter, Input, Output, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/angular/standalone';

import type {
  WizardMissionData,
  WizardStage,
  StageAction,
} from '../../../../models/wizard.model';
import {
  STAGE_ACTIONS,
  STAGE_ACTION_LABELS,
  BUFFER_SUGGESTION,
  STAGE_NAMES,
  INVERSE_ACTION,
  isStep4Valid,
  getStageName,
} from '../../../../models/wizard.model';
import { addMinutesToTime, recomputeChain } from '../../../../utils/wizard-time.util';
import { WizardService } from '../../../../services/wizard.service';

@Component({
  selector: 'app-step4-stages',
  standalone: true,
  imports: [FormsModule, IonInput, IonSelect, IonSelectOption, IonButton],
  templateUrl: './step4-stages.component.html',
  styleUrl: './step4-stages.component.scss',
})
export class Step4StagesComponent implements OnInit {
  private wizardService = inject(WizardService);

  @Input({ required: true }) missionData!: WizardMissionData;
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  stageActions = STAGE_ACTIONS;
  stageActionLabels = STAGE_ACTION_LABELS;
  bufferSuggestion = BUFFER_SUGGESTION;
  stageNames = STAGE_NAMES;

  expandedStageIndex = signal<number>(0);
  showMapModal = signal<boolean>(false);

  canProceed = computed(() => isStep4Valid(this.missionData));

  ngOnInit(): void {
    if (this.missionData.stages.length === 0) {
      this.addStage();
    }
  }

  expanded(i: number): boolean { return this.expandedStageIndex() === i; }

  toggleExpand(i: number): void {
    this.expandedStageIndex.update(curr => curr === i ? -1 : i);
  }

  bufferLabel(action: StageAction): number {
    return BUFFER_SUGGESTION[action] ?? 0;
  }

  addStage(): void {
    const stages = this.missionData.stages;
    const order = stages.length + 1;
    const prev = stages.length > 0 ? stages[stages.length - 1] : null;
    const action: StageAction = prev ? INVERSE_ACTION[prev.action] : 'departure';
    const seedDeparture = prev?.arrivalTime
      ? addMinutesToTime(prev.arrivalTime, prev.bufferMinutes ?? 0)
      : '';
    const newStage: WizardStage = {
      order,
      name: getStageName(order),
      action,
      origin: prev?.destination ?? '',
      destination: '',
      cargo: prev?.cargo ?? '',
      contactName: '',
      contactPhone: '',
      departureTime: seedDeparture,
      arrivalTime: '',
      bufferMinutes: BUFFER_SUGGESTION[action] ?? 0,
      routes: { primary: null, backup: null },
    };
    this.wizardService.setStages([...stages, newStage]);
    this.expandedStageIndex.set(order - 1);
  }

  removeStage(index: number): void {
    if (this.missionData.stages.length <= 1) return;
    const next = this.missionData.stages.filter((_, i) => i !== index);
    this.wizardService.setStages(next.map((s, i) => ({ ...s, order: i + 1, name: getStageName(i + 1) })));
    if (this.expandedStageIndex() >= next.length) this.expandedStageIndex.set(next.length - 1);
  }

  updateStage(index: number, partial: Partial<WizardStage>): void {
    const next = this.missionData.stages.map((s, i) => i === index ? { ...s, ...partial } : s);
    this.wizardService.setStages(recomputeChain(next, index));
  }

  onActionChange(index: number, action: StageAction): void {
    this.updateStage(index, { action, bufferMinutes: BUFFER_SUGGESTION[action] ?? 0 });
  }

  resetBuffer(index: number): void {
    const stage = this.missionData.stages[index];
    this.updateStage(index, { bufferMinutes: BUFFER_SUGGESTION[stage.action] ?? 0 });
  }

  toggleMapModal(): void { this.showMapModal.update(v => !v); }

  onSubmit(): void { if (this.canProceed()) this.next.emit(); }
  onBack(): void { this.back.emit(); }
}
