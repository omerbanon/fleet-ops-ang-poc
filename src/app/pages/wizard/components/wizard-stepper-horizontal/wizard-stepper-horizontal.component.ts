import { Component, EventEmitter, Input, Output } from '@angular/core';

const STEPS = [
  { num: 5, label: 'סיכום' },
  { num: 6, label: 'הפקה' },
];

@Component({
  selector: 'app-wizard-stepper-horizontal',
  standalone: true,
  templateUrl: './wizard-stepper-horizontal.component.html',
  styleUrl: './wizard-stepper-horizontal.component.scss',
})
export class WizardStepperHorizontalComponent {
  @Input() currentStep = 5;
  @Input() completedSteps: number[] = [];
  @Output() stepClick = new EventEmitter<number>();

  steps = STEPS;

  isClickable(num: number): boolean {
    return this.completedSteps.includes(num) || num === this.currentStep;
  }

  onClick(num: number): void {
    if (!this.isClickable(num)) return;
    this.stepClick.emit(num);
  }
}
