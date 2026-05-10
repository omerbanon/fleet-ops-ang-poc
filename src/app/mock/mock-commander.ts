import type { TeamTotal } from '../models/commander.model';
import type { EquipmentCategory, EquipmentReport, MobilizationReport } from '../models/readiness.model';
import type { Mission } from '../models/mission.model';
import { getTodayStr } from '../models/mission.model';

const today = getTodayStr();

// Two teams the user-002 commander has access to
export const MOCK_COMMANDER_TEAMS = [
  { id: 'team-001', name: 'צוות הובלות' },
  { id: 'team-002', name: 'צוות חירום' },
];

export const MOCK_TEAM_TOTALS: TeamTotal[] = [
  { team_id: 'team-001', team_name: 'צוות הובלות', trucks: 12, people: 38 },
  { team_id: 'team-002', team_name: 'צוות חירום', trucks: 8,  people: 24 },
];

export const MOCK_EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  { id: 'cat-trucks',    name: 'משאיות',          display_order: 1 },
  { id: 'cat-radios',    name: 'מכשירי קשר',     display_order: 2 },
  { id: 'cat-weapons',   name: 'נשק אישי',       display_order: 3 },
  { id: 'cat-night-vis', name: 'ראיית לילה',     display_order: 4 },
];

function mob(team: typeof MOCK_COMMANDER_TEAMS[number], values: {
  auth: number; manning: number; called: number; reported: number;
  exempt?: number; ext?: number; dep?: number; idf?: number;
}): MobilizationReport {
  return {
    id: `mob-${team.id}-${today}`,
    team_id: team.id,
    team_name: team.name,
    report_date: today,
    authorized_strength: values.auth,
    current_manning: values.manning,
    called_up: values.called,
    reported: values.reported,
    exemptions: values.exempt ?? 0,
    external_screening: values.ext ?? 0,
    deployed_screening: values.dep ?? 0,
    idf_wide: values.idf ?? 0,
    notes: null,
    created_by: 'user-002',
    created_at: `${today}T06:00:00Z`,
    updated_at: `${today}T08:00:00Z`,
  };
}

export const MOCK_MOBILIZATION_REPORTS: MobilizationReport[] = [
  mob(MOCK_COMMANDER_TEAMS[0], { auth: 38, manning: 35, called: 30, reported: 26, exempt: 2, ext: 1, dep: 1 }),
  mob(MOCK_COMMANDER_TEAMS[1], { auth: 24, manning: 22, called: 22, reported: 14, exempt: 1, ext: 1, dep: 0 }),
];

function eq(team: typeof MOCK_COMMANDER_TEAMS[number], cat: EquipmentCategory, values: {
  auth: number; manned: number; op: number; faults: number;
}): EquipmentReport {
  return {
    id: `eq-${team.id}-${cat.id}-${today}`,
    team_id: team.id,
    team_name: team.name,
    category_id: cat.id,
    category_name: cat.name,
    category_display_order: cat.display_order,
    report_date: today,
    authorized: values.auth,
    manned: values.manned,
    operational: values.op,
    faults: values.faults,
    notes: null,
    created_by: 'user-002',
    created_at: `${today}T06:00:00Z`,
    updated_at: `${today}T08:00:00Z`,
  };
}

export const MOCK_EQUIPMENT_REPORTS: EquipmentReport[] = [
  eq(MOCK_COMMANDER_TEAMS[0], MOCK_EQUIPMENT_CATEGORIES[0], { auth: 12, manned: 11, op: 10, faults: 1 }),
  eq(MOCK_COMMANDER_TEAMS[0], MOCK_EQUIPMENT_CATEGORIES[1], { auth: 25, manned: 22, op: 18, faults: 4 }),
  eq(MOCK_COMMANDER_TEAMS[0], MOCK_EQUIPMENT_CATEGORIES[2], { auth: 38, manned: 35, op: 33, faults: 2 }),
  eq(MOCK_COMMANDER_TEAMS[0], MOCK_EQUIPMENT_CATEGORIES[3], { auth: 15, manned: 12, op: 8,  faults: 4 }),

  eq(MOCK_COMMANDER_TEAMS[1], MOCK_EQUIPMENT_CATEGORIES[0], { auth: 8,  manned: 7,  op: 7,  faults: 0 }),
  eq(MOCK_COMMANDER_TEAMS[1], MOCK_EQUIPMENT_CATEGORIES[1], { auth: 16, manned: 14, op: 13, faults: 1 }),
  eq(MOCK_COMMANDER_TEAMS[1], MOCK_EQUIPMENT_CATEGORIES[2], { auth: 24, manned: 22, op: 20, faults: 2 }),
  eq(MOCK_COMMANDER_TEAMS[1], MOCK_EQUIPMENT_CATEGORIES[3], { auth: 10, manned: 8,  op: 5,  faults: 3 }),
];

// Synthetic team-002 missions so the commander grid shows two teams.
// Reuses minimal Mission shape — mission_personnel + mission_stages empty for simplicity.
export const MOCK_TEAM_002_MISSIONS: Mission[] = [
  {
    id: 'm-t2-001',
    mission_name: 'תגבור צוות חירום למוצב',
    mission_date: today,
    commander_name: 'אבי מזרחי',
    status: 'active',
    mission_type: 'evacuation',
    enabled_risks: ['weather'],
    commander_phone: '050-2233445',
    traffic_coordinator_phone: '050-9988776',
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: 'team-002',
    team_name: 'צוות חירום',
    created_at: `${today}T05:30:00Z`,
    updated_at: `${today}T07:00:00Z`,
    mission_stages: [],
    mission_personnel: [],
    custom_risks: [],
  },
  {
    id: 'm-t2-002',
    mission_name: 'אספקה למחנה הצפוני',
    mission_date: today,
    commander_name: 'אבי מזרחי',
    status: 'scheduled',
    mission_type: 'supply',
    enabled_risks: [],
    commander_phone: '050-2233445',
    traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: 'team-002',
    team_name: 'צוות חירום',
    created_at: `${today}T05:00:00Z`,
    updated_at: `${today}T05:00:00Z`,
    mission_stages: [],
    mission_personnel: [],
    custom_risks: [],
  },
];
