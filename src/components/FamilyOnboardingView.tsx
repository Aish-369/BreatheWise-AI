import { useState } from 'react';
import {
  ArrowRight,
  Baby,
  Check,
  Footprints,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import type {
  ActivityPreference,
  AgeGroup,
  FamilyMember,
  FamilyMemberInput,
  HouseholdInput,
  HouseholdProfile,
  LanguageCode,
} from '../shared/types';
import { t } from '../i18n/translations';

interface FamilyOnboardingViewProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  members: FamilyMember[];
  initialMode?: 'members' | 'guided';
  onSaveHousehold: (input: HouseholdInput) => Promise<void>;
  onAddMember: (input: FamilyMemberInput) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  onDoneOnboarding: () => void;
}

function ageIcon(ageGroup: AgeGroup) {
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

export function FamilyOnboardingView({
  lang,
  household,
  members,
  initialMode = 'members',
  onSaveHousehold,
  onAddMember,
  onDeleteMember,
  onDoneOnboarding,
}: FamilyOnboardingViewProps) {
  const [mode, setMode] = useState<'members' | 'guided'>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [hhName, setHhName] = useState(household.name);
  const [city, setCity] = useState(household.city);
  const [locality, setLocality] = useState(household.locality ?? '');
  const [language, setLanguage] = useState<LanguageCode>(household.language);
  const [savingHh, setSavingHh] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState<AgeGroup>('school_child');
  const [newPref, setNewPref] = useState<ActivityPreference>('outdoor_play');
  const [newFlex, setNewFlex] = useState<'fixed' | 'flexible'>('flexible');
  const [addingMember, setAddingMember] = useState(false);

  const handleSaveHousehold = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingHh(true);
    setFeedback(null);
    try {
      await onSaveHousehold({
        name: hhName.trim() || 'Local Household',
        city: city.trim() || 'Pune',
        locality: locality.trim(),
        language,
      });
      setFeedback('Household preferences saved.');
      if (mode === 'guided' && step === 1) {
        setStep(2);
      }
    } finally {
      setSavingHh(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingMember(true);
    setFeedback(null);
    try {
      await onAddMember({
        name: newName.trim(),
        ageGroup: newAgeGroup,
        activityPreference: newPref,
        routineFlexibility: newFlex,
      });
      setNewName('');
      setFeedback('Member added to household.');
    } finally {
      setAddingMember(false);
    }
  };

  const flexibleCount = members.filter((m) => m.routineFlexibility === 'flexible').length;
  const fixedCount = members.length - flexibleCount;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'onb_title')}</h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'onb_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMode('members')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'members'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_members')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('guided');
              setStep(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'guided'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_onboarding')}
          </button>
        </div>
      </div>

      {/* Household Gradient Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#263C32] via-[#2F4A3D] to-[#21352C] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_28px_rgba(38,60,50,0.12)]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
            <ShieldCheck className="w-4 h-4" />
            <span>Local SQLite Profile · No medical or personal IDs stored</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white">{household.name}</h2>
          <p className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {household.city}
              {household.locality ? ` · ${household.locality}` : ''}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
            <p className="font-mono text-xl font-bold tabular-nums">{members.length}</p>
            <p className="text-[11px] text-[#DCE9DD]">Members</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
            <p className="font-mono text-xl font-bold tabular-nums">{flexibleCount}</p>
            <p className="text-[11px] text-[#DCE9DD]">Flexible</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
            <p className="font-mono text-xl font-bold tabular-nums">{fixedCount}</p>
            <p className="text-[11px] text-[#DCE9DD]">Fixed</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-2.5 rounded-xl border border-[#829C83]/50 bg-[#DCE9DD]/45 text-xs font-medium text-[#263C32]">
          {feedback}
        </div>
      )}

      {mode === 'guided' ? (
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 lg:p-8 max-w-2xl space-y-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="flex items-center gap-6 border-b border-[#E2E7E1] pb-4 text-xs">
            {[
              { n: 1, label: '01. Location & Language' },
              { n: 2, label: '02. Family Members' },
              { n: 3, label: '03. Ready' },
            ].map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setStep(s.n as 1 | 2 | 3)}
                className={`font-medium cursor-pointer ${
                  step === s.n
                    ? 'text-[#263C32] font-semibold underline underline-offset-4'
                    : 'text-[#89918A]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleSaveHousehold} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#89918A] mb-1">
                  Household Name
                </label>
                <input
                  type="text"
                  required
                  value={hhName}
                  onChange={(e) => setHhName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#89918A] mb-1">City</label>
                  <select
                    value={city === 'Pune' || city === 'Ahilyanagar' ? city : 'Custom'}
                    onChange={(e) => setCity(e.target.value === 'Custom' ? '' : e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Ahilyanagar">Ahilyanagar</option>
                    <option value="Custom">Other City</option>
                  </select>
                  {city !== 'Pune' && city !== 'Ahilyanagar' && (
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City name"
                      className="mt-2 w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#89918A] mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
                  >
                    <option value="en">English</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={savingHh}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#252D28]">{m.name}</p>
                      <p className="text-[#89918A]">
                        {t(lang, `age_${m.ageGroup}`)} · {t(lang, `pref_${m.activityPreference}`)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMember(m.id)}
                      className="text-[#89918A] hover:text-[#B33A2E] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Member name"
                  className="px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                />
                <select
                  value={newAgeGroup}
                  onChange={(e) => setNewAgeGroup(e.target.value as AgeGroup)}
                  className="px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                >
                  <option value="infant_toddler">{t(lang, 'age_infant_toddler')}</option>
                  <option value="school_child">{t(lang, 'age_school_child')}</option>
                  <option value="adult">{t(lang, 'age_adult')}</option>
                  <option value="older_adult">{t(lang, 'age_older_adult')}</option>
                </select>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-[#DCE9DD]/55 text-[#263C32] rounded-lg hover:bg-[#DCE9DD] cursor-pointer"
                >
                  + {t(lang, 'action_add')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
                >
                  Continue to Review
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#3B6E52]">
                <Check className="w-4 h-4" />
                <span>Household profile ready for deterministic protection planning.</span>
              </div>
              <p className="text-xs text-[#89918A]">
                {hhName} · {city} · {members.length} family member(s) configured.
              </p>
              <button
                type="button"
                onClick={onDoneOnboarding}
                className="px-5 py-2.5 text-sm font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
              >
                Open Overview
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Household Settings Card */}
          <form
            onSubmit={handleSaveHousehold}
            className="lg:col-span-4 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
          >
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              Household Preferences
            </h2>
            <div>
              <label className="block text-xs text-[#89918A] mb-1">Household Label</label>
              <input
                type="text"
                required
                value={hhName}
                onChange={(e) => setHhName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-[#89918A] mb-1">City</label>
              <select
                value={city === 'Pune' || city === 'Ahilyanagar' ? city : 'Custom'}
                onChange={(e) => setCity(e.target.value === 'Custom' ? '' : e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
              >
                <option value="Pune">Pune (Reference Demo)</option>
                <option value="Ahilyanagar">Ahilyanagar (Partial Demo)</option>
                <option value="Custom">Other City</option>
              </select>
              {city !== 'Pune' && city !== 'Ahilyanagar' && (
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city name"
                  className="mt-2 w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-[#89918A] mb-1">Locality (Optional)</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={savingHh}
              className="w-full px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
            >
              {t(lang, 'action_save')}
            </button>
          </form>

          {/* Visual Member Profile Cards + Add Member */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((m) => {
                const Icon = ageIcon(m.ageGroup);
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)] hover:border-[#829C83] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#263C32] to-[#3A594B] text-[#DCE9DD] flex items-center justify-center font-display text-sm font-bold shrink-0">
                          {m.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display text-sm font-semibold text-[#252D28]">
                            {m.name}
                          </h3>
                          <p className="text-xs text-[#89918A] flex items-center gap-1">
                            <Icon className="w-3.5 h-3.5 text-[#829C83]" />
                            <span>{t(lang, `age_${m.ageGroup}`)}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMember(m.id)}
                        aria-label={`Remove ${m.name}`}
                        className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E7E1] flex items-center justify-between text-xs">
                      <span className="font-medium text-[#252D28]">
                        {t(lang, `pref_${m.activityPreference}`)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F7F7F1] text-[#89918A]">
                        {t(lang, `flex_${m.routineFlexibility}`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleAddMember}
              className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
            >
              <h3 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#829C83]" strokeWidth={1.8} />
                <span>Add Family Member</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-[#89918A] mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#89918A] mb-1">Age Group</label>
                  <select
                    value={newAgeGroup}
                    onChange={(e) => setNewAgeGroup(e.target.value as AgeGroup)}
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                  >
                    <option value="infant_toddler">{t(lang, 'age_infant_toddler')}</option>
                    <option value="school_child">{t(lang, 'age_school_child')}</option>
                    <option value="adult">{t(lang, 'age_adult')}</option>
                    <option value="older_adult">{t(lang, 'age_older_adult')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#89918A] mb-1">Primary Activity</label>
                  <select
                    value={newPref}
                    onChange={(e) => setNewPref(e.target.value as ActivityPreference)}
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                  >
                    <option value="outdoor_play">{t(lang, 'pref_outdoor_play')}</option>
                    <option value="morning_walk">{t(lang, 'pref_morning_walk')}</option>
                    <option value="outdoor_exercise">{t(lang, 'pref_outdoor_exercise')}</option>
                    <option value="commute">{t(lang, 'pref_commute')}</option>
                    <option value="mostly_indoors">{t(lang, 'pref_mostly_indoors')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#89918A] mb-1">Routine Flexibility</label>
                  <select
                    value={newFlex}
                    onChange={(e) => setNewFlex(e.target.value as 'fixed' | 'flexible')}
                    className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                  >
                    <option value="flexible">{t(lang, 'flex_flexible')}</option>
                    <option value="fixed">{t(lang, 'flex_fixed')}</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={addingMember}
                className="px-5 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
              >
                {t(lang, 'action_add')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
