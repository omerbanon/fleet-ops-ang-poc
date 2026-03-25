import type { Mission } from '../models/mission.model';
import { getTodayStr, getTomorrowStr } from '../models/mission.model';

const today = getTodayStr();
const tomorrow = getTomorrowStr();

// Future date: 5 days from now
const futureDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

// Past date: 2 days ago
const pastDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const pastDate2 = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const TEAM_ID = 'team-001';

export const MOCK_MISSIONS: Mission[] = [
  // 1. Active mission with truck_stage_progress
  {
    id: 'm-001',
    mission_name: 'הובלת ציוד לבסיס צפוני',
    mission_date: today,
    commander_name: 'רדי ב',
    status: 'active',
    mission_type: 'delivery',
    enabled_risks: ['puncture', 'weather'],
    commander_phone: '050-1234567',
    traffic_coordinator_phone: '050-7654321',
    risk_alerts: 'כביש 6 — עומסים צפויים',
    risk_puncture_plan: 'ערכת תיקון בכל משאית',
    risk_accident_plan: 'התקשר למוקד 100',
    risk_road_closures: null,
    risk_weather: 'גשם קל צפוי',
    team_id: TEAM_ID,
    team_name: 'צוות הובלות',
    created_at: `${today}T06:00:00Z`,
    updated_at: `${today}T08:30:00Z`,
    mission_stages: [
      {
        id: 'ms-001-1',
        mission_id: 'm-001',
        stage_order: 1,
        stage_name: 'שלב א׳',
        action: 'loading',
        origin: 'בסיס חיפה',
        destination: 'מחסן מרכזי',
        equipment_cargo: 'ציוד תקשורת',
        contact_person_name: 'יוסי כהן',
        contact_person_phone: '050-1111111',
        departure_time: '07:00',
        arrival_time: '08:30',
        stage_status: 'completed',
        actual_departure_time: '07:05',
        actual_completion_time: '08:25',
        routes: [
          { id: 'r-001-1', route_type: 'primary', road_number: 'כביש 2', distance_km: 45, duration_minutes: 55, polyline: null },
          { id: 'r-001-2', route_type: 'backup', road_number: 'כביש 4', distance_km: 52, duration_minutes: 65, polyline: null },
        ],
        truck_stage_progress: [
          { id: 'tsp-1', mission_stage_id: 'ms-001-1', truck_key: 't-001', stage_status: 'completed', actual_departure_time: '07:05', actual_completion_time: '08:20' },
          { id: 'tsp-2', mission_stage_id: 'ms-001-1', truck_key: 't-002', stage_status: 'completed', actual_departure_time: '07:10', actual_completion_time: '08:25' },
        ],
      },
      {
        id: 'ms-001-2',
        mission_id: 'm-001',
        stage_order: 2,
        stage_name: 'שלב ב׳',
        action: 'transfer',
        origin: 'מחסן מרכזי',
        destination: 'בסיס צפוני',
        equipment_cargo: 'ציוד תקשורת + מחשבים',
        contact_person_name: 'דני לוי',
        contact_person_phone: '050-2222222',
        departure_time: '09:00',
        arrival_time: '11:00',
        stage_status: 'departed',
        actual_departure_time: '09:10',
        actual_completion_time: null,
        routes: [
          { id: 'r-002-1', route_type: 'primary', road_number: 'כביש 6', distance_km: 80, duration_minutes: 90, polyline: null },
        ],
        truck_stage_progress: [
          { id: 'tsp-3', mission_stage_id: 'ms-001-2', truck_key: 't-001', stage_status: 'departed', actual_departure_time: '09:10', actual_completion_time: null },
          { id: 'tsp-4', mission_stage_id: 'ms-001-2', truck_key: 't-002', stage_status: 'pending', actual_departure_time: null, actual_completion_time: null },
        ],
      },
      {
        id: 'ms-001-3',
        mission_id: 'm-001',
        stage_order: 3,
        stage_name: 'שלב ג׳',
        action: 'unloading',
        origin: 'בסיס צפוני',
        destination: 'מחסן יעד',
        equipment_cargo: null,
        contact_person_name: null,
        contact_person_phone: null,
        departure_time: '11:30',
        arrival_time: '12:00',
        stage_status: 'pending',
        actual_departure_time: null,
        actual_completion_time: null,
        routes: [],
        truck_stage_progress: [
          { id: 'tsp-5', mission_stage_id: 'ms-001-3', truck_key: 't-001', stage_status: 'pending', actual_departure_time: null, actual_completion_time: null },
          { id: 'tsp-6', mission_stage_id: 'ms-001-3', truck_key: 't-002', stage_status: 'pending', actual_departure_time: null, actual_completion_time: null },
        ],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-001', mission_id: 'm-001', truck_id: 't-001', person_id: 'p-001',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-001', full_name: 'נתנאל א', phone: '050-3001001', role: 'driver' },
        trucks: { id: 't-001', vehicle_id: '145', type: 'DAF' },
      },
      {
        id: 'mp-002', mission_id: 'm-001', truck_id: 't-001', person_id: 'p-002',
        role_in_mission: 'co_driver', crew_position: 2,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-002', full_name: 'ליעד א', phone: '050-3001002', role: 'co_driver' },
        trucks: { id: 't-001', vehicle_id: '145', type: 'DAF' },
      },
      {
        id: 'mp-003', mission_id: 'm-001', truck_id: 't-002', person_id: 'p-003',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-003', full_name: 'כפיר ה', phone: '050-3001003', role: 'driver' },
        trucks: { id: 't-002', vehicle_id: '094', type: 'DAF' },
      },
      {
        id: 'mp-004', mission_id: 'm-001', truck_id: 't-002', person_id: 'p-004',
        role_in_mission: 'co_driver', crew_position: 2,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-004', full_name: 'מקסים מ', phone: '050-3001004', role: 'co_driver' },
        trucks: { id: 't-002', vehicle_id: '094', type: 'DAF' },
      },
    ],
  },

  // 2. Scheduled mission — today
  {
    id: 'm-002',
    mission_name: 'פינוי מחסן דרומי',
    mission_date: today,
    commander_name: 'רדי ב',
    status: 'scheduled',
    mission_type: 'evacuation',
    enabled_risks: null,
    commander_phone: '050-1234567',
    traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${today}T05:00:00Z`,
    updated_at: `${today}T05:00:00Z`,
    mission_stages: [
      {
        id: 'ms-002-1', mission_id: 'm-002', stage_order: 1, stage_name: 'שלב א׳',
        action: 'loading', origin: 'מחסן דרומי', destination: 'בסיס מרכזי',
        equipment_cargo: 'ריהוט משרדי', contact_person_name: 'אבי שלום', contact_person_phone: '050-3333333',
        departure_time: '14:00', arrival_time: '16:00',
        stage_status: 'pending', actual_departure_time: null, actual_completion_time: null,
        routes: [{ id: 'r-003-1', route_type: 'primary', road_number: 'כביש 40', distance_km: 60, duration_minutes: 75, polyline: null }],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-005', mission_id: 'm-002', truck_id: 't-003', person_id: 'p-005',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-005', full_name: 'בוריס פ', phone: '050-3001005', role: 'driver' },
        trucks: { id: 't-003', vehicle_id: '144', type: 'DAF' },
      },
    ],
  },

  // 3. Scheduled mission — tomorrow
  {
    id: 'm-003',
    mission_name: 'העברת דלק לבסיס מזרחי',
    mission_date: tomorrow,
    commander_name: 'רדי ב',
    status: 'scheduled',
    mission_type: 'delivery',
    enabled_risks: ['puncture'],
    commander_phone: '050-1234567',
    traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: 'ערכת תיקון', risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${today}T04:00:00Z`,
    updated_at: `${today}T04:00:00Z`,
    mission_stages: [
      {
        id: 'ms-003-1', mission_id: 'm-003', stage_order: 1, stage_name: 'שלב א׳',
        action: 'loading', origin: 'מחסן דלק', destination: 'בסיס מזרחי',
        equipment_cargo: 'דלק סולר', contact_person_name: null, contact_person_phone: null,
        departure_time: '06:00', arrival_time: '09:00',
        stage_status: 'pending', actual_departure_time: null, actual_completion_time: null,
        routes: [{ id: 'r-004-1', route_type: 'primary', road_number: 'כביש 90', distance_km: 120, duration_minutes: 150, polyline: null }],
      },
      {
        id: 'ms-003-2', mission_id: 'm-003', stage_order: 2, stage_name: 'שלב ב׳',
        action: 'return', origin: 'בסיס מזרחי', destination: 'מחסן דלק',
        equipment_cargo: null, contact_person_name: null, contact_person_phone: null,
        departure_time: '10:00', arrival_time: '13:00',
        stage_status: 'pending', actual_departure_time: null, actual_completion_time: null,
        routes: [{ id: 'r-005-1', route_type: 'primary', road_number: 'כביש 90', distance_km: 120, duration_minutes: 150, polyline: null }],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-006', mission_id: 'm-003', truck_id: 't-004', person_id: 'p-006',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-006', full_name: 'חזי ע', phone: '050-3001006', role: 'driver' },
        trucks: { id: 't-004', vehicle_id: '0163', type: 'תובלתית' },
      },
      {
        id: 'mp-007', mission_id: 'm-003', truck_id: 't-004', person_id: 'p-007',
        role_in_mission: 'co_driver', crew_position: 2,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-007', full_name: 'עדי ב', phone: '050-3001007', role: 'co_driver' },
        trucks: { id: 't-004', vehicle_id: '0163', type: 'תובלתית' },
      },
    ],
  },

  // 4. Draft mission
  {
    id: 'm-004',
    mission_name: 'שינוע חלפים למוסך',
    mission_date: tomorrow,
    commander_name: 'רדי ב',
    status: 'draft',
    mission_type: null,
    enabled_risks: null,
    commander_phone: null, traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${today}T03:00:00Z`,
    updated_at: `${today}T07:15:00Z`,
    mission_stages: [],
    mission_personnel: [],
  },

  // 5. Completed mission (past)
  {
    id: 'm-005',
    mission_name: 'אספקה שבועית — בסיס 7',
    mission_date: pastDate,
    commander_name: 'רדי ב',
    status: 'completed',
    mission_type: 'delivery',
    enabled_risks: null,
    commander_phone: '050-1234567', traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${pastDate}T05:00:00Z`,
    updated_at: `${pastDate}T14:00:00Z`,
    mission_stages: [
      {
        id: 'ms-005-1', mission_id: 'm-005', stage_order: 1, stage_name: 'שלב א׳',
        action: 'loading', origin: 'מחסן ראשי', destination: 'בסיס 7',
        equipment_cargo: 'מזון ושתייה', contact_person_name: null, contact_person_phone: null,
        departure_time: '06:00', arrival_time: '08:00',
        stage_status: 'completed', actual_departure_time: '06:10', actual_completion_time: '07:55',
        routes: [],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-008', mission_id: 'm-005', truck_id: 't-005', person_id: 'p-008',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-008', full_name: 'איתי א', phone: '050-3001008', role: 'driver' },
        trucks: { id: 't-005', vehicle_id: '208', type: 'DAF' },
      },
    ],
  },

  // 6. Completed mission (older past)
  {
    id: 'm-006',
    mission_name: 'פינוי פסולת — אזור תעשייה',
    mission_date: pastDate2,
    commander_name: 'רדי ב',
    status: 'completed',
    mission_type: 'evacuation',
    enabled_risks: null,
    commander_phone: '050-1234567', traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${pastDate2}T05:00:00Z`,
    updated_at: `${pastDate2}T12:00:00Z`,
    mission_stages: [
      {
        id: 'ms-006-1', mission_id: 'm-006', stage_order: 1, stage_name: 'שלב א׳',
        action: 'loading', origin: 'אזור תעשייה', destination: 'אתר פסולת',
        equipment_cargo: 'פסולת בניין', contact_person_name: null, contact_person_phone: null,
        departure_time: '07:00', arrival_time: '10:00',
        stage_status: 'completed', actual_departure_time: '07:00', actual_completion_time: '09:45',
        routes: [],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-009', mission_id: 'm-006', truck_id: 't-003', person_id: 'p-009',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-009', full_name: 'גבי א', phone: '050-3001009', role: 'driver' },
        trucks: { id: 't-003', vehicle_id: '144', type: 'DAF' },
      },
    ],
  },

  // 7. Cancelled mission
  {
    id: 'm-007',
    mission_name: 'תרגיל חירום — בוטל',
    mission_date: pastDate,
    commander_name: 'רדי ב',
    status: 'cancelled',
    mission_type: 'exercise',
    enabled_risks: null,
    commander_phone: '050-1234567', traffic_coordinator_phone: null,
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: null, risk_weather: null,
    team_id: TEAM_ID,
    created_at: `${pastDate}T04:00:00Z`,
    updated_at: `${pastDate}T06:00:00Z`,
    mission_stages: [],
    mission_personnel: [],
  },

  // 8. Future scheduled mission
  {
    id: 'm-008',
    mission_name: 'שינוע ציוד לתרגיל גדול',
    mission_date: futureDate,
    commander_name: 'רדי ב',
    status: 'scheduled',
    mission_type: 'delivery',
    enabled_risks: ['weather', 'road_closures'],
    commander_phone: '050-1234567', traffic_coordinator_phone: '050-8888888',
    risk_alerts: null, risk_puncture_plan: null, risk_accident_plan: null,
    risk_road_closures: 'סגירת כביש 1 צפויה', risk_weather: 'גשמים כבדים',
    team_id: TEAM_ID,
    created_at: `${today}T02:00:00Z`,
    updated_at: `${today}T02:00:00Z`,
    mission_stages: [
      {
        id: 'ms-008-1', mission_id: 'm-008', stage_order: 1, stage_name: 'שלב א׳',
        action: 'loading', origin: 'בסיס מרכזי', destination: 'שטח תרגיל',
        equipment_cargo: 'ציוד כבד', contact_person_name: 'מיכאל ג', contact_person_phone: '050-5555555',
        departure_time: '05:00', arrival_time: '09:00',
        stage_status: 'pending', actual_departure_time: null, actual_completion_time: null,
        routes: [{ id: 'r-008-1', route_type: 'primary', road_number: 'כביש 1', distance_km: 150, duration_minutes: 180, polyline: null }],
      },
    ],
    mission_personnel: [
      {
        id: 'mp-010', mission_id: 'm-008', truck_id: 't-001', person_id: 'p-010',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-010', full_name: 'שחר ל', phone: '050-3001010', role: 'driver' },
        trucks: { id: 't-001', vehicle_id: '145', type: 'DAF' },
      },
      {
        id: 'mp-011', mission_id: 'm-008', truck_id: 't-001', person_id: 'p-011',
        role_in_mission: 'co_driver', crew_position: 2,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-011', full_name: 'שחר מ', phone: '050-3001011', role: 'co_driver' },
        trucks: { id: 't-001', vehicle_id: '145', type: 'DAF' },
      },
      {
        id: 'mp-012', mission_id: 'm-008', truck_id: 't-005', person_id: 'p-012',
        role_in_mission: 'driver', crew_position: 1,
        custom_person_name: null, custom_truck_name: null,
        people: { id: 'p-012', full_name: 'ירון ק', phone: '050-3001012', role: 'driver' },
        trucks: { id: 't-005', vehicle_id: '208', type: 'DAF' },
      },
    ],
  },
];

export const MOCK_TRUCKS = [
  { id: 't-001', vehicle_id: '145', type: 'DAF' },
  { id: 't-002', vehicle_id: '094', type: 'DAF' },
  { id: 't-003', vehicle_id: '144', type: 'DAF' },
  { id: 't-004', vehicle_id: '0163', type: 'תובלתית' },
  { id: 't-005', vehicle_id: '208', type: 'DAF' },
];

export const MOCK_PEOPLE = [
  { id: 'p-001', full_name: 'נתנאל א', phone: '050-3001001', role: 'driver' },
  { id: 'p-002', full_name: 'ליעד א', phone: '050-3001002', role: 'co_driver' },
  { id: 'p-003', full_name: 'כפיר ה', phone: '050-3001003', role: 'driver' },
  { id: 'p-004', full_name: 'מקסים מ', phone: '050-3001004', role: 'co_driver' },
  { id: 'p-005', full_name: 'בוריס פ', phone: '050-3001005', role: 'driver' },
  { id: 'p-006', full_name: 'חזי ע', phone: '050-3001006', role: 'driver' },
  { id: 'p-007', full_name: 'עדי ב', phone: '050-3001007', role: 'co_driver' },
  { id: 'p-008', full_name: 'איתי א', phone: '050-3001008', role: 'driver' },
  { id: 'p-009', full_name: 'גבי א', phone: '050-3001009', role: 'driver' },
  { id: 'p-010', full_name: 'שחר ל', phone: '050-3001010', role: 'driver' },
  { id: 'p-011', full_name: 'שחר מ', phone: '050-3001011', role: 'co_driver' },
  { id: 'p-012', full_name: 'ירון ק', phone: '050-3001012', role: 'driver' },
];
