import { Component, input } from '@angular/core';

@Component({
  selector: 'app-truck-summary',
  standalone: true,
  templateUrl: './truck-summary.component.html',
  styleUrl: './truck-summary.component.scss',
})
export class TruckSummaryComponent {
  activeCount = input.required<number>();
  inactiveCount = input.required<number>();
  maintenanceCount = input.required<number>();
  outOfServiceCount = input.required<number>();
}
