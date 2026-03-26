import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { User, Team } from '../models/user.model';
import { MOCK_USERS, MOCK_TEAM_MEMBERSHIPS } from '../mock/mock-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  readonly user$ = this.userSubject.asObservable();
  readonly teams$ = this.teamsSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  /** Check localStorage for existing session on app load */
  private restoreSession(): void {
    const storedUserId = localStorage.getItem('auth_user_id');

    // Simulate async session check
    setTimeout(() => {
      if (storedUserId) {
        const user = MOCK_USERS.find(u => u.id === storedUserId);
        if (user) {
          this.setUser(user);
        }
      }
      this.loadingSubject.next(false);
    }, 300);
  }

  private setUser(mockUser: { id: string; email: string }): void {
    const user: User = { id: mockUser.id, email: mockUser.email };
    this.userSubject.next(user);
    this.teamsSubject.next(MOCK_TEAM_MEMBERSHIPS[user.id] ?? []);
    localStorage.setItem('auth_user_id', user.id);
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      return { error: 'אימייל או סיסמה שגויים' };
    }

    this.setUser(user);
    return { error: null };
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('dispatch_selected_team');
    this.userSubject.next(null);
    this.teamsSubject.next([]);
  }
}
