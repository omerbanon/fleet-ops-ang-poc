import type { DriverData, DriverStage } from '../models/driver.model';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function tomorrowStr(): string {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function stage(args: Partial<DriverStage> & Pick<DriverStage, 'id' | 'stage_order' | 'stage_name' | 'action' | 'origin' | 'destination' | 'departure_time' | 'arrival_time' | 'stage_status'>): DriverStage {
  return {
    equipment_cargo: null,
    contact_person_name: null,
    contact_person_phone: null,
    actual_departure_time: null,
    actual_completion_time: null,
    maps_url: null,
    routes: [],
    ...args,
  };
}

export const MOCK_DRIVER_ACTIVE: DriverData = {
  mission: {
    id: 'm-active-001',
    mission_name: 'הובלת ציוד למחנה 80',
    mission_date: todayStr(),
    status: 'active',
    commander_name: 'דני כהן',
    commander_phone: '050-1234567',
  },
  truck: {
    truck_key: 't-001',
    truck_label: '347-22-303',
    crew: [
      { name: 'יוסי לוי', phone: '052-9876543', role: 'driver', crew_position: 0 },
      { name: 'משה אברהם', phone: '054-1122334', role: 'co_driver', crew_position: 1 },
    ],
  },
  stages: [
    stage({
      id: 's-1', stage_order: 1, stage_name: "שלב א'", action: 'departure',
      origin: 'מחנה 100', destination: 'מחסן רכש',
      departure_time: '06:00', arrival_time: '06:45',
      stage_status: 'completed',
      actual_departure_time: '06:02', actual_completion_time: '06:48',
    }),
    stage({
      id: 's-2', stage_order: 2, stage_name: "שלב ב'", action: 'loading',
      origin: 'מחסן רכש', destination: 'מחסן רכש',
      equipment_cargo: 'מזרונים, שמיכות, ערכות חירום',
      contact_person_name: 'רותי שמש', contact_person_phone: '03-7766544',
      departure_time: '06:45', arrival_time: '07:15',
      buffer_minutes: 30,
      stage_status: 'departed',
      actual_departure_time: '06:48', actual_completion_time: null,
    }),
    stage({
      id: 's-3', stage_order: 3, stage_name: "שלב ג'", action: 'unloading',
      origin: 'מחסן רכש', destination: 'מחנה 80',
      equipment_cargo: 'מזרונים, שמיכות, ערכות חירום',
      contact_person_name: 'אילן רז', contact_person_phone: '050-7788990',
      departure_time: '07:45', arrival_time: '08:30',
      buffer_minutes: 30,
      stage_status: 'pending',
    }),
    stage({
      id: 's-4', stage_order: 4, stage_name: "שלב ד'", action: 'return',
      origin: 'מחנה 80', destination: 'מחנה 100',
      departure_time: '09:00', arrival_time: '09:45',
      stage_status: 'pending',
    }),
  ],
  personnel: [],
};

export const MOCK_DRIVER_SCHEDULED: DriverData = {
  mission: {
    id: 'm-scheduled-001',
    mission_name: 'אספקה למוצב הצפוני',
    mission_date: tomorrowStr(),
    status: 'scheduled',
    commander_name: 'אבי מזרחי',
    commander_phone: '050-2233445',
  },
  truck: {
    truck_key: 't-002',
    truck_label: '512-44-101',
    crew: [
      { name: 'גיל מנדלסון', phone: '054-5566778', role: 'driver', crew_position: 0 },
    ],
  },
  stages: [
    stage({
      id: 's-1', stage_order: 1, stage_name: "שלב א'", action: 'departure',
      origin: 'בסיס דרום', destination: 'מחסן הצפון',
      departure_time: '08:00', arrival_time: '11:30',
      stage_status: 'pending',
    }),
    stage({
      id: 's-2', stage_order: 2, stage_name: "שלב ב'", action: 'unloading',
      origin: 'מחסן הצפון', destination: 'מוצב צפוני',
      equipment_cargo: 'מים, מזון יבש, ציוד רפואי',
      contact_person_name: 'נועם בר', contact_person_phone: '050-3344556',
      departure_time: '11:30', arrival_time: '12:15',
      buffer_minutes: 30,
      stage_status: 'pending',
    }),
    stage({
      id: 's-3', stage_order: 3, stage_name: "שלב ג'", action: 'return',
      origin: 'מוצב צפוני', destination: 'בסיס דרום',
      departure_time: '12:45', arrival_time: '16:15',
      stage_status: 'pending',
    }),
  ],
  personnel: [],
};

export const MOCK_DRIVER_TOKENS: Record<string, DriverData | { expired: true; message?: string }> = {
  'driver-token-active': MOCK_DRIVER_ACTIVE,
  'driver-token-scheduled': MOCK_DRIVER_SCHEDULED,
  'driver-token-expired': { expired: true, message: 'בקש קישור חדש מהמפקד.' },
  'driver-token-completed': { expired: true, message: 'המשימה הושלמה' },
  'driver-token-cancelled': { expired: true, message: 'המשימה בוטלה' },
};
