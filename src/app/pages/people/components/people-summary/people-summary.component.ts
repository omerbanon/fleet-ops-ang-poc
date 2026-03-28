import { Component, input } from '@angular/core';

@Component({
  selector: 'app-people-summary',
  standalone: true,
  templateUrl: './people-summary.component.html',
  styleUrl: './people-summary.component.scss',
})
export class PeopleSummaryComponent {
  atBaseCount = input.required<number>();
  notAtBaseCount = input.required<number>();
  homeCount = input.required<number>();
  onTaskCount = input.required<number>();
}
