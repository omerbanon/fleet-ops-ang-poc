export interface TeamMember {
  id: string;            // team_members row id
  user_id: string;
  role: 'admin' | 'member';
  email: string;         // resolved client-side; falls back to user_id when not the current user
  created_at: string;
}
