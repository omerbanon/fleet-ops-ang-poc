import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DriverViewComponent } from './components/driver-view/driver-view.component';

@Component({
  selector: 'app-driver',
  standalone: true,
  imports: [DriverViewComponent],
  template: `<app-driver-view [token]="token" />`,
})
export class DriverPage {
  private route = inject(ActivatedRoute);
  token = this.route.snapshot.paramMap.get('token') ?? '';
}
