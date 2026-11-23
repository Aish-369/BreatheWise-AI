import { useCallback, useEffect, useState } from 'react';

export type ActiveSection =
  | 'overview'
  | 'family'
  | 'air-quality'
  | 'planner'
  | 'simulator'
  | 'locations'
  | 'reports'
  | 'settings';

const VALID_SECTIONS: ReadonlySet<string> = new Set<ActiveSection>([
  'overview',
  'family',
  'air-quality',
  'planner',
  'simulator',
  'locations',
  'reports',
  'settings',
]);

export function useNavigationState() {
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveSection>('overview');
  const [familySubMode, setFamilySubMode] = useState<'members' | 'guided'>('members');
  const [airSubTab, setAirSubTab] = useState<'telemetry' | 'indoor' | 'forecast'>('telemetry');
  const [settingsSubTab, setSettingsSubTab] = useState<'preferences' | 'methodology'>(
    'preferences'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [alertsMenuOpen, setAlertsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const closeHeaderMenus = useCallback(() => {
    setLocationMenuOpen(false);
    setAlertsMenuOpen(false);
    setProfileMenuOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHeaderMenus();
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeHeaderMenus]);

  const navigateSection = useCallback(
    (target?: string) => {
      closeHeaderMenus();
      if (target === 'family-setup') {
        setFamilySubMode('guided');
        setActiveTab('family');
      } else if (target === 'air-quality-indoor') {
        setAirSubTab('indoor');
        setActiveTab('air-quality');
      } else if (target === 'settings-trust') {
        setSettingsSubTab('methodology');
        setActiveTab('settings');
      } else if (target && VALID_SECTIONS.has(target)) {
        if (target === 'family') setFamilySubMode('members');
        if (target === 'air-quality') setAirSubTab('telemetry');
        if (target === 'settings') setSettingsSubTab('preferences');
        setActiveTab(target as ActiveSection);
      } else {
        setActiveTab('overview');
      }
      setViewMode('workspace');
    },
    [closeHeaderMenus]
  );

  return {
    viewMode,
    setViewMode,
    activeTab,
    familySubMode,
    airSubTab,
    settingsSubTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    locationMenuOpen,
    setLocationMenuOpen,
    alertsMenuOpen,
    setAlertsMenuOpen,
    profileMenuOpen,
    setProfileMenuOpen,
    closeHeaderMenus,
    navigateSection,
  };
}
