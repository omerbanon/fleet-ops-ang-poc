import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonSpinner } from '@ionic/angular/standalone';
import { MissionService } from '../../services/mission.service';
import { ResourceService } from '../../services/resource.service';
import type { Mission } from '../../models/mission.model';
import { SummaryBarComponent } from './components/summary-bar/summary-bar.component';
import { DraftBannerComponent } from './components/draft-banner/draft-banner.component';
import { MissionListComponent } from './components/mission-list/mission-list.component';
import { CompletionModalComponent } from './components/completion-modal/completion-modal.component';
import { ConfettiComponent } from './components/confetti/confetti.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonSpinner,
    SummaryBarComponent, DraftBannerComponent, MissionListComponent,
    CompletionModalComponent, ConfettiComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private missionService = inject(MissionService);
  private resourceService = inject(ResourceService);

  private missions = toSignal(this.missionService.missions$, { initialValue: [] as Mission[] });
  private loading = toSignal(this.missionService.loading$, { initialValue: true });
  private totals = toSignal(this.resourceService.totals$, { initialValue: { trucks: 0, people: 0 } });

  isLoading = computed(() => this.loading());
  totalTrucks = computed(() => this.totals().trucks);
  totalPeople = computed(() => this.totals().people);

  drafts = computed(() => this.missions().filter(m => m.status === 'draft'));
  nonDrafts = computed(() => this.missions().filter(m => m.status !== 'draft'));

  expandedMissionId = signal<string | null>(null);
  showConfetti = signal(false);
  completionMission = signal<Mission | null>(null);

  toggleExpand(id: string): void {
    this.expandedMissionId.update(prev => prev === id ? null : id);
  }

  async onStart(mission: Mission): Promise<void> {
    await this.missionService.changeMissionStatus(mission.id, 'active');
  }

  async onComplete(mission: Mission): Promise<void> {
    await this.missionService.changeMissionStatus(mission.id, 'completed');
    // Find the updated mission for the modal
    const updated = this.missions().find(m => m.id === mission.id);
    this.completionMission.set(updated ?? mission);
    this.showConfetti.set(true);
    setTimeout(() => this.showConfetti.set(false), 3500);
  }

  async onCancel(mission: Mission): Promise<void> {
    await this.missionService.changeMissionStatus(mission.id, 'cancelled');
  }

  async onDeleteDraft(id: string): Promise<void> {
    await this.missionService.deleteDraft(id);
  }

  closeCompletionModal(): void {
    this.completionMission.set(null);
  }
}
