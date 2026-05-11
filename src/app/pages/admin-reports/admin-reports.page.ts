import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

import { AdminReportsService } from '../../services/admin-reports.service';
import type { TeamStats, ReportsPreset } from '../../models/admin-reports.model';
import { PRESET_LABELS, getDateRange } from '../../models/admin-reports.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [IonContent, IonSpinner],
  templateUrl: './admin-reports.page.html',
  styleUrl: './admin-reports.page.scss',
})
export class AdminReportsPage {
  private adminReports = inject(AdminReportsService);
  private router = inject(Router);

  presetLabels = PRESET_LABELS;
  presetOrder: ReportsPreset[] = ['today', 'week', 'month', 'custom'];

  preset = signal<ReportsPreset>('today');
  customFrom = signal<string>('');
  customTo = signal<string>('');

  teams = signal<TeamStats[]>([]);
  fetching = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  dateRange = computed<{ from: string; to: string } | null>(() => {
    if (this.preset() === 'custom') {
      const f = this.customFrom();
      const t = this.customTo();
      return (f && t) ? { from: f, to: t } : null;
    }
    return getDateRange(this.preset());
  });

  totals = computed(() => {
    return this.teams().reduce(
      (acc, t) => ({
        completed_missions: acc.completed_missions + t.completed_missions,
        scheduled_missions: acc.scheduled_missions + t.scheduled_missions,
        active_missions:    acc.active_missions    + t.active_missions,
        unique_trucks:      acc.unique_trucks      + t.unique_trucks,
        unique_people:      acc.unique_people      + t.unique_people,
      }),
      { completed_missions: 0, scheduled_missions: 0, active_missions: 0, unique_trucks: 0, unique_people: 0 },
    );
  });

  hasTeams = computed(() => this.teams().length > 0);
  showCustomDates = computed(() => this.preset() === 'custom');

  constructor() {
    // Re-fetch when dateRange changes
    effect(() => {
      const range = this.dateRange();
      // For 'custom' with one date missing, range will be null — that's expected, just don't fetch
      if (this.preset() === 'custom' && range === null) {
        // No fetch — wait for both dates
        return;
      }
      this.fetch(range);
    });
  }

  fetch(range: { from: string; to: string } | null): void {
    this.fetching.set(true);
    this.errorMessage.set(null);
    this.adminReports.fetchReports(range).subscribe({
      next: ({ teams }) => {
        this.teams.set(teams ?? []);
        this.fetching.set(false);
      },
      error: e => {
        this.errorMessage.set(e instanceof Error ? e.message : 'Unknown error');
        this.fetching.set(false);
      },
    });
  }

  retry(): void { this.fetch(this.dateRange()); }

  onPreset(p: ReportsPreset): void { this.preset.set(p); }

  onCustomFrom(value: string): void { this.customFrom.set(value); }
  onCustomTo(value: string): void { this.customTo.set(value); }

  goToTeam(teamId: string): void {
    this.router.navigate(['/'], { queryParams: { team: teamId } });
  }

  exportCsv(): void {
    this.adminReports.exportCsv(this.teams(), this.dateRange());
  }
}
