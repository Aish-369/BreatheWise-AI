import type { FamilyMember, LanguageCode, Recommendation } from '../../shared/types';
import { t } from '../../i18n/translations';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationsListProps {
  lang: LanguageCode;
  members: FamilyMember[];
  recommendations: Recommendation[];
  selectedMemberFilter: string;
  expandedRecId: string | null;
  onSelectMemberFilter: (filter: string) => void;
  onToggleExpand: (id: string | null) => void;
}

export function RecommendationsList({
  lang,
  members,
  recommendations,
  selectedMemberFilter,
  expandedRecId,
  onSelectMemberFilter,
  onToggleExpand,
}: RecommendationsListProps) {
  const filteredRecommendations =
    selectedMemberFilter === 'all'
      ? recommendations
      : recommendations.filter((r) => r.applicableMembers.includes(selectedMemberFilter));

  return (
    <section className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'dash_actions_heading')}
        </h2>

        <div className="flex items-center gap-1 bg-[#F7F7F1] p-0.5 rounded-lg border border-[#E2E7E1] overflow-x-auto max-w-full">
          <button
            type="button"
            aria-pressed={selectedMemberFilter === 'all'}
            onClick={() => onSelectMemberFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              selectedMemberFilter === 'all'
                ? 'bg-white text-[#252D28] shadow-2xs'
                : 'text-[#525C56] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_all_members')}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={selectedMemberFilter === m.name}
              onClick={() => onSelectMemberFilter(m.name)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                selectedMemberFilter === m.name
                  ? 'bg-white text-[#252D28] shadow-2xs'
                  : 'text-[#525C56] hover:text-[#252D28]'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#E2E7E1]" aria-live="polite">
        {filteredRecommendations.map((rec) => {
          const isOpen = expandedRecId === rec.id;
          return (
            <RecommendationCard
              key={rec.id}
              lang={lang}
              rec={rec}
              isOpen={isOpen}
              onToggleExpand={() => onToggleExpand(isOpen ? null : rec.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
