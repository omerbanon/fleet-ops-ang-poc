// Wizard data model — ported 1:1 from dispatch-system React
// Source: projects/dispatch-system/app/src/components/wizard/

// ── Mission types ────────────────────────────────────────────────────────────

export type MissionType =
  | 'construction' | 'delivery' | 'evacuation' | 'supply'
  | 'transfer' | 'maintenance' | 'distribution' | 'reception'
  | 'vt_training' | 'other';

export const MISSION_TYPES: { value: MissionType; label: string }[] = [
  { value: 'construction',  label: 'בנייה' },
  { value: 'delivery',      label: 'הובלה' },
  { value: 'evacuation',    label: 'פינוי' },
  { value: 'supply',        label: 'אספקה' },
  { value: 'transfer',      label: 'העברה' },
  { value: 'maintenance',   label: 'אחזקה' },
  { value: 'distribution',  label: 'ניפוק' },
  { value: 'reception',     label: 'קליטה' },
  { value: 'vt_training',   label: 'הדרכת זמן יקר' },
  { value: 'other',         label: 'אחר' },
];

export const MISSION_TYPE_LABELS: Record<MissionType, string> =
  Object.fromEntries(MISSION_TYPES.map(m => [m.value, m.label])) as Record<MissionType, string>;

// ── Stage actions ────────────────────────────────────────────────────────────

export type StageAction = 'departure' | 'loading' | 'unloading' | 'return' | 'transfer' | 'maintenance';

export const STAGE_ACTIONS: { value: StageAction; label: string }[] = [
  { value: 'departure',   label: 'יציאה/נסיעה' },
  { value: 'loading',     label: 'העמסה' },
  { value: 'unloading',   label: 'פריקה' },
  { value: 'return',      label: 'חזור' },
  { value: 'transfer',    label: 'העברה' },
  { value: 'maintenance', label: 'אחזקה' },
];

export const STAGE_ACTION_LABELS: Record<StageAction, string> =
  Object.fromEntries(STAGE_ACTIONS.map(a => [a.value, a.label])) as Record<StageAction, string>;

export const BUFFER_SUGGESTION: Record<StageAction, number> = {
  departure: 0,
  loading: 30,
  unloading: 30,
  transfer: 15,
  return: 0,
  maintenance: 0,
};

export const STAGE_NAMES = ["שלב א'", "שלב ב'", "שלב ג'", "שלב ד'", "שלב ה'", "שלב ו'"];

export const INVERSE_ACTION: Record<StageAction, StageAction> = {
  departure: 'loading',
  loading: 'unloading',
  unloading: 'loading',
  return: 'return',
  transfer: 'transfer',
  maintenance: 'maintenance',
};

export function getStageName(order: number): string {
  return STAGE_NAMES[order - 1] ?? `שלב ${order}`;
}

// ── Risks ────────────────────────────────────────────────────────────────────

export type RiskKey = 'alerts' | 'puncture' | 'accident' | 'roadClosures' | 'weather';

export const RISK_FIELDS: { key: RiskKey; label: string }[] = [
  { key: 'alerts',       label: 'א. אזעקות (צבע אדום / חירום ביטחוני)' },
  { key: 'puncture',     label: 'ב. תקר / תקלה מכנית' },
  { key: 'accident',     label: 'ג. תאונת דרכים' },
  { key: 'roadClosures', label: 'ד. חסימות צירים' },
  { key: 'weather',      label: 'ה. מזג אוויר (סערה/ערפל/חום קיצוני)' },
];

export const RISK_TITLES: Record<RiskKey, string> =
  Object.fromEntries(RISK_FIELDS.map(r => [r.key, r.label])) as Record<RiskKey, string>;

export const HEBREW_LETTERS_FOR_CUSTOM_RISKS = ['ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו'];

export interface CustomRisk {
  id: string;          // 'custom_{ts}' — UNDERSCORE
  title: string;
  content: string;
}

// ── Mission basics ───────────────────────────────────────────────────────────

export interface MissionBasics {
  name: string;
  date: string;        // ISO YYYY-MM-DD
  commander: { id: string; name: string; phone: string } | null;
  type: MissionType;
}

export interface Phones {
  trafficCoordinator: string;
  commander: string;
}

// ── Trucks & crew ────────────────────────────────────────────────────────────

export interface WizardTruckAssignment {
  truckId: string;                            // real truck.id or 'custom-truck-{ts}'
  driver: string | null;                      // person.id, or 'custom-{ts}', or null
  coDrivers: (string | null)[];               // dynamic length, default [null, null]
  hasWeapon: Record<string, boolean>;         // personId -> bool
  hasVestHelmet: Record<string, boolean>;
}

export interface CustomPerson {
  id: string;                                 // 'custom-{ts}' — HYPHEN
  fullName: string;
  phone: string;
  role: 'driver' | 'co_driver' | 'both';
}

export interface CustomTruck {
  id: string;                                 // 'custom-truck-{ts}'
  vehicleId: string;
  type: string;                               // default 'משאית'
}

// ── Stages ───────────────────────────────────────────────────────────────────

export interface WizardRoute {
  roadNumber: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  polyline?: string;
}

export interface WizardStage {
  order: number;                              // 1-based
  name: string;                               // STAGE_NAMES[order-1] or fallback
  action: StageAction;
  origin: string;
  destination: string;
  cargo: string;
  contactName: string;
  contactPhone: string;
  departureTime: string;                      // HH:mm
  arrivalTime: string;                        // HH:mm
  bufferMinutes: number;
  routes: { primary: WizardRoute | null; backup: WizardRoute | null };
}

// ── Wizard state container ───────────────────────────────────────────────────

export interface WizardMissionData {
  missionBasics: MissionBasics;
  enabledRisks: string[];                     // built-in keys + custom ids
  riskManagement: Partial<Record<RiskKey, string>>;
  customRisks: CustomRisk[];
  phones: Phones;
  truckAssignments: WizardTruckAssignment[];
  customTrucks: CustomTruck[];
  customPeople: CustomPerson[];
  stages: WizardStage[];
}

export interface WizardState {
  currentStep: number;                        // 1-6
  completedSteps: number[];
  editingMissionId: string | null;
  isEditingScheduledOrActive: boolean;
  draftId: string | null;
  originalMissionData: WizardMissionData | null;
  missionData: WizardMissionData;
}

// ── Validation helpers ───────────────────────────────────────────────────────

export function isStep1Valid(d: WizardMissionData): boolean {
  const b = d.missionBasics;
  return !!b.name && !!b.date && !!b.commander && !!b.type;
}

export function isStep3Valid(d: WizardMissionData): boolean {
  if (d.truckAssignments.length === 0) return false;
  return d.truckAssignments.every(t => !!t.driver);
}

export function isStep4Valid(d: WizardMissionData): boolean {
  if (d.stages.length === 0) return false;
  return d.stages.every(s => !!s.action && !!s.origin && !!s.destination);
}

export function canProceed(step: number, d: WizardMissionData): boolean {
  switch (step) {
    case 1: return isStep1Valid(d);
    case 2: return true;       // no validation on step 2
    case 3: return isStep3Valid(d);
    case 4: return isStep4Valid(d);
    case 5: return true;
    case 6: return true;
    default: return false;
  }
}
