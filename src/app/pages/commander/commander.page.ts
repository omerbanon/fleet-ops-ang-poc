import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner } from '@ionic/angular/standalone';

import { CommanderAccessService } from '../../services/commander-access.service';
import { CommanderService } from '../../services/commander.service';
import { MissionService } from '../../services/mission.service';
import { VisibilityPollingService } from '../../services/visibility-polling.service';

import type { Mission, MissionStatus } from '../../models/mission.model';
import { getTodayStr } from '../../models/mission.model';
import type { TeamTotal, CommanderMissionsResponse } from '../../models/commander.model';
import type { MobilizationReport, EquipmentReport, EquipmentCategory } from '../../models/readiness.model';

import { CommanderSummaryComponent } from './components/commander-summary/commander-summary.component';
import { MobilizationSectionComponent } from './components/mobilization-section/mobilization-section.component';
import { EquipmentSectionComponent } from './components/equipment-section/equipment-section.component';

import { SummaryBarComponent } from '../dashboard/components/summary-bar/summary-bar.component';
import { MissionListComponent } from '../dashboard/components/mission-list/mission-list.component';
import { CompletionModalComponent } from '../dashboard/components/completion-modal/completion-modal.component';
import { ConfettiComponent } from '../dashboard/components/confetti/confetti.component';

const POLL_INTERVAL_MS = 60_000;

type PageState = 'loading' | 'ready' | 'error' | 'denied';

@Component({
  selector: 'app-commander',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner,
    CommanderSummaryComponent,
    MobilizationSectionComponent,
    EquipmentSectionComponent,
    SummaryBarComponent,
    MissionListComponent,
    CompletionModalComponent,
    ConfettiComponent,
  ],
  templateUrl: './commander.page.html',
  styleUrl: './commander.page.scss',
})
export class CommanderPage implements OnInit, OnDestroy {
  private accessService = inject(CommanderAccessService);
  private commanderService = inject(CommanderService);
  private missionService = inject(MissionService);
  private visibility = inject(VisibilityPollingService);

  access = toSignal(this.accessService.access$, { initialValue: { hasAccess: true, isReadOnly: false } });

  state = signal<PageState>('loading');
  missions = signal<Mission[]>([]);
  teamTotals = signal<TeamTotal[]>([]);
  teams = signal<{ id: string; name: string }[]>([]);

  reportDate = signal<string>(getTodayStr());
  mobilizationReports = signal<MobilizationReport[]>([]);
  equipmentReports = signal<EquipmentReport[]>([]);
  equipmentCategories = signal<EquipmentCategory[]>([]);
  readinessLoading = signal(false);

  selectedTeamId = signal<string | null>(null);
  expandedMissionId = signal<string | null>(null);

  readinessEditingActive = signal(false);

  showConfetti = signal(false);
  completionMission = signal<Mission | null>(null);

  // Drill-down view
  drilledTeam = computed(() => {
    const id = this.selectedTeamId();
    if (!id) return null;
    return this.teams().find(t => t.id === id) ?? null;
  });
  drilledMissions = computed(() => {
    const id = this.selectedTeamId();
    if (!id) return [];
    return this.missions().filter(m => m.team_id === id);
  });
  drilledTotal = computed<TeamTotal | null>(() => {
    const id = this.selectedTeamId();
    return id ? (this.teamTotals().find(t => t.team_id === id) ?? null) : null;
  });

  isReadOnly = computed(() => this.access().isReadOnly);

  private stopPolling: (() => void) | null = null;

  ngOnInit(): void {
    if (!this.access().hasAccess) {
      this.state.set('denied');
      return;
    }
    this.fetchData();
    this.fetchReadiness();
    this.stopPolling = this.visibility.start(
      () => this.fetchData(/* silent */ true),
      POLL_INTERVAL_MS,
      () => this.state() === 'ready' && !this.readinessEditingActive(),
    );
  }

  ngOnDestroy(): void {
    if (this.stopPolling) this.stopPolling();
  }

  private fetchData(silent = false): void {
    if (!silent) this.state.set('loading');
    let pending = 2;
    let anyError = false;
    const done = () => {
      pending--;
      if (pending === 0) {
        this.state.set(anyError ? 'error' : 'ready');
      }
    };
    this.commanderService.fetchMissions().subscribe({
      next: (resp: CommanderMissionsResponse) => {
        this.missions.set(resp.missions);
        this.teams.set(resp.teams);
        done();
      },
      error: () => { anyError = true; done(); },
    });
    this.commanderService.fetchTotals().subscribe({
      next: ({ teams }) => { this.teamTotals.set(teams); done(); },
      error: () => { anyError = true; done(); },
    });
  }

  retry(): void { this.fetchData(); }

  fetchReadiness(): void {
    if (this.readinessEditingActive()) return;
    this.readinessLoading.set(true);
    let pending = 3;
    const done = () => { pending--; if (pending === 0) this.readinessLoading.set(false); };
    const date = this.reportDate();
    this.commanderService.fetchMobilization(date).subscribe({
      next: ({ reports }) => { this.mobilizationReports.set(reports); done(); },
      error: () => done(),
    });
    this.commanderService.fetchEquipment(date).subscribe({
      next: ({ reports }) => { this.equipmentReports.set(reports); done(); },
      error: () => done(),
    });
    this.commanderService.fetchEquipmentCategories().subscribe({
      next: ({ categories }) => { this.equipmentCategories.set(categories); done(); },
      error: () => done(),
    });
  }

  onReportDateChange(value: string): void {
    this.reportDate.set(value);
    this.fetchReadiness();
  }

  onReadinessEditingChange(editing: boolean): void {
    this.readinessEditingActive.set(editing);
  }

  onSelectTeam(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.expandedMissionId.set(null);
  }

  onBackToOverview(): void {
    this.selectedTeamId.set(null);
    this.expandedMissionId.set(null);
  }

  onToggleExpand(missionId: string): void {
    this.expandedMissionId.update(curr => curr === missionId ? null : missionId);
  }

  onStartMission(m: Mission): void {
    this.changeStatus(m, 'active');
  }

  onCompleteMission(m: Mission): void {
    this.changeStatus(m, 'completed').then(() => {
      this.completionMission.set(m);
      this.showConfetti.set(true);
      setTimeout(() => this.showConfetti.set(false), 3500);
    });
  }

  onCancelMission(m: Mission): void {
    this.changeStatus(m, 'cancelled');
  }

  closeCompletionModal(): void {
    this.completionMission.set(null);
  }

  private async changeStatus(m: Mission, status: MissionStatus): Promise<void> {
    await this.missionService.changeMissionStatus(m.id, status);
    // Refetch missions (totals don't change on status change)
    this.commanderService.fetchMissions().subscribe({
      next: resp => {
        this.missions.set(resp.missions);
      },
    });
  }
}
