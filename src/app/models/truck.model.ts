export interface Truck {
  id: string;
  vehicle_id: string;
  type: string;
  capacity_kg: number | null;
  status: TruckStatus;
  notes: string | null;
  team_id: string;
  scheduled_mission_count: number;
}

export type TruckStatus = 'operational' | 'maintenance' | 'out_of_service';

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  operational: 'פעיל',
  maintenance: 'בתחזוקה',
  out_of_service: 'תקול',
};

export const TRUCK_STATUS_COLORS: Record<TruckStatus, { bg: string; text: string }> = {
  operational: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  maintenance: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
  out_of_service: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
};

export const ALL_TRUCK_STATUSES: TruckStatus[] = ['operational', 'maintenance', 'out_of_service'];

export function isOperational(truck: Truck): boolean {
  return truck.status === 'operational';
}

export function formatCapacity(kg: number | null): string {
  if (kg === null) return '—';
  return `${kg.toLocaleString()} ק"ג`;
}
