// Admin Secret Panel types — port of dispatch-system /api/admin shapes

export interface AdminTeam {
  id: string;
  name: string;
  created_at: string;
}

export interface AdminMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;                          // 'admin' | 'member' (loose for forward-compat)
  created_at: string;
  teams: { name: string } | null;
}
