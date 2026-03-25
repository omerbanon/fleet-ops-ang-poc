import { Component, input, output, signal } from '@angular/core';
import { IonCard, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import type { Mission } from '../../../../models/mission.model';
import { formatDD_MM } from '../../../../models/mission.model';

@Component({
  selector: 'app-draft-banner',
  standalone: true,
  imports: [IonCard, IonCardContent, IonSpinner],
  templateUrl: './draft-banner.component.html',
  styleUrl: './draft-banner.component.scss',
})
export class DraftBannerComponent {
  drafts = input.required<Mission[]>();
  deleteDraft = output<string>();

  expanded = signal(false);
  deletingId = signal<string | null>(null);

  get latest(): Mission | undefined {
    return this.drafts()[0];
  }

  get rest(): Mission[] {
    return this.drafts().slice(1);
  }

  formatDate(dateStr: string): string {
    return formatDD_MM(dateStr);
  }

  formatTime(updatedAt: string): string {
    return new Date(updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  async handleDelete(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    this.deletingId.set(id);
    this.deleteDraft.emit(id);
    // Reset after a delay (parent will remove the draft from list)
    setTimeout(() => this.deletingId.set(null), 1000);
  }
}
