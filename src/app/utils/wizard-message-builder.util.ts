// Ports buildSoldiersMessage / buildOpsMessage from
// projects/dispatch-system/app/src/components/wizard/steps/Step6Generate.tsx (lines 55-167)

import type { Person } from '../models/person.model';
import type { Truck } from '../models/truck.model';
import { STAGE_ACTION_LABELS, type WizardMissionData, type CustomPerson, type CustomTruck } from '../models/wizard.model';
import { HEB_LETTERS } from '../models/mission.model';

interface ResolverContext {
  trucks: Truck[];
  people: Person[];
  customTrucks: CustomTruck[];
  customPeople: CustomPerson[];
  truckUrls?: Map<string, string>;        // vehicleId -> driver-tracking URL (post-schedule)
}

function resolvePersonName(id: string | null, ctx: ResolverContext): string {
  if (!id) return '—';
  const p = ctx.people.find(x => x.id === id);
  if (p) return p.full_name;
  const c = ctx.customPeople.find(x => x.id === id);
  if (c) return c.fullName;
  return '—';
}

function resolveTruckLabel(truckId: string, ctx: ResolverContext): { vehicleId: string; type: string } {
  const t = ctx.trucks.find(x => x.id === truckId);
  if (t) return { vehicleId: t.vehicle_id, type: t.type };
  const c = ctx.customTrucks.find(x => x.id === truckId);
  if (c) return { vehicleId: c.vehicleId, type: c.type };
  return { vehicleId: truckId, type: '' };
}

function getActionLabel(action: string): string {
  return (STAGE_ACTION_LABELS as Record<string, string>)[action] || action;
}

export function buildSoldiersMessage(data: WizardMissionData, ctx: ResolverContext): string {
  const { missionBasics, stages, truckAssignments } = data;
  const lines: string[] = [];
  const firstStage = stages[0];

  lines.push(`משימה: ${missionBasics.name} | ${missionBasics.date}`);
  if (firstStage) lines.push(`יציאה: ${firstStage.departureTime || '—'}`);
  lines.push('');

  stages.forEach((stage, i) => {
    const letter = HEB_LETTERS[i] || `${i + 1}`;
    lines.push(`${letter} ${getActionLabel(stage.action)} — ${stage.origin} ← ${stage.destination}`);
    if (stage.contactName) {
      const phone = stage.contactPhone ? ` ${stage.contactPhone}` : '';
      lines.push(`   קשר: ${stage.contactName}${phone}`);
    }
  });

  if (truckAssignments.length > 0) {
    lines.push('');
    truckAssignments.forEach(a => {
      const truck = resolveTruckLabel(a.truckId, ctx);
      const driverName = resolvePersonName(a.driver, ctx);
      const coDriverNames = (a.coDrivers || [])
        .filter((id): id is string => !!id)
        .map(id => resolvePersonName(id, ctx))
        .filter(n => n !== '—');
      let line = `🚛 ${truck.vehicleId} — נהג: ${driverName}`;
      if (coDriverNames.length > 0) line += `, ליווי: ${coDriverNames.join(', ')}`;
      const url = ctx.truckUrls?.get(truck.vehicleId);
      if (url) line += `\n   📱 ${url}`;
      lines.push(line);
    });
  }

  // Maps URL — STUBBED: returns empty string, no link in POC
  const mapsUrl = '';
  if (mapsUrl) {
    lines.push('');
    lines.push(`🗺️ ${mapsUrl}`);
  } else {
    lines.push('');
    lines.push('🗺️ [קישור ניווט — ייווצר לאחר חיבור מפות]');
  }

  return lines.join('\n');
}

export function buildOpsMessage(data: WizardMissionData, ctx: ResolverContext): string {
  const { missionBasics, stages, truckAssignments, phones } = data;
  const commanderName = missionBasics.commander?.name || '—';
  const lines: string[] = [];

  lines.push(`📋 ${missionBasics.name} | ${missionBasics.date} | מפקד: ${commanderName}`);
  lines.push('');

  stages.forEach((stage, i) => {
    const letter = HEB_LETTERS[i] || `${i + 1}`;
    lines.push(`שלב ${letter} — ${getActionLabel(stage.action)}`);
    lines.push(`${stage.origin} ← ${stage.destination} | יציאה ${stage.departureTime || '—'} | הגעה ${stage.arrivalTime || '—'}`);
    const extras: string[] = [];
    if (stage.cargo) extras.push(`מטען: ${stage.cargo}`);
    if (stage.contactName) {
      const phone = stage.contactPhone ? ` ${stage.contactPhone}` : '';
      extras.push(`קשר: ${stage.contactName}${phone}`);
    }
    if (extras.length > 0) lines.push(extras.join(' | '));
    lines.push('');
  });

  if (truckAssignments.length > 0) {
    lines.push('🚛 כלי רכב:');
    truckAssignments.forEach(a => {
      const truck = resolveTruckLabel(a.truckId, ctx);
      const driverName = resolvePersonName(a.driver, ctx);
      const coDriverNames = (a.coDrivers || [])
        .filter((id): id is string => !!id)
        .map(id => resolvePersonName(id, ctx))
        .filter(n => n !== '—');
      let line = `${truck.vehicleId} — ${driverName} (נהג)`;
      if (coDriverNames.length > 0) line += `, ${coDriverNames.join(', ')} (ליווי)`;
      const url = ctx.truckUrls?.get(truck.vehicleId);
      if (url) line += `\n   📱 ${url}`;
      lines.push(line);
    });
    lines.push('');
  }

  // Aggregate weapon/vest flags across all truck assignments
  const armedIds = new Set<string>();
  const vestedIds = new Set<string>();
  for (const a of truckAssignments) {
    Object.entries(a.hasWeapon || {}).forEach(([id, on]) => { if (on) armedIds.add(id); });
    Object.entries(a.hasVestHelmet || {}).forEach(([id, on]) => { if (on) vestedIds.add(id); });
  }

  if (armedIds.size > 0) {
    const names = Array.from(armedIds).map(id => resolvePersonName(id, ctx)).filter(n => n !== '—');
    lines.push(`🔫 נשק: ${names.join(', ')}`);
    lines.push('');
  }

  if (vestedIds.size > 0) {
    const names = Array.from(vestedIds).map(id => resolvePersonName(id, ctx)).filter(n => n !== '—');
    lines.push(`🦺 שכפצ״ים וקסדות: ${names.join(', ')}`);
    lines.push('');
  }

  const contactParts: string[] = [];
  if (phones.trafficCoordinator) contactParts.push(`קצין רכב: ${phones.trafficCoordinator}`);
  if (phones.commander) contactParts.push(`מפקד משלח: ${phones.commander}`);
  if (contactParts.length > 0) lines.push(`📞 ${contactParts.join(' | ')}`);

  // Maps URL — STUBBED in POC
  lines.push('🗺️ [קישור ניווט — ייווצר לאחר חיבור מפות]');

  return lines.join('\n');
}
