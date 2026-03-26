import type { Team } from '../models/user.model';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-001',
    email: 'radi@dispatch.local',
    password: '1234',
    name: 'רדי ב',
  },
  {
    id: 'user-002',
    email: 'commander@dispatch.local',
    password: '1234',
    name: 'אלון מ',
  },
  {
    id: 'user-003',
    email: 'admin@dispatch.local',
    password: '1234',
    name: 'עומר ב',
  },
];

// Maps user ID to their team memberships
export const MOCK_TEAM_MEMBERSHIPS: Record<string, Team[]> = {
  'user-001': [
    { id: 'team-001', name: 'צוות הובלות', role: 'member' },
  ],
  'user-002': [
    { id: 'team-001', name: 'צוות הובלות', role: 'commander' },
    { id: 'team-002', name: 'צוות חירום', role: 'commander' },
  ],
  'user-003': [
    { id: 'team-001', name: 'צוות הובלות', role: 'admin' },
    { id: 'team-002', name: 'צוות חירום', role: 'admin' },
  ],
};
