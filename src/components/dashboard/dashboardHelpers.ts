import { Baby, Footprints, GraduationCap, User } from 'lucide-react';
import type { FamilyMember, LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';

export function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'greet_morning';
  if (hour < 17) return 'greet_afternoon';
  return 'greet_evening';
}

export function bandIndexPercent(aqi: number | null): number {
  if (aqi === null) return 0;
  return Math.max(2, Math.min(98, (aqi / 450) * 100));
}

export function memberAgeIcon(ageGroup: FamilyMember['ageGroup']) {
  switch (ageGroup) {
    case 'infant_toddler':
      return Baby;
    case 'school_child':
      return GraduationCap;
    case 'older_adult':
      return Footprints;
    default:
      return User;
  }
}

export function severityDotColor(severity: string): string {
  switch (severity) {
    case 'elevated':
    case 'unavailable':
      return 'text-[#B33A2E] bg-[#B33A2E]/10';
    case 'caution':
    case 'advisory':
      return 'text-[#8E5312] bg-[#F5EBD8]';
    default:
      return 'text-[#3B6E52] bg-[#DCE9DD]';
  }
}

export function statusChipStyle(status: string): string {
  switch (status) {
    case 'proceed_as_planned':
      return 'bg-[#DCE9DD]/70 text-[#263C32]';
    case 'adjust_window':
      return 'bg-[#263C32] text-white';
    case 'proceed_with_precautions':
      return 'bg-[#F5EBD8] text-[#8E5312]';
    case 'move_indoors':
    case 'hold_pending_data':
      return 'bg-[#F6DFDC] text-[#9A2E24]';
    default:
      return 'bg-[#F7F7F1] text-[#252D28]';
  }
}

export function getMemberProtectionStatus(
  lang: LanguageCode,
  plan: ProtectionPlanResult,
  member: FamilyMember
): { label: string; tone: string } {
  if (!plan.isAvailable) {
    return {
      label: t(lang, 'ui_family_status_verify'),
      tone: 'text-[#9A2E24] bg-[#F6DFDC]',
    };
  }
  const memberItems = plan.dailyPlan.filter((d) => d.applicableMembers.includes(member.name));
  if (memberItems.some((d) => d.status === 'adjust_window' || d.status === 'move_indoors')) {
    return {
      label: t(lang, 'ui_family_status_shifted'),
      tone: 'text-[#263C32] bg-[#DCE9DD]/75',
    };
  }
  if (
    memberItems.some(
      (d) => d.status === 'proceed_with_precautions' || d.status === 'hold_pending_data'
    ) ||
    (plan.aqiValue !== null && plan.aqiValue > 100 && member.ageGroup !== 'adult')
  ) {
    return {
      label: t(lang, 'ui_family_status_precaution'),
      tone: 'text-[#8E5312] bg-[#F5EBD8]',
    };
  }
  return {
    label: t(lang, 'ui_family_status_ready'),
    tone: 'text-[#3B6E52] bg-[#DCE9DD]/50',
  };
}
