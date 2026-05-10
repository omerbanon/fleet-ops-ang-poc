import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { IonSpinner, IonButton } from '@ionic/angular/standalone';
import type { MobilizationReport, MobilizationField } from '../../../../models/readiness.model';
import {
  MOBILIZATION_LABELS, MOBILIZATION_FIELDS, MOBILIZATION_THRESHOLDS,
  THRESHOLD_STYLES, getThresholdColor, calcRate, fmtPct,
} from '../../../../models/readiness.model';
import { MobilizationChartComponent } from '../mobilization-chart/mobilization-chart.component';
import { CommanderService } from '../../../../services/commander.service';

interface DraftRow { team_id: string; team_name: string; values: Record<MobilizationField, number>; }

@Component({
  selector: 'app-mobilization-section',
  standalone: true,
  imports: [IonSpinner, IonButton, MobilizationChartComponent],
  templateUrl: './mobilization-section.component.html',
  styleUrl: './mobilization-section.component.scss',
})
export class MobilizationSectionComponent {
  private commanderService = inject(CommanderService);

  @Input({ required: true }) reports: MobilizationReport[] = [];
  @Input({ required: true }) teams: { id: string; name: string }[] = [];
  @Input({ required: true }) reportDate = '';
  @Input() isReadOnly = false;
  @Output() saved = new EventEmitter<void>();
  @Output() editingChange = new EventEmitter<boolean>();

  readonly fields = MOBILIZATION_FIELDS;
  readonly labels = MOBILIZATION_LABELS;

  editing = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  draft = signal<DraftRow[]>([]);

  // Aggregated summary values (totals across teams)
  totals = computed(() => {
    let auth = 0, manning = 0, reported = 0;
    for (const r of this.reports) {
      auth += r.authorized_strength;
      manning += r.current_manning;
      reported += r.reported;
    }
    const reportedRate = calcRate(reported, auth);
    return { auth, manning, reported, reportedRate };
  });

  hasData = computed(() => this.reports.length > 0);

  enterEdit(): void {
    if (this.isReadOnly) return;
    const rows: DraftRow[] = this.teams.map(team => {
      const existing = this.reports.find(r => r.team_id === team.id);
      return {
        team_id: team.id,
        team_name: team.name,
        values: {
          authorized_strength: existing?.authorized_strength ?? 0,
          current_manning: existing?.current_manning ?? 0,
          called_up: existing?.called_up ?? 0,
          reported: existing?.reported ?? 0,
          exemptions: existing?.exemptions ?? 0,
          external_screening: existing?.external_screening ?? 0,
          deployed_screening: existing?.deployed_screening ?? 0,
          idf_wide: existing?.idf_wide ?? 0,
        },
      };
    });
    this.draft.set(rows);
    this.editing.set(true);
    this.editingChange.emit(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.errorMessage.set(null);
    this.editingChange.emit(false);
  }

  setDraftValue(teamId: string, field: MobilizationField, value: number): void {
    const v = isFinite(value) && value >= 0 ? value : 0;
    this.draft.set(this.draft().map(d =>
      d.team_id === teamId ? { ...d, values: { ...d.values, [field]: v } } : d
    ));
  }

  draftTotals(): { reported: number; manning: number; auth: number } {
    let auth = 0, manning = 0, reported = 0;
    for (const r of this.draft()) {
      auth += r.values.authorized_strength;
      manning += r.values.current_manning;
      reported += r.values.reported;
    }
    return { auth, manning, reported };
  }

  save(): void {
    this.saving.set(true);
    this.errorMessage.set(null);
    const rows = this.draft();
    let pending = rows.length;
    let anyError = false;
    if (pending === 0) { this.saving.set(false); this.editing.set(false); this.editingChange.emit(false); this.saved.emit(); return; }
    for (const row of rows) {
      this.commanderService.saveMobilization(row.team_id, this.reportDate, row.values).subscribe({
        next: () => { pending--; if (pending === 0) this.afterSave(anyError); },
        error: () => { anyError = true; pending--; if (pending === 0) this.afterSave(anyError); },
      });
    }
  }

  private afterSave(anyError: boolean): void {
    this.saving.set(false);
    if (anyError) {
      this.errorMessage.set('שגיאה בשמירת נתוני כוננות');
      return;
    }
    this.editing.set(false);
    this.editingChange.emit(false);
    this.saved.emit();
  }

  // ── View-mode helpers ──────────────────────────────────────────────────────

  viewRows(): MobilizationReport[] {
    // Sort by reported descending; ties broken by team_name
    return [...this.reports].sort((a, b) => b.reported - a.reported || a.team_name.localeCompare(b.team_name));
  }

  pctManning(r: MobilizationReport): number { return calcRate(r.reported, r.current_manning); }
  pctAuthorized(r: MobilizationReport): number { return calcRate(r.reported, r.authorized_strength); }

  pctStyle(rate: number): { background: string; color: string } {
    const lvl = getThresholdColor(rate, MOBILIZATION_THRESHOLDS);
    const s = THRESHOLD_STYLES[lvl];
    return { background: s.bg, color: s.text };
  }

  fmtPct = fmtPct;

  // ── Aggregated view mode totals row ────────────────────────────────────────
  totalsRow(): Record<MobilizationField, number> {
    const out: Record<MobilizationField, number> = {
      authorized_strength: 0, current_manning: 0, called_up: 0, reported: 0,
      exemptions: 0, external_screening: 0, deployed_screening: 0, idf_wide: 0,
    };
    for (const r of this.reports) {
      for (const f of this.fields) out[f] += r[f];
    }
    return out;
  }
}
