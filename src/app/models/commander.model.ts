import type { Mission } from './mission.model';

export interface TeamTotal {
  team_id: string;
  team_name: string;
  trucks: number;
  people: number;
}

export interface CommanderMissionsResponse {
  role: 'commander' | 'viewer' | 'admin';
  teams: { id: string; name: string }[];
  missions: Mission[];   // each row already has team_name flattened
}

export interface CommanderAccess {
  hasAccess: boolean;
  isReadOnly: boolean;
}
