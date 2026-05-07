import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonTextarea, IonToggle, IonButton } from '@ionic/angular/standalone';

import type { WizardMissionData, RiskKey, CustomRisk } from '../../../../models/wizard.model';
import { RISK_FIELDS, HEBREW_LETTERS_FOR_CUSTOM_RISKS } from '../../../../models/wizard.model';
import { WizardService } from '../../../../services/wizard.service';

@Component({
  selector: 'app-step2-risks',
  standalone: true,
  imports: [FormsModule, IonInput, IonTextarea, IonToggle, IonButton],
  templateUrl: './step2-risks.component.html',
  styleUrl: './step2-risks.component.scss',
})
export class Step2RisksComponent {
  private wizardService = inject(WizardService);

  @Input({ required: true }) missionData!: WizardMissionData;
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  riskFields = RISK_FIELDS;

  openSection = signal<string | null>(null);

  isEnabled(key: string): boolean {
    return this.missionData.enabledRisks.includes(key);
  }

  riskContent(key: RiskKey): string {
    return this.missionData.riskManagement[key] ?? '';
  }

  toggleRisk(key: string): void {
    const current = this.missionData.enabledRisks;
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    this.wizardService.setEnabledRisks(next);
  }

  onContentChange(key: RiskKey, value: string): void {
    this.wizardService.updateRiskManagement(key, value);
  }

  toggleOpen(id: string): void {
    this.openSection.update(o => (o === id ? null : id));
  }

  customRisks = computed(() => this.missionData.customRisks);

  customRiskLetter(index: number): string {
    return HEBREW_LETTERS_FOR_CUSTOM_RISKS[index] ?? `${index + 6}`;
  }

  addCustomRisk(): void {
    const id = `custom_${Date.now()}`;
    const next: CustomRisk[] = [...this.missionData.customRisks, { id, title: '', content: '' }];
    this.wizardService.setCustomRisks(next);
    this.wizardService.setEnabledRisks([...this.missionData.enabledRisks, id]);
    this.openSection.set(id);
  }

  updateCustomRisk(id: string, field: 'title' | 'content', value: string): void {
    const next = this.missionData.customRisks.map(r => r.id === id ? { ...r, [field]: value } : r);
    this.wizardService.setCustomRisks(next);
  }

  removeCustomRisk(id: string): void {
    this.wizardService.setCustomRisks(this.missionData.customRisks.filter(r => r.id !== id));
    this.wizardService.setEnabledRisks(this.missionData.enabledRisks.filter(k => k !== id));
    if (this.openSection() === id) this.openSection.set(null);
  }

  get trafficCoordinatorPhone(): string { return this.missionData.phones.trafficCoordinator; }
  get commanderPhone(): string { return this.missionData.phones.commander; }

  onTrafficPhoneChange(v: string): void {
    this.wizardService.updatePhones({ trafficCoordinator: v });
  }
  onCommanderPhoneChange(v: string): void {
    this.wizardService.updatePhones({ commander: v });
  }

  onSubmit(): void { this.next.emit(); }
  onBack(): void { this.back.emit(); }
}
