import { Component, Input, computed } from '@angular/core';
import type { MobilizationReport } from '../../../../models/readiness.model';
import { MOBILIZATION_THRESHOLDS, getThresholdColor, calcRate, fmtPct, THRESHOLD_HEX } from '../../../../models/readiness.model';

interface ChartRow {
  team_name: string;
  pct: number;
  width: number;
  color: string;
  showInside: boolean;
}

@Component({
  selector: 'app-mobilization-chart',
  standalone: true,
  templateUrl: './mobilization-chart.component.html',
  styleUrl: './mobilization-chart.component.scss',
})
export class MobilizationChartComponent {
  @Input({ required: true }) reports: MobilizationReport[] = [];

  rows(): ChartRow[] {
    return [...this.reports]
      .map(r => {
        const pct = calcRate(r.reported, r.authorized_strength);
        return {
          team_name: r.team_name,
          pct,
          width: Math.max(pct, 2),                                       // min 2% so it's visible
          color: THRESHOLD_HEX[getThresholdColor(pct, MOBILIZATION_THRESHOLDS)],
          showInside: pct > 25,
        };
      })
      .sort((a, b) => a.pct - b.pct);
  }

  fmtPct = fmtPct;
}
