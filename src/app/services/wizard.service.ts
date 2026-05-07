import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged, of } from 'rxjs';
import type {
  WizardState,
  WizardMissionData,
  MissionBasics,
  Phones,
  RiskKey,
  CustomRisk,
  WizardTruckAssignment,
  CustomTruck,
  CustomPerson,
  WizardStage,
} from '../models/wizard.model';
import { canProceed } from '../models/wizard.model';
import { buildEmptyWizardData } from '../mock/mock-wizard';
import type { Mission } from '../models/mission.model';
import { missionToWizardData } from '../utils/wizard-mission-converter.util';

const STORAGE_KEY = 'dispatch_wizard_progress';

interface PersistedProgress {
  currentStep: number;
  completedSteps: number[];
  timestamp: number;
}

function buildInitialState(): WizardState {
  return {
    currentStep: 1,
    completedSteps: [],
    editingMissionId: null,
    isEditingScheduledOrActive: false,
    draftId: null,
    originalMissionData: null,
    missionData: buildEmptyWizardData(),
  };
}

@Injectable({ providedIn: 'root' })
export class WizardService {
  private stateSubject = new BehaviorSubject<WizardState>(buildInitialState());

  readonly state$: Observable<WizardState> = this.stateSubject.asObservable();
  readonly currentStep$ = this.state$.pipe(map(s => s.currentStep), distinctUntilChanged());
  readonly missionData$ = this.state$.pipe(map(s => s.missionData));
  readonly isEditing$ = this.state$.pipe(map(s => !!s.editingMissionId), distinctUntilChanged());
  readonly isEditingScheduledOrActive$ = this.state$.pipe(
    map(s => s.isEditingScheduledOrActive),
    distinctUntilChanged(),
  );

  get state(): WizardState { return this.stateSubject.value; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  startNew(): void {
    const fresh = buildInitialState();
    this.stateSubject.next(fresh);
    this.persist(fresh);
  }

  loadForEdit(mission: Mission): void {
    const wizardData = missionToWizardData(mission);
    const isDraft = mission.status === 'draft';
    const isEditingScheduledOrActive = !isDraft && mission.status !== 'cancelled' && mission.status !== 'completed';
    const next: WizardState = {
      currentStep: isDraft ? 3 : 1,
      completedSteps: isDraft ? [1, 2] : [],
      editingMissionId: mission.id,
      isEditingScheduledOrActive,
      draftId: null,
      originalMissionData: structuredClone(wizardData),
      missionData: wizardData,
    };
    this.stateSubject.next(next);
    this.persist(next);
  }

  reset(): void {
    this.stateSubject.next(buildInitialState());
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToStep(step: number): boolean {
    const current = this.stateSubject.value;
    // Allow going back or jumping to a completed step. Going forward requires current step to be valid.
    if (step <= current.currentStep || current.completedSteps.includes(step) || current.completedSteps.includes(step - 1)) {
      const next: WizardState = { ...current, currentStep: step };
      this.stateSubject.next(next);
      this.persist(next);
      return true;
    }
    if (canProceed(current.currentStep, current.missionData)) {
      const completed = current.completedSteps.includes(current.currentStep)
        ? current.completedSteps
        : [...current.completedSteps, current.currentStep];
      const next: WizardState = { ...current, currentStep: step, completedSteps: completed };
      this.stateSubject.next(next);
      this.persist(next);
      return true;
    }
    return false;
  }

  markStepComplete(step: number): void {
    const current = this.stateSubject.value;
    if (current.completedSteps.includes(step)) return;
    const next: WizardState = { ...current, completedSteps: [...current.completedSteps, step] };
    this.stateSubject.next(next);
    this.persist(next);
  }

  // ── Data updates ───────────────────────────────────────────────────────────

  private patch(updater: (data: WizardMissionData) => WizardMissionData): void {
    const current = this.stateSubject.value;
    const next: WizardState = { ...current, missionData: updater(current.missionData) };
    this.stateSubject.next(next);
  }

  updateMissionBasics(partial: Partial<MissionBasics>): void {
    this.patch(d => ({ ...d, missionBasics: { ...d.missionBasics, ...partial } }));
  }

  updatePhones(partial: Partial<Phones>): void {
    this.patch(d => ({ ...d, phones: { ...d.phones, ...partial } }));
  }

  setEnabledRisks(keys: string[]): void {
    this.patch(d => ({ ...d, enabledRisks: keys }));
  }

  updateRiskManagement(key: RiskKey, content: string): void {
    this.patch(d => ({ ...d, riskManagement: { ...d.riskManagement, [key]: content } }));
  }

  setCustomRisks(risks: CustomRisk[]): void {
    this.patch(d => ({ ...d, customRisks: risks }));
  }

  setTruckAssignments(assignments: WizardTruckAssignment[]): void {
    this.patch(d => ({ ...d, truckAssignments: assignments }));
  }

  setCustomTrucks(trucks: CustomTruck[]): void {
    this.patch(d => ({ ...d, customTrucks: trucks }));
  }

  setCustomPeople(people: CustomPerson[]): void {
    this.patch(d => ({ ...d, customPeople: people }));
  }

  setStages(stages: WizardStage[]): void {
    this.patch(d => ({ ...d, stages }));
  }

  // ── Draft (STUBBED — dev wires real backend later) ─────────────────────────

  saveDraft(_data: WizardMissionData): Observable<{ id: string | null }> {
    return of({ id: null });
  }

  setDraftId(id: string | null): void {
    const current = this.stateSubject.value;
    if (current.draftId === id) return;
    this.stateSubject.next({ ...current, draftId: id });
  }

  // ── localStorage persistence (progress only — not mission data) ────────────

  private persist(state: WizardState): void {
    const payload: PersistedProgress = {
      currentStep: state.currentStep,
      completedSteps: state.completedSteps,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* quota exceeded — ignore */ }
  }

  restoreFromLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as PersistedProgress;
      if (typeof parsed.currentStep !== 'number') return false;
      const current = this.stateSubject.value;
      this.stateSubject.next({
        ...current,
        currentStep: parsed.currentStep,
        completedSteps: parsed.completedSteps ?? [],
      });
      return true;
    } catch {
      return false;
    }
  }
}
