import { jsPDF } from 'jspdf';
import type { HouseholdProfile, LanguageCode, ProtectionPlanResult } from '../shared/types';
import { t } from '../i18n/translations';

export function exportProtectionPlanPdf(
  household: HouseholdProfile,
  plan: ProtectionPlanResult,
  lang: LanguageCode
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const writeLine = (text: string, size = 10, bold = false, gap = 16) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > 760) {
        doc.addPage();
        y = 52;
      }
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += gap - (size + 4);
  };

  doc.setTextColor(36, 54, 75);
  writeLine('BreatheWise AI — Family Air Protection Brief', 18, true, 26);

  doc.setTextColor(82, 96, 113);
  writeLine(
    `Household: ${household.name} | City: ${plan.city} | Generated: ${new Date(plan.generatedAt).toLocaleString()}`,
    9,
    false,
    18
  );

  if (plan.isDemoFixture) {
    writeLine(
      'NOTICE: Generated using clearly labelled demonstration fixtures (non-live synthetic reference).',
      9,
      true,
      18
    );
  }
  if (plan.isScenario) {
    writeLine('SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT.', 10, true, 18);
  }

  doc.setDrawColor(226, 221, 210);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setTextColor(26, 38, 54);
  writeLine('1. Environmental Evidence Summary', 13, true, 20);
  writeLine(
    `Reference India NAQI: ${plan.aqiValue !== null ? `${plan.aqiValue} (${t(lang, `band_${plan.aqiBand}`)})` : 'Unavailable'} ${plan.aqiIsDerived ? '[Derived from sub-indices]' : ''}`,
    10,
    false,
    15
  );
  writeLine(
    `Provider: ${plan.supportingEvidence.providerLabel} | Station/Grid: ${plan.supportingEvidence.stationOrGridId}`,
    10,
    false,
    15
  );
  writeLine(
    `Data Type: ${t(lang, `dtype_${plan.dataType}`)} | Freshness: ${t(lang, `fresh_${plan.freshness}`)} | Measured: ${plan.supportingEvidence.measuredAt ? new Date(plan.supportingEvidence.measuredAt).toLocaleString() : 'N/A'}`,
    10,
    false,
    18
  );
  writeLine(t(lang, plan.summaryKey, plan.summaryParams), 10, false, 22);

  writeLine('2. Family Protection Recommendations', 13, true, 20);
  for (const rec of plan.recommendations) {
    writeLine(`• ${t(lang, rec.titleKey, rec.titleParams)}`, 10, true, 15);
    writeLine(`  Members: ${rec.applicableMembers.join(', ') || 'Household'}`, 9, false, 14);
    writeLine(`  Action: ${t(lang, rec.suggestedActionKey, rec.suggestedActionParams)}`, 9, false, 14);
    writeLine(`  Basis: ${t(lang, rec.reasonGeneratedKey, rec.reasonGeneratedParams)}`, 9, false, 18);
  }

  writeLine('3. Daily Protection Schedule', 13, true, 20);
  for (const item of plan.dailyPlan) {
    const windowStr = item.suggestedWindow
      ? `${item.originalWindow} -> Suggested: ${item.suggestedWindow}`
      : item.originalWindow;
    writeLine(
      `• ${item.routineTitle} [${windowStr}] — ${t(lang, `status_${item.status}`)}`,
      10,
      true,
      15
    );
    writeLine(`  ${t(lang, item.rationaleKey, item.rationaleParams)}`, 9, false, 16);
  }

  if (plan.limitations.length > 0) {
    writeLine('4. Data Quality Warnings & Limitations', 13, true, 20);
    for (const lim of plan.limitations) {
      writeLine(`- ${lim}`, 9, false, 14);
    }
  }

  writeLine(
    'Disclaimer: BreatheWise AI provides informational air-quality planning support and does not offer medical diagnosis or treatment.',
    8,
    false,
    14
  );

  doc.save(`breathewise-report-${plan.city.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
