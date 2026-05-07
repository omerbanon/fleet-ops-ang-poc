import type { RiskKey, WizardMissionData } from '../models/wizard.model';

export const DEFAULT_RISK_CONTENT: Record<RiskKey, string> = {
  alerts:       'עצור בצד הדרך במקום מוגן. כבה מנוע. הישאר ברכב. המתן להוראות מהמפקד. דווח מיידית לחדר מבצעים.',
  puncture:     'עצור בצד הדרך. הפעל אורות חירום ומשולש אזהרה. דווח למפקד. אל תנסה תיקון בכביש ראשי. המתן לחילוץ.',
  accident:     'עצור. חסום תנועה עם משולש אזהרה. הזעק עזרה ראשונה. דווח למשטרה ולמפקד. תעד נזקים.',
  roadClosures: 'עקוב אחר עדכוני תנועה לפני יציאה. במקרה חסימה: דווח למפקד, עבור למסלול חלופי. אל תנסה לעקוף מחסום.',
  weather:      'הפחת מהירות. הגבר מרחק בטיחות. הפעל אורות בערפל. בחום קיצוני: הפסקות מים כל שעה. בסערה: שקול עיכוב יציאה.',
};

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildEmptyWizardData(): WizardMissionData {
  return {
    missionBasics: {
      name: '',
      date: getTomorrowStr(),
      commander: null,
      type: 'delivery',
    },
    enabledRisks: ['alerts', 'puncture', 'accident', 'roadClosures', 'weather'],
    riskManagement: { ...DEFAULT_RISK_CONTENT },
    customRisks: [],
    phones: { trafficCoordinator: '', commander: '' },
    truckAssignments: [],
    customTrucks: [],
    customPeople: [],
    stages: [],
  };
}
