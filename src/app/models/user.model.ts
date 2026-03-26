export interface User {
  id: string;
  email: string;
}

export type TeamRole = 'admin' | 'member' | 'commander' | 'viewer';

export interface Team {
  id: string;
  name: string;
  role: TeamRole;
}
