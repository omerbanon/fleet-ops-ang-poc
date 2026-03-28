export interface Person {
  id: string;
  full_name: string;
  role: PersonRole;
  phone: string;
  status: PersonStatus;
  return_date: string | null;
  rank: string | null;
  has_weapon: boolean;
  vehicle_license_class: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  team_id: string;
  scheduled_mission_count: number;
}

export type PersonRole = 'driver' | 'co_driver' | 'both' | 'commander';
export type PersonStatus = 'at_base' | 'home' | 'on_task';

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  driver: 'נהג',
  co_driver: 'מלווה',
  both: 'נהג + מלווה',
  commander: 'מפקד',
};

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  at_base: 'בבסיס',
  home: 'בבית',
  on_task: 'במשימה',
};

export const PERSON_STATUS_COLORS: Record<PersonStatus, { bg: string; text: string }> = {
  at_base: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  home: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
  on_task: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
};

export const ALL_PERSON_ROLES: PersonRole[] = ['driver', 'co_driver', 'both', 'commander'];
export const ALL_PERSON_STATUSES: PersonStatus[] = ['at_base', 'home', 'on_task'];

export function isAtBase(person: Person): boolean {
  return person.status === 'at_base';
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return /^\+?\d{9,15}$/.test(clean);
}
