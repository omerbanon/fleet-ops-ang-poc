import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonSpinner } from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';
import { TeamService } from '../../services/team.service';
import { TeamManagementService } from '../../services/team-management.service';
import type { TeamMember } from '../../models/team-management.model';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    IonContent, IonInput, IonButton, IonSpinner,
  ],
  templateUrl: './team.page.html',
  styleUrl: './team.page.scss',
})
export class TeamPage {
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private teamMgmt = inject(TeamManagementService);
  private router = inject(Router);

  user = toSignal(this.authService.user$, { initialValue: null });
  team = toSignal(this.teamService.selectedTeam$, { initialValue: null });

  isAdmin = computed(() => this.team()?.role === 'admin');

  // Members list state
  members = signal<TeamMember[]>([]);
  loadingMembers = signal<boolean>(false);

  // Invite state
  inviteEmail = signal<string>('');
  inviting = signal<boolean>(false);
  inviteError = signal<string | null>(null);
  inviteSuccess = signal<string | null>(null);

  // Create-team state
  teamName = signal<string>('');
  creating = signal<boolean>(false);
  createError = signal<string | null>(null);

  constructor() {
    // Load members whenever the team becomes available
    this.loadMembers();
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  private loadMembers(): void {
    const t = this.team();
    if (!t) return;
    this.loadingMembers.set(true);
    this.teamMgmt.listMembers(t.id, this.user()).subscribe({
      next: list => {
        this.members.set(list);
        this.loadingMembers.set(false);
      },
      error: () => this.loadingMembers.set(false),
    });
  }

  // ── Create team ────────────────────────────────────────────────────────────

  createTeam(): void {
    const name = this.teamName().trim();
    const u = this.user();
    if (!name || !u) return;
    this.creating.set(true);
    this.createError.set(null);
    this.teamMgmt.createTeam(name, u.id).subscribe({
      next: () => {
        // React reloads to refresh AuthContext. POC equivalent: reload to refresh state.
        if (typeof window !== 'undefined') window.location.reload();
        else this.creating.set(false);
      },
      error: (e: { message?: string }) => {
        this.createError.set(e?.message ?? 'שגיאה ביצירת צוות');
        this.creating.set(false);
      },
    });
  }

  // ── Invite ─────────────────────────────────────────────────────────────────

  invite(): void {
    const t = this.team();
    const email = this.inviteEmail().trim();
    if (!t || !email) return;
    this.inviting.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(null);
    this.teamMgmt.inviteMember(t.id, email).subscribe({
      next: ({ tempPassword }) => {
        this.inviteSuccess.set(`המשתמש ${email} נוסף. סיסמה זמנית: ${tempPassword}`);
        this.inviteEmail.set('');
        this.inviting.set(false);
        this.loadMembers();
      },
      error: (e: { message?: string }) => {
        this.inviteError.set(e?.message ?? 'שגיאה בהזמנה');
        this.inviting.set(false);
      },
    });
  }

  // ── Remove ─────────────────────────────────────────────────────────────────

  removeMember(member: TeamMember): void {
    const u = this.user();
    if (member.user_id === u?.id) return;
    if (typeof confirm === 'function' && !confirm('להסיר חבר צוות זה?')) return;
    this.teamMgmt.removeMember(member.id).subscribe({
      next: () => this.loadMembers(),
      error: () => { /* swallow per React (no error UI for delete) */ },
    });
  }

  roleLabel(role: string): string {
    return role === 'admin' ? 'מנהל' : 'חבר';
  }
}
