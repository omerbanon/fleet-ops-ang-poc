import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

import { WizardService } from '../../services/wizard.service';
import { MissionService } from '../../services/mission.service';
import { TruckService } from '../../services/truck.service';
import { PersonService } from '../../services/person.service';
import { TeamService } from '../../services/team.service';
import { canProceed } from '../../models/wizard.model';

import { WizardStepperVerticalComponent } from './components/wizard-stepper-vertical/wizard-stepper-vertical.component';
import { WizardStepperHorizontalComponent } from './components/wizard-stepper-horizontal/wizard-stepper-horizontal.component';
import { Step1BasicsComponent } from './components/step1-basics/step1-basics.component';
import { Step2RisksComponent } from './components/step2-risks/step2-risks.component';
import { Step3TrucksCrewComponent } from './components/step3-trucks-crew/step3-trucks-crew.component';
import { Step4StagesComponent } from './components/step4-stages/step4-stages.component';
import { Step5ReviewComponent } from './components/step5-review/step5-review.component';
import { Step6GenerateComponent } from './components/step6-generate/step6-generate.component';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    WizardStepperVerticalComponent, WizardStepperHorizontalComponent,
    Step1BasicsComponent, Step2RisksComponent, Step3TrucksCrewComponent,
    Step4StagesComponent, Step5ReviewComponent, Step6GenerateComponent,
  ],
  templateUrl: './wizard.page.html',
  styleUrl: './wizard.page.scss',
})
export class WizardPage {
  private wizardService = inject(WizardService);
  private missionService = inject(MissionService);
  private truckService = inject(TruckService);
  private personService = inject(PersonService);
  private teamService = inject(TeamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  state = toSignal(this.wizardService.state$, { initialValue: this.wizardService.state });
  trucks = toSignal(this.truckService.trucks$, { initialValue: [] });
  people = toSignal(this.personService.people$, { initialValue: [] });
  selectedTeam = toSignal(this.teamService.selectedTeam$, { initialValue: null });
  missions = toSignal(this.missionService.missions$, { initialValue: [] });

  currentStep = computed(() => this.state().currentStep);
  isEditingScheduledOrActive = computed(() => this.state().isEditingScheduledOrActive);
  showVerticalStepper = computed(() => [2, 3, 4].includes(this.currentStep()));
  showHorizontalStepper = computed(() => [5, 6].includes(this.currentStep()));

  constructor() {
    addIcons({ 'close-outline': closeOutline });

    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (editId) {
      const mission = this.missionService.getMissionById(editId);
      if (mission) {
        this.wizardService.loadForEdit(mission);
      } else {
        // mission not loaded yet — try once data arrives, then start fresh as fallback
        this.wizardService.startNew();
      }
    } else {
      this.wizardService.startNew();
    }
  }

  onNext(): void {
    const current = this.currentStep();
    if (!canProceed(current, this.state().missionData)) return;
    this.wizardService.markStepComplete(current);
    this.wizardService.goToStep(Math.min(6, current + 1));
  }

  onBack(): void {
    const current = this.currentStep();
    if (current <= 1) return;
    this.wizardService.goToStep(current - 1);
  }

  onJumpToStep(step: number): void {
    this.wizardService.goToStep(step);
  }

  onCancel(): void {
    this.wizardService.reset();
    this.router.navigate(['/']);
  }
}
