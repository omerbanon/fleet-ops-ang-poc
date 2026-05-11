// Admin Reports — port of /api/admin/reports response shape

export interface TeamStats {
  team_id: string;
  team_name: string;
  completed_missions: number;
  scheduled_missions: number;
  active_missions: number;
  unique_trucks: number;
  unique_people: number;
}

export type ReportsPreset = 'today' | 'week' | 'month' | 'custom';

export const PRESET_LABELS: Record<ReportsPreset, string> = {
  today: 'היום',
  week: '7 ימים אחרונים',
  month: '30 ימים אחרונים',
  custom: 'טווח מותאם',
};

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDateRange(preset: ReportsPreset): { from: string; to: string } | null {
  if (preset === 'custom') return null;
  const today = new Date();
  const todayStr = fmt(today);
  if (preset === 'today') return { from: todayStr, to: todayStr };
  if (preset === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { from: fmt(start), to: todayStr };
  }
  // month — last 30 days
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { from: fmt(start), to: todayStr };
}
