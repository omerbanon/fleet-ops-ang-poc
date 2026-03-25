import { Component, input, output, signal, OnInit } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import type { Mission } from '../../../../models/mission.model';
import { getTruckCount, getCrewCount, calcTotalDuration, formatDD_MM } from '../../../../models/mission.model';

@Component({
  selector: 'app-completion-modal',
  standalone: true,
  imports: [IonButton],
  templateUrl: './completion-modal.component.html',
  styleUrl: './completion-modal.component.scss',
})
export class CompletionModalComponent implements OnInit {
  mission = input.required<Mission>();
  closeModal = output<void>();

  isOpen = signal(true);
  mounted = signal(false);

  stats: { label: string; value: string | number }[] = [];

  ngOnInit(): void {
    const m = this.mission();
    this.stats = [
      { label: 'שלבים', value: m.mission_stages.length },
      { label: 'משאיות', value: getTruckCount(m) },
      { label: 'כוח אדם', value: getCrewCount(m) },
      { label: 'זמן כולל', value: calcTotalDuration(m) },
    ];
    requestAnimationFrame(() => this.mounted.set(true));
  }

  formatDate(dateStr: string): string {
    return formatDD_MM(dateStr);
  }

  onClose(): void {
    this.isOpen.set(false);
    this.closeModal.emit();
  }
}
