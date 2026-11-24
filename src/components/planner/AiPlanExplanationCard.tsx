import { useEffect, useState } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import type { FamilyMember, LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';
import {
  explainPlanApi,
  type AiPlanExplanationResponse,
} from '../../utils/api';

interface AiPlanExplanationCardProps {
  lang: LanguageCode;
  plan: ProtectionPlanResult;
  members: FamilyMember[];
}

const copy = {
  en: {
    title: 'AI explanation',
    description: 'Understand why today’s plan fits the air-quality evidence and your household mix.',
    action: 'Explain today’s plan',
    loading: 'Preparing explanation…',
    gemini: 'Gemini AI',
    rules: 'Rules-based fallback',
    error: 'The explanation could not be generated. Please try again.',
  },
  mr: {
    title: 'AI स्पष्टीकरण',
    description: 'आजची योजना हवेच्या गुणवत्तेच्या पुराव्याशी आणि कुटुंबाच्या रचनेशी का जुळते ते समजून घ्या.',
    action: 'आजची योजना समजावून सांगा',
    loading: 'स्पष्टीकरण तयार होत आहे…',
    gemini: 'Gemini AI',
    rules: 'नियम-आधारित पर्याय',
    error: 'स्पष्टीकरण तयार करता आले नाही. पुन्हा प्रयत्न करा.',
  },
  hi: {
    title: 'AI स्पष्टीकरण',
    description: 'समझें कि आज की योजना वायु-गुणवत्ता के प्रमाण और आपके परिवार के अनुसार क्यों है।',
    action: 'आज की योजना समझाएँ',
    loading: 'स्पष्टीकरण तैयार हो रहा है…',
    gemini: 'Gemini AI',
    rules: 'नियम-आधारित विकल्प',
    error: 'स्पष्टीकरण तैयार नहीं हो सका। कृपया फिर प्रयास करें।',
  },
} as const;

export function AiPlanExplanationCard({ lang, plan, members }: AiPlanExplanationCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiPlanExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const labels = copy[lang];

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [lang, plan.id]);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const context = {
        city: plan.city,
        aqiValue: plan.aqiValue,
        aqiBand: plan.aqiBand,
        freshness: plan.freshness,
        dominantPollutant: plan.dominantPollutant,
        dataType: plan.dataType,
        isAvailable: plan.isAvailable,
        isDemoFixture: plan.isDemoFixture,
        pollutants: {
          pm25: plan.supportingEvidence.pm25,
          pm10: plan.supportingEvidence.pm10,
        },
        householdGroups: {
          infants: members.filter((member) => member.ageGroup === 'infant_toddler').length,
          children: members.filter((member) => member.ageGroup === 'school_child').length,
          adults: members.filter((member) => member.ageGroup === 'adult').length,
          olderAdults: members.filter((member) => member.ageGroup === 'older_adult').length,
        },
        recommendations: plan.recommendations.slice(0, 4).map((item) => ({
          title: t(lang, item.titleKey, item.titleParams),
          action: t(lang, item.suggestedActionKey, item.suggestedActionParams),
          reason: t(lang, item.reasonGeneratedKey, item.reasonGeneratedParams),
          evidence: item.evidenceTrail?.evidenceMetric ?? '',
          severity: item.severity,
        })),
      };
      setResult(await explainPlanApi(lang, context));
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="ai-plan-explanation-title"
      className="rounded-xl border border-[#D9E4D9] bg-gradient-to-br from-white to-[#F3F7F1] p-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E5EFE4] text-[#263C32]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="ai-plan-explanation-title" className="text-sm font-semibold text-[#252D28]">
              {labels.title}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#59645C]">
              {labels.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleExplain()}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#263C32] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#355344] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? labels.loading : labels.action}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-[#B33A2E]/30 bg-white px-3 py-2 text-xs text-[#9A2E24]">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 border-t border-[#D9E4D9] pt-4" aria-live="polite">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#E5EFE4] px-2.5 py-1 text-[10px] font-semibold text-[#263C32]">
              {result.provider === 'gemini' ? labels.gemini : labels.rules}
            </span>
            {result.model && (
              <span className="text-[10px] text-[#667168]">{result.model}</span>
            )}
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-[#344239]">
            {result.explanation}
          </p>
          {result.notice && (
            <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs leading-5 text-[#68746B]">
              {result.notice}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
