import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import type { AdminTeam, AdminMember } from '../../models/admin.model';

@Component({
  selector: 'app-admin-secret',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    IonContent, IonInput, IonSelect, IonSelectOption, IonButton,
  ],
  templateUrl: './admin-secret.page.html',
  styleUrl: './admin-secret.page.scss',
})
export class AdminSecretPage {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  user = toSignal(this.authService.user$, { initialValue: null });

  teams = signal<AdminTeam[]>([]);
  members = signal<AdminMember[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Create team
  teamName = signal<string>('');
  teamMsg = signal<string>('');
  teamLoading = signal<boolean>(false);

  // Assign user
  userId = signal<string>('');
  selectedTeamId = signal<string>('');
  selectedRole = signal<string>('member');
  assignMsg = signal<string>('');
  assignLoading = signal<boolean>(false);

  membersCount = computed(() => this.members().length);
  teamsCount = computed(() => this.teams().length);

  ngOnInit(): void { this.loadData(); }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.fetchAll().subscribe({
      next: ({ teams, members }) => {
        this.teams.set(teams);
        this.members.set(members);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e instanceof Error ? e.message : 'Failed to load');
        this.loading.set(false);
      },
    });
  }

  createTeam(): void {
    const name = this.teamName().trim();
    const u = this.user();
    if (!name || !u) return;
    this.teamLoading.set(true);
    this.teamMsg.set('');
    this.adminService.createTeam(name, u.id).subscribe({
      next: () => {
        this.teamMsg.set(`צוות "${name}" נוצר`);
        this.teamName.set('');
        this.teamLoading.set(false);
        this.loadData();
      },
      error: (err: { message?: string }) => {
        this.teamMsg.set(`שגיאה: ${err?.message ?? 'Unknown'}`);
        this.teamLoading.set(false);
      },
    });
  }

  assignUser(): void {
    const uid = this.userId().trim();
    const tid = this.selectedTeamId();
    if (!uid || !tid) return;
    this.assignLoading.set(true);
    this.assignMsg.set('');
    this.adminService.assignUser(uid, tid, this.selectedRole()).subscribe({
      next: () => {
        this.assignMsg.set('שויך בהצלחה');
        this.userId.set('');
        this.selectedTeamId.set('');
        this.selectedRole.set('member');
        this.assignLoading.set(false);
        this.loadData();
      },
      error: (err: { message?: string }) => {
        this.assignMsg.set(`שגיאה: ${err?.message ?? 'Unknown'}`);
        this.assignLoading.set(false);
      },
    });
  }

  removeMember(memberId: string): void {
    if (typeof confirm === 'function' && !confirm('להסיר שיוך זה?')) return;
    this.adminService.removeMember(memberId).subscribe({
      next: () => this.loadData(),
      error: () => { /* silent per React */ },
    });
  }

  memberCountForTeam(teamId: string): number {
    return this.members().filter(m => m.team_id === teamId).length;
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('he-IL'); } catch { return iso; }
  }

  isMsgError(msg: string): boolean { return msg.startsWith('שגיאה'); }
}
