// Readiness types + threshold helpers — ported from
// projects/dispatch-system/app/src/components/commander/readiness-types.ts

export interface MobilizationReport {
  id: string;
  team_id: string;
  team_name: string;
  report_date: string;
  authorized_strength: number;
  current_manning: number;
  called_up: number;
  reported: number;
  exemptions: number;
  external_screening: number;
  deployed_screening: number;
  idf_wide: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface EquipmentReport {
  id: string;
  team_id: string;
  team_name: string;
  category_id: string;
  category_name: string;
  category_display_order: number;
  report_date: string;
  authorized: number;
  manned: number;
  operational: number;
  faults: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const MOBILIZATION_THRESHOLDS = { green: 70, yellow: 40 };
export const EQUIPMENT_THRESHOLDS    = { green: 80, yellow: 60 };

export type ThresholdLevel = 'green' | 'yellow' | 'red';

export function getThresholdColor(value: number, t: { green: number; yellow: number }): ThresholdLevel {
  if (value >= t.green) return 'green';
  if (value >= t.yellow) return 'yellow';
  return 'red';
}

export function calcRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const THRESHOLD_STYLES: Record<ThresholdLevel, { bg: string; text: string }> = {
  green:  { bg: 'rgba(16,185,129,0.10)', text: '#047857' },
  yellow: { bg: 'rgba(245,158,11,0.10)', text: '#B45309' },
  red:    { bg: 'rgba(239,68,68,0.10)',  text: '#B91C1C' },
};

// Hex colors for SVG strokes (gauge), matching threshold levels
export const THRESHOLD_HEX: Record<ThresholdLevel, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
};

// Hebrew field labels for mobilization (verbatim from React)
export const MOBILIZATION_LABELS = {
  authorized_strength: 'תקן',
  current_manning: 'מצבה',
  called_up: 'זומנו',
  reported: 'התייצבו',
  exemptions: 'פטורים',
  external_screening: 'מרכז בחינה',
  deployed_screening: 'אנשי שלוח',
  idf_wide: 'צה"ל',
} as const;
export type MobilizationField = keyof typeof MOBILIZATION_LABELS;
export const MOBILIZATION_FIELDS: MobilizationField[] = [
  'authorized_strength', 'current_manning', 'called_up', 'reported',
  'exemptions', 'external_screening', 'deployed_screening', 'idf_wide',
];

// Hebrew field labels for equipment
export const EQUIPMENT_LABELS = {
  authorized: 'תקן',
  manned: 'מאויש',
  operational: 'תקינים',
  faults: 'תקלות',
} as const;
export type EquipmentField = keyof typeof EQUIPMENT_LABELS;
export const EQUIPMENT_FIELDS: EquipmentField[] = ['authorized', 'manned', 'operational', 'faults'];
