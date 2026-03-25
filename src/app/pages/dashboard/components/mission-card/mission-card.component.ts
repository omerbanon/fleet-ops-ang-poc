import { Component, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { Mission, MissionStage, TruckStageProgress } from '../../../../models/mission.model';
import {
  STATUS_LABELS,
  ACTION_LABELS,
  STAGE_STATUS_LABELS,
  HEB_LETTERS,
  getTruckCount,
  getCrewCount,
  sortedStages,
  groupByTruck,
  formatDD_MM,
  formatTimeRange,
  TruckGroup,
} from '../../../../models/mission.model';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [NgClass, IonButton, IonSpinner],
  templateUrl: './mission-card.component.html',
  styleUrl: './mission-card.component.scss',
})
export class MissionCardComponent {
  mission = input.required<Mission>();
  isExpanded = input<boolean>(false);
  toggle = output<void>();
  startMission = output<void>();
  completeMission = output<void>();
  cancelMission = output<void>();

  confirmCancel = signal(false);
  actionLoading = signal<'start' | 'complete' | 'cancel' | null>(null);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly ACTION_LABELS = ACTION_LABELS;
  readonly STAGE_STATUS_LABELS = STAGE_STATUS_LABELS;
  readonly HEB_LETTERS = HEB_LETTERS;

  get stages(): MissionStage[] {
    return sortedStages(this.mission().mission_stages);
  }

  get firstStage(): MissionStage | null {
    return this.stages[0] ?? null;
  }

  get trucks(): TruckGroup[] {
    return groupByTruck(this.mission().mission_personnel);
  }

  get truckCount(): number {
    return getTruckCount(this.mission());
  }

  get crewCount(): number {
    return getCrewCount(this.mission());
  }

  formatDate(dateStr: string): string {
    return formatDD_MM(dateStr);
  }

  formatTime(departure: string | null, arrival: string | null): string {
    return formatTimeRange(departure, arrival);
  }

  getStatusClass(): string {
    return `status-${this.mission().status}`;
  }

  // Stage progress dots for active missions
  get allProgress(): TruckStageProgress[] {
    const result: TruckStageProgress[] = [];
    for (const s of this.stages) {
      if (s.truck_stage_progress) result.push(...s.truck_stage_progress);
    }
    return result;
  }

  get totalProgressTrucks(): number {
    return new Set(this.allProgress.map(p => p.truck_key)).size;
  }

  getStageProgressClass(stage: MissionStage): string {
    if (this.totalProgressTrucks === 0) {
      if (stage.stage_status === 'completed') return 'dot-completed';
      if (stage.stage_status === 'departed') return 'dot-departed';
      return 'dot-pending';
    }

    const stageProgress = this.allProgress.filter(p => p.mission_stage_id === stage.id);
    const completedCount = stageProgress.filter(p => p.stage_status === 'completed').length;
    const departedCount = stageProgress.filter(p => p.stage_status === 'departed').length;
    const allCompleted = completedCount === this.totalProgressTrucks;
    const someActive = departedCount > 0 || (completedCount > 0 && !allCompleted);

    if (allCompleted) return 'dot-completed';
    if (someActive) return 'dot-departed';
    return 'dot-pending';
  }

  getStageProgressFraction(stage: MissionStage): string | null {
    if (this.totalProgressTrucks === 0) return null;
    const stageProgress = this.allProgress.filter(p => p.mission_stage_id === stage.id);
    const completedCount = stageProgress.filter(p => p.stage_status === 'completed').length;
    const allCompleted = completedCount === this.totalProgressTrucks;
    const departedCount = stageProgress.filter(p => p.stage_status === 'departed').length;
    const someActive = departedCount > 0 || (completedCount > 0 && !allCompleted);
    if (someActive && !allCompleted) {
      return `${completedCount}/${this.totalProgressTrucks}`;
    }
    return null;
  }

  getStageStyle(stage: MissionStage): string {
    if (this.mission().status !== 'active') return 'stage-default';
    if (stage.stage_status === 'departed') return 'stage-departed';
    if (stage.stage_status === 'completed') return 'stage-completed';
    return 'stage-default';
  }

  // Per-truck stage status for expanded view
  get truckKeys(): string[] {
    return [...new Set(this.allProgress.map(p => p.truck_key))];
  }

  getTruckLabel(truckKey: string): string {
    for (const t of this.trucks) {
      if (t.key === truckKey) return t.label;
    }
    return truckKey;
  }

  getTruckCurrentStage(truckKey: string): { letter: string; status: string } {
    const truckStages = this.stages.map(stage => {
      const tp = this.allProgress.find(p => p.truck_key === truckKey && p.mission_stage_id === stage.id);
      return { stageOrder: stage.stage_order, status: tp?.stage_status || 'pending' };
    }).sort((a, b) => a.stageOrder - b.stageOrder);

    const current = truckStages.find(s => s.status !== 'completed');
    const currentIdx = current ? truckStages.indexOf(current) : truckStages.length;
    return {
      letter: HEB_LETTERS[currentIdx] || `${currentIdx + 1}`,
      status: current?.status || 'completed',
    };
  }

  getStageCompletionSummary(stageIdx: number): string {
    const stage = this.stages[stageIdx];
    if (!stage) return '';
    const stageProgress = this.allProgress.filter(p => p.mission_stage_id === stage.id);
    const completed = stageProgress.filter(p => p.stage_status === 'completed').length;
    return `${completed}/${this.truckKeys.length}`;
  }

  isStageFullyCompleted(stageIdx: number): boolean {
    const stage = this.stages[stageIdx];
    if (!stage) return false;
    const stageProgress = this.allProgress.filter(p => p.mission_stage_id === stage.id);
    return stageProgress.filter(p => p.stage_status === 'completed').length === this.truckKeys.length;
  }

  onToggle(): void {
    this.toggle.emit();
  }

  async onStart(event: Event): Promise<void> {
    event.stopPropagation();
    this.actionLoading.set('start');
    this.startMission.emit();
    setTimeout(() => this.actionLoading.set(null), 500);
  }

  async onComplete(event: Event): Promise<void> {
    event.stopPropagation();
    this.actionLoading.set('complete');
    this.completeMission.emit();
    setTimeout(() => this.actionLoading.set(null), 500);
  }

  onCancelClick(event: Event): void {
    event.stopPropagation();
    this.confirmCancel.set(true);
  }

  async onConfirmCancel(event: Event): Promise<void> {
    event.stopPropagation();
    this.confirmCancel.set(false);
    this.actionLoading.set('cancel');
    this.cancelMission.emit();
    setTimeout(() => this.actionLoading.set(null), 500);
  }

  onDenyCancel(event: Event): void {
    event.stopPropagation();
    this.confirmCancel.set(false);
  }
}
