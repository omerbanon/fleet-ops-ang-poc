// Converts between WizardMissionData (form-facing) and Mission (storage-facing)

import type { Mission, MissionPersonnel, MissionStage, MissionRoute } from '../models/mission.model';
import type {
  WizardMissionData,
  WizardTruckAssignment,
  CustomPerson,
  CustomTruck,
  RiskKey,
  StageAction,
} from '../models/wizard.model';
import { buildEmptyWizardData } from '../mock/mock-wizard';
import type { Truck } from '../models/truck.model';
import type { Person } from '../models/person.model';

const RISK_KEYS: RiskKey[] = ['alerts', 'puncture', 'accident', 'roadClosures', 'weather'];
const RISK_FIELD_MAP: Record<RiskKey, keyof Mission> = {
  alerts: 'risk_alerts',
  puncture: 'risk_puncture_plan',
  accident: 'risk_accident_plan',
  roadClosures: 'risk_road_closures',
  weather: 'risk_weather',
};

// ── Wizard → Mission (for createMission / updateMission) ─────────────────────

export function wizardDataToMission(
  data: WizardMissionData,
  ctx: { teamId: string; trucks: Truck[]; people: Person[] },
  existing?: Partial<Mission>,
): Partial<Mission> {
  const now = new Date().toISOString();
  const id = existing?.id ?? `m-${Date.now()}`;

  // Build per-risk fields from riskManagement
  const riskFields: Partial<Mission> = {};
  for (const key of RISK_KEYS) {
    const field = RISK_FIELD_MAP[key];
    (riskFields as Record<string, unknown>)[field] = data.enabledRisks.includes(key)
      ? data.riskManagement[key] ?? null
      : null;
  }

  // Flatten truck assignments → mission_personnel rows
  const personnel: MissionPersonnel[] = [];
  let crewPosition = 0;
  for (const a of data.truckAssignments) {
    const truck = data.customTrucks.find(c => c.id === a.truckId)
      ?? ctx.trucks.find(t => t.id === a.truckId);
    const isCustomTruck = a.truckId.startsWith('custom-truck-');

    // Driver row
    if (a.driver) {
      personnel.push(buildPersonnelRow(id, a, a.driver, 'driver', crewPosition++, ctx, isCustomTruck, truck));
    }
    // Co-drivers
    for (const cdId of a.coDrivers) {
      if (!cdId) continue;
      personnel.push(buildPersonnelRow(id, a, cdId, 'co_driver', crewPosition++, ctx, isCustomTruck, truck));
    }
  }

  // Flatten stages
  const stages: MissionStage[] = data.stages.map((s, i) => ({
    id: `${id}-s-${i + 1}`,
    mission_id: id,
    stage_order: s.order,
    stage_name: s.name,
    action: s.action,
    origin: s.origin,
    destination: s.destination,
    equipment_cargo: s.cargo || null,
    contact_person_name: s.contactName || null,
    contact_person_phone: s.contactPhone || null,
    departure_time: s.departureTime || null,
    arrival_time: s.arrivalTime || null,
    stage_status: 'pending',
    actual_departure_time: null,
    actual_completion_time: null,
    routes: buildRoutes(`${id}-s-${i + 1}`, s.routes),
  }));

  return {
    id,
    mission_name: data.missionBasics.name,
    mission_date: data.missionBasics.date,
    commander_name: data.missionBasics.commander?.name ?? '',
    status: existing?.status ?? 'scheduled',
    mission_type: data.missionBasics.type,
    enabled_risks: data.enabledRisks,
    commander_phone: data.missionBasics.commander?.phone ?? data.phones.commander ?? null,
    traffic_coordinator_phone: data.phones.trafficCoordinator || null,
    ...riskFields,
    team_id: ctx.teamId,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    mission_stages: stages,
    mission_personnel: personnel,
    custom_risks: data.customRisks.map(r => ({ id: r.id, title: r.title, content: r.content })),
  };
}

function buildPersonnelRow(
  missionId: string,
  assignment: WizardTruckAssignment,
  personId: string,
  role: 'driver' | 'co_driver',
  crewPosition: number,
  ctx: { trucks: Truck[]; people: Person[] },
  isCustomTruck: boolean,
  truckEntity: Truck | CustomTruck | undefined,
): MissionPersonnel {
  const isCustomPerson = personId.startsWith('custom-') && !personId.startsWith('custom-truck-');
  const realPerson = !isCustomPerson ? ctx.people.find(p => p.id === personId) : undefined;

  return {
    id: `${missionId}-mp-${crewPosition + 1}`,
    mission_id: missionId,
    truck_id: isCustomTruck ? null : assignment.truckId,
    person_id: isCustomPerson ? null : personId,
    role_in_mission: role,
    crew_position: crewPosition,
    custom_person_name: isCustomPerson ? personId : null,
    custom_truck_name: isCustomTruck && truckEntity ? (truckEntity as CustomTruck).vehicleId : null,
    people: realPerson ? { id: realPerson.id, full_name: realPerson.full_name, phone: realPerson.phone, role: realPerson.role } : null,
    trucks: !isCustomTruck && truckEntity ? { id: (truckEntity as Truck).id, vehicle_id: (truckEntity as Truck).vehicle_id, type: (truckEntity as Truck).type } : null,
  };
}

function buildRoutes(stageId: string, wizardRoutes: { primary: { roadNumber: string; distanceKm: number | null; durationMinutes: number | null; polyline?: string } | null; backup: { roadNumber: string; distanceKm: number | null; durationMinutes: number | null; polyline?: string } | null }): MissionRoute[] {
  const out: MissionRoute[] = [];
  if (wizardRoutes.primary) {
    out.push({
      id: `${stageId}-r-primary`,
      route_type: 'primary',
      road_number: wizardRoutes.primary.roadNumber,
      distance_km: wizardRoutes.primary.distanceKm,
      duration_minutes: wizardRoutes.primary.durationMinutes,
      polyline: wizardRoutes.primary.polyline ?? null,
    });
  }
  if (wizardRoutes.backup) {
    out.push({
      id: `${stageId}-r-backup`,
      route_type: 'backup',
      road_number: wizardRoutes.backup.roadNumber,
      distance_km: wizardRoutes.backup.distanceKm,
      duration_minutes: wizardRoutes.backup.durationMinutes,
      polyline: wizardRoutes.backup.polyline ?? null,
    });
  }
  return out;
}

// ── Mission → Wizard (for loadForEdit) ───────────────────────────────────────

export function missionToWizardData(mission: Mission): WizardMissionData {
  const empty = buildEmptyWizardData();

  // Reconstruct customPeople and customTrucks from personnel rows
  const customPeople: CustomPerson[] = [];
  const customTrucks: CustomTruck[] = [];
  const seenCustomPersonNames = new Set<string>();
  const seenCustomTruckNames = new Set<string>();

  for (const mp of mission.mission_personnel) {
    if (!mp.person_id && mp.custom_person_name && !seenCustomPersonNames.has(mp.custom_person_name)) {
      seenCustomPersonNames.add(mp.custom_person_name);
      customPeople.push({
        id: mp.custom_person_name,
        fullName: mp.custom_person_name.startsWith('custom-') ? '' : mp.custom_person_name,
        phone: '',
        role: 'both',
      });
    }
    if (!mp.truck_id && mp.custom_truck_name && !seenCustomTruckNames.has(mp.custom_truck_name)) {
      seenCustomTruckNames.add(mp.custom_truck_name);
      customTrucks.push({
        id: `custom-truck-${mp.custom_truck_name}`,
        vehicleId: mp.custom_truck_name,
        type: 'משאית',
      });
    }
  }

  // Group personnel by truck → truckAssignments
  const truckMap = new Map<string, WizardTruckAssignment>();
  for (const mp of mission.mission_personnel) {
    const key = mp.truck_id ?? `custom-truck-${mp.custom_truck_name ?? ''}`;
    if (!truckMap.has(key)) {
      truckMap.set(key, {
        truckId: key,
        driver: null,
        coDrivers: [],
        hasWeapon: {},
        hasVestHelmet: {},
      });
    }
    const a = truckMap.get(key)!;
    const personId = mp.person_id ?? mp.custom_person_name ?? null;
    if (mp.role_in_mission === 'driver' || mp.role_in_mission === 'both') {
      a.driver = personId;
    } else if (mp.role_in_mission === 'co_driver') {
      a.coDrivers.push(personId);
    }
  }
  // Pad coDrivers to at least 2 slots per spec
  const truckAssignments = Array.from(truckMap.values()).map(a => ({
    ...a,
    coDrivers: a.coDrivers.length >= 2 ? a.coDrivers : [...a.coDrivers, ...Array(2 - a.coDrivers.length).fill(null)],
  }));

  // Risks
  const enabledRisks = mission.enabled_risks ?? [];
  const riskManagement: Partial<Record<RiskKey, string>> = {};
  if (mission.risk_alerts != null) riskManagement.alerts = mission.risk_alerts;
  if (mission.risk_puncture_plan != null) riskManagement.puncture = mission.risk_puncture_plan;
  if (mission.risk_accident_plan != null) riskManagement.accident = mission.risk_accident_plan;
  if (mission.risk_road_closures != null) riskManagement.roadClosures = mission.risk_road_closures;
  if (mission.risk_weather != null) riskManagement.weather = mission.risk_weather;

  // Stages
  const stages = mission.mission_stages
    .slice()
    .sort((a, b) => a.stage_order - b.stage_order)
    .map((s, i) => ({
      order: s.stage_order,
      name: s.stage_name || empty.stages[i]?.name || `שלב ${s.stage_order}`,
      action: s.action as StageAction,
      origin: s.origin,
      destination: s.destination,
      cargo: s.equipment_cargo ?? '',
      contactName: s.contact_person_name ?? '',
      contactPhone: s.contact_person_phone ?? '',
      departureTime: s.departure_time ?? '',
      arrivalTime: s.arrival_time ?? '',
      bufferMinutes: 0,
      routes: {
        primary: s.routes.find(r => r.route_type === 'primary') ? {
          roadNumber: s.routes.find(r => r.route_type === 'primary')!.road_number,
          distanceKm: s.routes.find(r => r.route_type === 'primary')!.distance_km,
          durationMinutes: s.routes.find(r => r.route_type === 'primary')!.duration_minutes,
          polyline: s.routes.find(r => r.route_type === 'primary')!.polyline ?? '',
        } : null,
        backup: s.routes.find(r => r.route_type === 'backup') ? {
          roadNumber: s.routes.find(r => r.route_type === 'backup')!.road_number,
          distanceKm: s.routes.find(r => r.route_type === 'backup')!.distance_km,
          durationMinutes: s.routes.find(r => r.route_type === 'backup')!.duration_minutes,
          polyline: s.routes.find(r => r.route_type === 'backup')!.polyline ?? '',
        } : null,
      },
    }));

  return {
    missionBasics: {
      name: mission.mission_name,
      date: mission.mission_date,
      commander: mission.commander_name
        ? { id: '', name: mission.commander_name, phone: mission.commander_phone ?? '' }
        : null,
      type: (mission.mission_type as WizardMissionData['missionBasics']['type']) || 'delivery',
    },
    enabledRisks,
    riskManagement,
    customRisks: mission.custom_risks?.map(r => ({ id: r.id, title: r.title, content: r.content })) ?? [],
    phones: {
      trafficCoordinator: mission.traffic_coordinator_phone ?? '',
      commander: mission.commander_phone ?? '',
    },
    truckAssignments,
    customTrucks,
    customPeople,
    stages,
  };
}
