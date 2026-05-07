// Driver-view types — ported from dispatch-system React
// Source: projects/dispatch-system/app/src/components/driver/

import type { MissionStatus } from './mission.model';

export type DriverStageAction = 'departure' | 'loading' | 'unloading' | 'return' | 'transfer' | 'maintenance';

export type DriverStageStatus = 'pending' | 'departed' | 'completed';

export interface DriverCrewMember {
  name: string;
  phone: string | null;
  role: string;                   // loose — 'driver' | 'co_driver' | 'both' | other
  crew_position: number;          // numeric per React (NOT 'driver' | 'co_driver_1')
}

export interface DriverTruckInfo {
  truck_key: string;              // truck_id or custom truck name
  truck_label: string;            // display label (vehicle_id)
  crew: DriverCrewMember[];
}

export interface DriverStageRoute {
  route_type: string;             // 'primary' | 'backup' | other
  road_number: string;
}

export interface DriverStage {
  id: string;
  stage_order: number;
  stage_name: string;
  action: DriverStageAction;
  origin: string;
  destination: string;
  equipment_cargo: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  buffer_minutes?: number;
  stage_status: DriverStageStatus;
  actual_departure_time: string | null;
  actual_completion_time: string | null;
  maps_url: string | null;        // server-built — POC always null → button hidden
  routes: DriverStageRoute[];
}

export interface DriverData {
  mission: {
    id: string;
    mission_name: string;
    mission_date: string;
    status: MissionStatus;
    commander_name: string;
    commander_phone: string | null;
  };
  truck: DriverTruckInfo | null;
  stages: DriverStage[];
  personnel: unknown[];           // opaque carry-through
}

export type DriverAccessResult =
  | { valid: true; data: DriverData }
  | { valid: false; reason: 'expired' | 'invalid' | 'used'; message?: string };

// Driver-flavored action labels — NOT shared with wizard's STAGE_ACTION_LABELS
// (note: 'return' is 'חזור לבסיס' in driver, vs wizard's 'חזור'; 'maintenance' missing)
export const ACTION_LABEL_DRIVER: Partial<Record<DriverStageAction, string>> = {
  departure: 'יציאה',
  loading: 'העמסה',
  unloading: 'פריקה',
  return: 'חזור לבסיס',
  transfer: 'העברה',
  // maintenance: intentionally absent — stages with this action fall to default 'הושלם'
};

export function getDriverActionLabel(action: DriverStageAction): string {
  return ACTION_LABEL_DRIVER[action] ?? '';
}
