import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { DriverStage } from '../../../../models/driver.model';

@Component({
  selector: 'app-stage-progress',
  standalone: true,
  templateUrl: './stage-progress.component.html',
  styleUrl: './stage-progress.component.scss',
})
export class StageProgressComponent {
  @Input({ required: true }) stages: DriverStage[] = [];
  @Input({ required: true }) viewedIndex = 0;
  @Input({ required: true }) currentStageIndex = 0;
  @Output() stageSelect = new EventEmitter<number>();

  isCompleted(i: number): boolean { return this.stages[i]?.stage_status === 'completed'; }
  isActive(i: number): boolean { return this.stages[i]?.stage_status === 'departed'; }
  isViewed(i: number): boolean { return i === this.viewedIndex; }
  isConnectorComplete(i: number): boolean { return this.isCompleted(i); }

  onClick(i: number): void { this.stageSelect.emit(i); }
}
