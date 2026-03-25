// Shared types for the dashboard — ported from dispatch-system types.ts

export interface MissionPerson {
  id: string;
  full_name: string;
  phone: string;
  role: string;
}

export interface MissionTruck {
  id: string;
  vehicle_id: string;
  type: string;
}

export interface MissionRoute {
  id: string;
  route_type: 'primary' | 'backup';
  road_number: string;
  distance_km: number | null;
  duration_minutes: number | null;
  polyline: string | null;
}

export interface TruckStageProgress {
  id: string;
  mission_stage_id: string;
  truck_key: string;
  stage_status: 'pending' | 'departed' | 'completed';
  actual_departure_time: string | null;
  actual_completion_time: string | null;
}

export interface MissionStage {
  id: string;
  mission_id: string;
  stage_order: number;
  stage_name: string;
  action: 'loading' | 'unloading' | 'return' | 'transfer';
  origin: string;
  destination: string;
  equipment_cargo: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  stage_status: 'pending' | 'departed' | 'completed';
  actual_departure_time: string | null;
  actual_completion_time: string | null;
  routes: MissionRoute[];
  truck_stage_progress?: TruckStageProgress[];
}

export interface MissionPersonnel {
  id: string;
  mission_id: string;
  truck_id: string | null;
  person_id: string | null;
  role_in_mission: 'driver' | 'co_driver' | 'both' | 'commander';
  crew_position: number;
  custom_person_name: string | null;
  custom_truck_name: string | null;
  people: MissionPerson | null;
  trucks: MissionTruck | null;
}

export interface StopPoint {
  id: string;
  mission_id: string;
  stop_order: number;
  description: string;
  location: string;
  notes: string;
}

export type MissionStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface Mission {
  id: string;
  mission_name: string;
  mission_date: string;
  commander_name: string;
  status: MissionStatus;
  mission_type: string | null;
  enabled_risks: string[] | null;
  commander_phone: string | null;
  traffic_coordinator_phone: string | null;
  risk_alerts: string | null;
  risk_puncture_plan: string | null;
  risk_accident_plan: string | null;
  risk_road_closures: string | null;
  risk_weather: string | null;
  team_id: string;
  team_name?: string;
  created_at: string;
  updated_at: string;
  mission_stages: MissionStage[];
  mission_personnel: MissionPersonnel[];
  stop_points?: StopPoint[];
  custom_risks?: { id: string; title: string; content: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getTruckCount(mission: Mission): number {
  const truckIds = new Set<string>();
  for (const mp of mission.mission_personnel) {
    const key = mp.truck_id ?? mp.custom_truck_name ?? '';
    if (key) truckIds.add(key);
  }
  return truckIds.size;
}

export function getCrewCount(mission: Mission): number {
  return mission.mission_personnel.length;
}

export function getPersonName(mp: MissionPersonnel): string {
  const name = mp.people?.full_name ?? mp.custom_person_name ?? '\u2014';
  if (/^custom-\d+$/.test(name)) return '\u2014';
  return name;
}

export function getTruckLabel(mp: MissionPersonnel): string {
  return mp.trucks?.vehicle_id ?? mp.custom_truck_name ?? '\u2014';
}

export function getTruckType(mp: MissionPersonnel): string {
  return mp.trucks?.type ?? '';
}

export const HEB_LETTERS = ['\u05D0\u05F3', '\u05D1\u05F3', '\u05D2\u05F3', '\u05D3\u05F3', '\u05D4\u05F3', '\u05D5\u05F3', '\u05D6\u05F3', '\u05D7\u05F3', '\u05D8\u05F3', '\u05D9\u05F3'];

export const ACTION_LABELS: Record<string, string> = {
  loading: '\u05D4\u05E2\u05DE\u05E1\u05D4',
  unloading: '\u05E4\u05E8\u05D9\u05E7\u05D4',
  return: '\u05D7\u05D6\u05D5\u05E8',
  transfer: '\u05D4\u05E2\u05D1\u05E8\u05D4',
};

export const STATUS_LABELS: Record<MissionStatus, string> = {
  draft: '\u05D8\u05D9\u05D5\u05D8\u05D4',
  scheduled: '\u05DE\u05EA\u05D5\u05D6\u05DE\u05DF',
  active: '\u05E4\u05E2\u05D9\u05DC',
  completed: '\u05D4\u05D5\u05E9\u05DC\u05DD',
  cancelled: '\u05D1\u05D5\u05D8\u05DC',
};

export const STAGE_STATUS_LABELS: Record<string, string> = {
  pending: '\u05DE\u05DE\u05EA\u05D9\u05DF',
  departed: '\u05D1\u05D3\u05E8\u05DA',
  completed: '\u05D4\u05D5\u05E9\u05DC\u05DD',
};

export interface StatusColor {
  bg: string;
  text: string;
  dot?: string;
}

export const STATUS_COLORS: Record<MissionStatus, StatusColor> = {
  draft: { bg: 'status-draft', text: 'status-draft' },
  active: { bg: 'status-active', text: 'status-active', dot: 'status-active-dot' },
  scheduled: { bg: 'status-scheduled', text: 'status-scheduled' },
  completed: { bg: 'status-completed', text: 'status-completed' },
  cancelled: { bg: 'status-cancelled', text: 'status-cancelled' },
};

// ── Grouping helpers ────────────────────────────────────────────────────────

export interface TruckGroup {
  key: string;
  label: string;
  type: string;
  driver: string | null;
  coDrivers: string[];
}

export function groupByTruck(personnel: MissionPersonnel[]): TruckGroup[] {
  const map = new Map<string, TruckGroup>();

  for (const mp of personnel) {
    const key = mp.truck_id ?? mp.custom_truck_name ?? '__none__';
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: getTruckLabel(mp),
        type: getTruckType(mp),
        driver: null,
        coDrivers: [],
      });
    }
    const group = map.get(key)!;
    const name = getPersonName(mp);

    if (mp.role_in_mission === 'driver' || mp.role_in_mission === 'both') {
      group.driver = name;
    } else if (mp.role_in_mission === 'co_driver') {
      group.coDrivers.push(name);
    }
  }

  return Array.from(map.values());
}

// ── Date helpers ────────────────────────────────────────────────────────────

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDD_MM(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export function formatDateHeader(dateStr: string): string {
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  if (dateStr === today) return '\u05D4\u05D9\u05D5\u05DD';
  if (dateStr === tomorrow) return '\u05DE\u05D7\u05E8';
  return formatDD_MM(dateStr);
}

export function formatTimeRange(departure: string | null, arrival: string | null): string {
  const dep = departure?.slice(0, 5) ?? '\u2014';
  const arr = arrival?.slice(0, 5) ?? '\u2014';
  return `${dep} \u2013 ${arr}`;
}

export function sortedStages(stages: MissionStage[]): MissionStage[] {
  return [...stages].sort((a, b) => a.stage_order - b.stage_order);
}

// Duration helpers for completion modal
export function parseTimeToMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} \u05D3\u05E7\u05D5\u05EA`;
  if (minutes === 0) return `${hours} \u05E9\u05E2\u05D5\u05EA`;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function calcTotalDuration(mission: Mission): string {
  const stages = mission.mission_stages;
  if (!stages.length) return '--';

  const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  let firstDeparture: string | null = null;
  for (const s of sorted) {
    if (s.departure_time) { firstDeparture = s.departure_time; break; }
  }
  let lastArrival: string | null = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].arrival_time) { lastArrival = sorted[i].arrival_time; break; }
  }

  if (firstDeparture && lastArrival) {
    const startMin = parseTimeToMinutes(firstDeparture);
    const endMin = parseTimeToMinutes(lastArrival);
    if (startMin !== null && endMin !== null && endMin > startMin) {
      return formatDuration(endMin - startMin);
    }
  }

  let totalRouteMinutes = 0;
  let hasAnyDuration = false;
  for (const s of sorted) {
    const primary = s.routes?.find(r => r.route_type === 'primary');
    if (primary?.duration_minutes) {
      totalRouteMinutes += primary.duration_minutes;
      hasAnyDuration = true;
    }
  }
  if (hasAnyDuration && totalRouteMinutes > 0) {
    return `~${formatDuration(totalRouteMinutes)}`;
  }

  return '--';
}
