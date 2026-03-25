import { Injectable } from '@angular/core';

export interface User {
  id: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user: User = {
    id: 'user-001',
    name: 'רדי ב',
    role: 'commander',
  };
}
