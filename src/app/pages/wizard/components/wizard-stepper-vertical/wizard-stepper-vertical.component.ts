import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Phase {
  index: number;        // 0-based
  label: string;
  steps: number[];
}

const PHASES: Phase[] = [
  { index: 0, label: 'פרטי משימה', steps: [1, 2] },
  { index: 1, label: 'כוח אדם', steps: [3] },
  { index: 2, label: 'שלבי משימה', steps: [4] },
  { index: 3, label: 'סיכום והפקה', steps: [5, 6] },
];

@Component({
  selector: 'app-wizard-stepper-vertical',
  standalone: true,
  templateUrl: './wizard-stepper-vertical.component.html',
  styleUrl: './wizard-stepper-vertical.component.scss',
})
export class WizardStepperVerticalComponent {
  @Input() currentStep = 1;
  @Input() completedSteps: number[] = [];
  @Output() stepClick = new EventEmitter<number>();

  phases = PHASES;

  isPhaseComplete(phase: Phase): boolean {
    return phase.steps.every(s => this.completedSteps.includes(s));
  }

  isPhaseActive(phase: Phase): boolean {
    return phase.steps.includes(this.currentStep);
  }

  isPhaseClickable(phase: Phase): boolean {
    return this.isPhaseComplete(phase) || this.isPhaseActive(phase);
  }

  onPhaseClick(phase: Phase): void {
    if (!this.isPhaseClickable(phase)) return;
    // Click jumps to first step in the phase that's accessible
    const target = phase.steps.find(s => this.completedSteps.includes(s) || s === this.currentStep) ?? phase.steps[0];
    this.stepClick.emit(target);
  }
}
