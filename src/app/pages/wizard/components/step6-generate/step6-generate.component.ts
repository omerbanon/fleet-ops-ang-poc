import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonSegment, IonSegmentButton, IonLabel, IonButton, IonSpinner } from '@ionic/angular/standalone';

import type { WizardMissionData } from '../../../../models/wizard.model';
import type { Truck } from '../../../../models/truck.model';
import type { Person } from '../../../../models/person.model';
import { buildSoldiersMessage, buildOpsMessage } from '../../../../utils/wizard-message-builder.util';
import { MissionService } from '../../../../services/mission.service';
import { WizardService } from '../../../../services/wizard.service';

type GenerateState = 'idle' | 'loading' | 'success' | 'error' | 'edit-diff';
type MessageTab = 'soldiers' | 'ops';

@Component({
  selector: 'app-step6-generate',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, IonButton, IonSpinner],
  templateUrl: './step6-generate.component.html',
  styleUrl: './step6-generate.component.scss',
})
export class Step6GenerateComponent {
  private missionService = inject(MissionService);
  private wizardService = inject(WizardService);
  private router = inject(Router);

  @Input({ required: true }) missionData!: WizardMissionData;
  @Input() originalMissionData: WizardMissionData | null = null;
  @Input() isEditingScheduledOrActive = false;
  @Input() editingMissionId: string | null = null;
  @Input() trucks: Truck[] = [];
  @Input() people: Person[] = [];
  @Input() teamId = 'team-001';

  @Output() back = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  state = signal<GenerateState>('idle');
  errorMessage = signal<string | null>(null);
  activeTab = signal<MessageTab>('soldiers');
  truckTokens = signal<Map<string, string>>(new Map());

  ngOnInit(): void {
    if (this.isEditingScheduledOrActive) this.state.set('edit-diff');
  }

  resolverContext = computed(() => ({
    trucks: this.trucks,
    people: this.people,
    customTrucks: this.missionData.customTrucks,
    customPeople: this.missionData.customPeople,
    truckUrls: this.truckTokens(),
  }));

  soldiersMessage = computed(() => buildSoldiersMessage(this.missionData, this.resolverContext()));
  opsMessage = computed(() => buildOpsMessage(this.missionData, this.resolverContext()));

  // Diff for edit-diff mode (high-level — sections that changed)
  changedSections = computed(() => {
    const orig = this.originalMissionData;
    if (!orig) return [];
    const out: string[] = [];
    if (JSON.stringify(orig.missionBasics) !== JSON.stringify(this.missionData.missionBasics)) out.push('פרטי המשימה');
    if (JSON.stringify({ r: orig.enabledRisks, m: orig.riskManagement, c: orig.customRisks, p: orig.phones }) !==
        JSON.stringify({ r: this.missionData.enabledRisks, m: this.missionData.riskManagement, c: this.missionData.customRisks, p: this.missionData.phones })) {
      out.push('סיכונים ולוגיסטיקה');
    }
    if (JSON.stringify(orig.truckAssignments) !== JSON.stringify(this.missionData.truckAssignments)
        || JSON.stringify(orig.customTrucks) !== JSON.stringify(this.missionData.customTrucks)
        || JSON.stringify(orig.customPeople) !== JSON.stringify(this.missionData.customPeople)) {
      out.push('רכבים וצוותים');
    }
    if (JSON.stringify(orig.stages) !== JSON.stringify(this.missionData.stages)) out.push('שלבי המשימה');
    return out;
  });

  setTab(tab: MessageTab): void { this.activeTab.set(tab); }

  async copyMessage(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Toast omitted for POC simplicity — alert would be intrusive; status text is enough
    } catch { /* clipboard unavailable */ }
  }

  schedule(): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.missionService.createMission(
      this.missionData,
      { teamId: this.teamId, trucks: this.trucks, people: this.people },
    ).subscribe({
      next: mission => {
        // Generate fake driver tracking tokens (POC stub)
        const tokens = new Map<string, string>();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        for (const a of this.missionData.truckAssignments) {
          const truck = this.trucks.find(t => t.id === a.truckId)
            ?? this.missionData.customTrucks.find(c => c.id === a.truckId);
          if (!truck) continue;
          const vehicleId = 'vehicle_id' in truck ? truck.vehicle_id : truck.vehicleId;
          const token = `t-${vehicleId}-${Date.now()}`;
          tokens.set(vehicleId, `${origin}/driver/${token}`);
        }
        this.truckTokens.set(tokens);
        this.state.set('success');
        // mission ready — kept for potential post-action navigation
        void mission;
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set('יצירת המשימה נכשלה. נסה שוב.');
      },
    });
  }

  saveEdit(): void {
    if (!this.editingMissionId) return;
    this.state.set('loading');
    this.errorMessage.set(null);
    this.missionService.updateMission(
      this.editingMissionId,
      this.missionData,
      { teamId: this.teamId, trucks: this.trucks, people: this.people },
    ).subscribe({
      next: ({ error }) => {
        if (error) {
          this.state.set('error');
          this.errorMessage.set(error);
        } else {
          this.wizardService.reset();
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set('שמירה נכשלה. נסה שוב.');
      },
    });
  }

  goToDashboard(): void {
    this.wizardService.reset();
    this.router.navigate(['/']);
  }

  truckTokenList = computed(() => Array.from(this.truckTokens().entries()).map(([vehicleId, url]) => ({ vehicleId, url })));

  async copyToken(url: string): Promise<void> {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  onBack(): void { this.back.emit(); }
  onCancel(): void { this.cancel.emit(); }
}
