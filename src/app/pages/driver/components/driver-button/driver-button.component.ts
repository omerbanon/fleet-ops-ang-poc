import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import type { DriverStage, DriverStageAction } from '../../../../models/driver.model';
import { getDriverActionLabel } from '../../../../models/driver.model';
import type { MissionStatus } from '../../../../models/mission.model';

@Component({
  selector: 'app-driver-button',
  standalone: true,
  imports: [IonSpinner],
  templateUrl: './driver-button.component.html',
  styleUrl: './driver-button.component.scss',
})
export class DriverButtonComponent {
  @Input({ required: true }) viewedStage: DriverStage | null = null;
  @Input({ required: true }) isViewingCurrentStage = false;
  @Input({ required: true }) allCompleted = false;
  @Input({ required: true }) missionStatus: MissionStatus = 'scheduled';
  @Input({ required: true }) advancing = false;
  @Output() advance = new EventEmitter<void>();

  /** Returns { label, disabled, success } per spec table. */
  resolveButton(): { label: string; disabled: boolean; success: boolean } {
    const stage = this.viewedStage;
    if (this.missionStatus === 'draft') return { label: 'המשימה עדיין לא אושרה', disabled: true, success: false };
    if (this.missionStatus === 'cancelled') return { label: 'המשימה בוטלה', disabled: true, success: false };
    if (this.allCompleted) return { label: 'המשימה הושלמה', disabled: true, success: true };
    if (this.advancing) return { label: 'מעדכן…', disabled: true, success: false };

    if (!stage) return { label: 'הושלם', disabled: true, success: false };

    if (!this.isViewingCurrentStage) {
      if (stage.stage_status === 'completed') return { label: 'הושלם', disabled: true, success: true };
      // pending future stage
      const lab = getDriverActionLabel(stage.action) || stage.action;
      return { label: lab, disabled: true, success: false };
    }

    if (stage.stage_status === 'pending') return { label: 'יצאתי', disabled: false, success: false };

    if (stage.stage_status === 'departed') {
      if (stage.action === 'departure') return { label: 'הגעתי ליעד', disabled: false, success: false };
      if (stage.action === 'return') return { label: 'הגעתי לבסיס', disabled: false, success: false };
      const lab = getDriverActionLabel(stage.action);
      if (lab) return { label: `${lab} הושלמה`, disabled: false, success: false };
      return { label: 'הושלם', disabled: false, success: false };
    }

    return { label: 'הושלם', disabled: true, success: true };
  }

  onClick(): void {
    const r = this.resolveButton();
    if (r.disabled) return;
    this.advance.emit();
  }
}
