import { Component, Input, computed, signal } from '@angular/core';
import { EQUIPMENT_THRESHOLDS, getThresholdColor, fmtPct, calcRate, THRESHOLD_HEX } from '../../../../models/readiness.model';

// 270° SVG arc gauge — port of EquipmentGauge.tsx
const RADIUS = 45;
const STROKE = 10;
const VIEWBOX = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_RATIO = 0.75;       // 270° = 3/4 of full circle
const ARC_LENGTH = CIRCUMFERENCE * ARC_RATIO;

@Component({
  selector: 'app-equipment-gauge',
  standalone: true,
  templateUrl: './equipment-gauge.component.html',
  styleUrl: './equipment-gauge.component.scss',
})
export class EquipmentGaugeComponent {
  @Input({ required: true }) operational = 0;
  @Input({ required: true }) authorized = 0;
  @Input() label = '';

  readonly cx = VIEWBOX / 2;
  readonly cy = VIEWBOX / 2;
  readonly r = RADIUS;
  readonly strokeWidth = STROKE;
  readonly viewBox = `0 0 ${VIEWBOX} ${VIEWBOX}`;
  // Background arc: full 270°
  readonly bgDashArray = `${ARC_LENGTH} ${CIRCUMFERENCE}`;

  rate(): number { return calcRate(this.operational, this.authorized); }
  percentLabel(): string { return fmtPct(this.rate()); }
  color(): string { return THRESHOLD_HEX[getThresholdColor(this.rate(), EQUIPMENT_THRESHOLDS)]; }

  // Foreground arc length proportional to rate
  fgDashArray(): string {
    const filled = (Math.min(100, Math.max(0, this.rate())) / 100) * ARC_LENGTH;
    return `${filled} ${CIRCUMFERENCE}`;
  }

  // Rotate the SVG so the gap (90°) is at the bottom
  readonly rotateDeg = 135;
}
