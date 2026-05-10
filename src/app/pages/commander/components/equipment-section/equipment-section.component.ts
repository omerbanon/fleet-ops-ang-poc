import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { IonSpinner, IonButton } from '@ionic/angular/standalone';
import type { EquipmentCategory, EquipmentReport, EquipmentField } from '../../../../models/readiness.model';
import {
  EQUIPMENT_LABELS, EQUIPMENT_FIELDS, EQUIPMENT_THRESHOLDS,
  THRESHOLD_STYLES, getThresholdColor, calcRate, fmtPct,
} from '../../../../models/readiness.model';
import { EquipmentGaugeComponent } from '../equipment-gauge/equipment-gauge.component';
import { CommanderService } from '../../../../services/commander.service';

interface DraftRow { team_id: string; team_name: string; values: Record<EquipmentField, number>; }

@Component({
  selector: 'app-equipment-section',
  standalone: true,
  imports: [IonSpinner, IonButton, EquipmentGaugeComponent],
  templateUrl: './equipment-section.component.html',
  styleUrl: './equipment-section.component.scss',
})
export class EquipmentSectionComponent {
  private commanderService = inject(CommanderService);

  @Input({ required: true }) reports: EquipmentReport[] = [];
  @Input({ required: true }) categories: EquipmentCategory[] = [];
  @Input({ required: true }) teams: { id: string; name: string }[] = [];
  @Input({ required: true }) reportDate = '';
  @Input() isReadOnly = false;
  @Output() saved = new EventEmitter<void>();
  @Output() editingChange = new EventEmitter<boolean>();

  readonly fields = EQUIPMENT_FIELDS;
  readonly labels = EQUIPMENT_LABELS;

  selectedCategoryId = signal<string | null>(null);
  editing = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  draft = signal<DraftRow[]>([]);

  hasData = computed(() => this.reports.length > 0);

  // Aggregated gauge totals per category (sum across teams for the active date)
  gaugeData(): Array<{ id: string; name: string; operational: number; authorized: number }> {
    return this.categories.map(cat => {
      let operational = 0, authorized = 0;
      for (const r of this.reports) {
        if (r.category_id !== cat.id) continue;
        operational += r.operational;
        authorized += r.authorized;
      }
      return { id: cat.id, name: cat.name, operational, authorized };
    });
  }

  selectCategory(id: string): void {
    if (this.editing()) this.cancelEdit();
    this.selectedCategoryId.set(id);
  }

  activeCategoryId(): string | null {
    return this.selectedCategoryId() ?? this.categories[0]?.id ?? null;
  }

  activeCategoryName(): string {
    const id = this.activeCategoryId();
    return this.categories.find(c => c.id === id)?.name ?? '';
  }

  // Reports for the active category
  rowsForActive(): EquipmentReport[] {
    const id = this.activeCategoryId();
    if (!id) return [];
    return this.reports.filter(r => r.category_id === id).sort((a, b) => a.team_name.localeCompare(b.team_name));
  }

  totalsForActive(): Record<EquipmentField, number> {
    const out: Record<EquipmentField, number> = { authorized: 0, manned: 0, operational: 0, faults: 0 };
    for (const r of this.rowsForActive()) {
      for (const f of this.fields) out[f] += r[f];
    }
    return out;
  }

  pctOperational(r: EquipmentReport): number { return calcRate(r.operational, r.authorized); }

  pctStyle(rate: number): { background: string; color: string } {
    const lvl = getThresholdColor(rate, EQUIPMENT_THRESHOLDS);
    const s = THRESHOLD_STYLES[lvl];
    return { background: s.bg, color: s.text };
  }

  fmtPct = fmtPct;

  // ── Edit mode ──────────────────────────────────────────────────────────────

  enterEdit(): void {
    if (this.isReadOnly) return;
    const catId = this.activeCategoryId();
    if (!catId) return;
    const rows: DraftRow[] = this.teams.map(team => {
      const existing = this.reports.find(r => r.team_id === team.id && r.category_id === catId);
      return {
        team_id: team.id,
        team_name: team.name,
        values: {
          authorized: existing?.authorized ?? 0,
          manned: existing?.manned ?? 0,
          operational: existing?.operational ?? 0,
          faults: existing?.faults ?? 0,
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

  setDraftValue(teamId: string, field: EquipmentField, value: number): void {
    const v = isFinite(value) && value >= 0 ? value : 0;
    this.draft.set(this.draft().map(d =>
      d.team_id === teamId ? { ...d, values: { ...d.values, [field]: v } } : d
    ));
  }

  save(): void {
    const catId = this.activeCategoryId();
    if (!catId) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    const rows = this.draft();
    let pending = rows.length;
    let anyError = false;
    if (pending === 0) { this.saving.set(false); this.editing.set(false); this.editingChange.emit(false); this.saved.emit(); return; }
    for (const row of rows) {
      this.commanderService.saveEquipment(row.team_id, catId, this.reportDate, row.values).subscribe({
        next: () => { pending--; if (pending === 0) this.afterSave(anyError); },
        error: () => { anyError = true; pending--; if (pending === 0) this.afterSave(anyError); },
      });
    }
  }

  private afterSave(anyError: boolean): void {
    this.saving.set(false);
    if (anyError) {
      this.errorMessage.set('שגיאה בשמירת נתוני אמצעים');
      return;
    }
    this.editing.set(false);
    this.editingChange.emit(false);
    this.saved.emit();
  }
}
