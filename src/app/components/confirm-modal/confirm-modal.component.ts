import { Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [IonButton],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input<string>('אישור');
  confirmColor = input<'danger' | 'warning'>('danger');

  confirm = output<void>();
  cancel = output<void>();
}
