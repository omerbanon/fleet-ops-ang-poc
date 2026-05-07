import { Component, EventEmitter, Input, Output, computed, input } from '@angular/core';
import type { DriverStage } from '../../../../models/driver.model';
import { getDriverActionLabel } from '../../../../models/driver.model';
import { HEB_LETTERS } from '../../../../models/mission.model';

@Component({
  selector: 'app-stage-card',
  standalone: true,
  templateUrl: './stage-card.component.html',
  styleUrl: './stage-card.component.scss',
})
export class StageCardComponent {
  @Input({ required: true }) stage!: DriverStage;
  @Input({ required: true }) stageIndex = 0;
  @Input({ required: true }) totalStages = 0;
  @Output() navigate = new EventEmitter<void>();

  hebLetter(index: number): string {
    return HEB_LETTERS[index] ?? `${index + 1}.`;
  }

  actionLabel(action: string): string {
    return getDriverActionLabel(action as Parameters<typeof getDriverActionLabel>[0]);
  }

  onNavigate(): void { if (this.stage.maps_url) this.navigate.emit(); }
}
