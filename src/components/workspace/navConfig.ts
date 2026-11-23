import {
  Activity,
  CalendarClock,
  FileText,
  LayoutDashboard,
  MapPin,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import type { BootstrapPayload } from '../../utils/api';
import { t } from '../../i18n/translations';
import type { ActiveSection } from '../../hooks/useNavigationState';

export interface NavItem {
  id: ActiveSection;
  label: string;
  icon: typeof LayoutDashboard;
}

export interface WorkspaceAlert {
  title: string;
  detail: string;
  kind: 'warn' | 'info';
}

export function getNavItems(lang: LanguageCode): NavItem[] {
  return [
    { id: 'overview', label: t(lang, 'side_overview'), icon: LayoutDashboard },
    { id: 'family', label: t(lang, 'side_family'), icon: Users },
    { id: 'air-quality', label: t(lang, 'side_air_quality'), icon: Activity },
    { id: 'planner', label: t(lang, 'side_planner'), icon: CalendarClock },
    { id: 'simulator', label: t(lang, 'side_simulator'), icon: SlidersHorizontal },
    { id: 'locations', label: t(lang, 'side_locations'), icon: MapPin },
    { id: 'reports', label: t(lang, 'side_reports'), icon: FileText },
    { id: 'settings', label: t(lang, 'side_settings'), icon: Settings },
  ];
}

export function computeActiveAlerts(
  data: BootstrapPayload | null,
  lang: LanguageCode
): WorkspaceAlert[] {
  const alerts: WorkspaceAlert[] = [];
  if (data?.plan.conflictWarningKey && data.plan.conflictDetails) {
    alerts.push({
      title: t(lang, 'rec_conflict_title'),
      detail: data.plan.conflictDetails,
      kind: 'warn',
    });
  }
  if (data && !data.plan.isAvailable) {
    alerts.push({
      title: t(lang, 'dash_unavailable_title'),
      detail: t(lang, 'dash_unavailable_desc'),
      kind: 'warn',
    });
  }
  if (data?.plan.isDemoFixture) {
    alerts.push({
      title: t(lang, 'cls_demo_fixture'),
      detail: t(lang, 'demo_fixture_notice'),
      kind: 'info',
    });
  }
  return alerts;
}
