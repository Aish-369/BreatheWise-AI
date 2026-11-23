import { jsPDF } from 'jspdf';
import type { HouseholdProfile, LanguageCode, ProtectionPlanResult } from '../shared/types';
import { t } from '../i18n/translations';
import {
  ensureDevanagariFontsReady,
  renderMultilingualCanvasPdf,
  type PdfReportModel,
} from './pdfCanvasRenderer';
import { renderStandardPdf } from './pdfStandardRenderer';

export type { PdfReportModel };

const DEVANAGARI_RE = /[\u0900-\u097F]/;

export function buildPdfReportModel(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): PdfReportModel {
  const banners: string[] = [];
  if (plan.isDemoFixture) {
    banners.push(t(lang, 'demo_fixture_notice'));
  }
  if (plan.isScenario) {
    banners.push(t(lang, 'scenario_banner'));
  }

  const evidenceLines = [
    `${t(lang, 'dash_aqi_label')}: ${
      plan.aqiValue !== null
        ? `${plan.aqiValue} (${t(lang, `band_${plan.aqiBand}`)})`
        : t(lang, 'band_unavailable')
    } ${plan.aqiIsDerived ? `[${t(lang, 'dash_derived_note')}]` : ''}`,
    `${t(lang, 'dash_source')}: ${plan.supportingEvidence.providerLabel} | ${plan.supportingEvidence.stationOrGridId}`,
    `${t(lang, 'dash_confidence')}: ${t(lang, `dtype_${plan.dataType}`)} · ${t(
      lang,
      `fresh_${plan.freshness}`
    )} · ${t(lang, 'dash_measured_at')}: ${
      plan.supportingEvidence.measuredAt
        ? new Date(plan.supportingEvidence.measuredAt).toLocaleString()
        : 'N/A'
    }`,
  ];

  const recommendationBlocks = plan.recommendations.map((rec) => ({
    title: t(lang, rec.titleKey, rec.titleParams),
    members: `${t(lang, 'dash_applicable_members')}: ${rec.applicableMembers.join(', ') || household.name}`,
    action: t(lang, rec.suggestedActionKey, rec.suggestedActionParams),
    basis: `${t(lang, 'dash_reasonLabel')}: ${t(lang, rec.reasonGeneratedKey, rec.reasonGeneratedParams)}`,
    reconsider: rec.reconsiderWhenKey
      ? `${t(lang, 'trail_reconsider_label')}: ${t(lang, rec.reconsiderWhenKey)}`
      : undefined,
  }));

  const scheduleBlocks = plan.dailyPlan.map((item) => {
    const windowStr = item.suggestedWindow
      ? `${item.originalWindow} -> ${item.suggestedWindow}`
      : item.originalWindow;
    return {
      header: `${item.routineTitle} [${windowStr}] — ${t(lang, `status_${item.status}`)}`,
      rationale: t(lang, item.rationaleKey, item.rationaleParams),
    };
  });

  const model: PdfReportModel = {
    filename: `breathewise-report-${plan.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${lang}.pdf`,
    title: `${t(lang, 'brandName')} — ${t(lang, 'dash_title')}`,
    subtitle: `${household.name} · ${plan.city} · ${new Date(plan.generatedAt).toLocaleString()}`,
    banners,
    evidenceSectionTitle: t(lang, 'dash_evidence_heading'),
    evidenceLines,
    summaryText: t(lang, plan.summaryKey, plan.summaryParams),
    recommendationsTitle: t(lang, 'dash_actions_heading'),
    recommendationBlocks,
    scheduleTitle: t(lang, 'dash_planner_heading'),
    scheduleBlocks,
    limitationsTitle: t(lang, 'dash_evidence_heading'),
    limitations: plan.limitations,
    disclaimer: t(lang, 'ui_pdf_disclaimer'),
    containsDevanagari: false,
  };

  const joined = [
    model.title,
    model.subtitle,
    model.summaryText,
    ...model.banners,
    ...model.evidenceLines,
    ...model.recommendationBlocks.flatMap((r) => [r.title, r.action, r.basis, r.reconsider ?? '']),
    ...model.scheduleBlocks.flatMap((s) => [s.header, s.rationale]),
    model.disclaimer,
  ].join(' ');

  model.containsDevanagari = lang === 'mr' || lang === 'hi' || DEVANAGARI_RE.test(joined);
  return model;
}

export async function exportProtectionPlanPdf(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): Promise<void> {
  const model = buildPdfReportModel(household, plan, lang);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  if (model.containsDevanagari && typeof document !== 'undefined') {
    await ensureDevanagariFontsReady();
    renderMultilingualCanvasPdf(doc, model);
    doc.save(model.filename);
    return;
  }

  await renderStandardPdf(doc, model);
  doc.save(model.filename);
}
