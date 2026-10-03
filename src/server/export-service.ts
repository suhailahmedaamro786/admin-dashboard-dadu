import { db } from '../db/index.ts';
import {
  surveyResponses,
  businessProfiles,
  operationalAnswers,
  validationAndFeedback,
} from '../db/schema.ts';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import type { AnalyticsFilterParams, ResearchAnalyticsPayload } from './analytics-service.ts';
import { computeResearchAnalytics } from './analytics-service.ts';

/**
 * Escapes a single CSV field value according to RFC 4180
 */
function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds array of CSV rows into a valid CSV string with UTF-8 BOM for Excel
 */
function buildCsvString(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  // \uFEFF ensures Excel displays Arabic, Sindhi, and Urdu Unicode glyphs properly
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generates Response Dataset CSV
 */
export async function generateResponsesCsv(
  filters: AnalyticsFilterParams,
  includeContact = false
): Promise<{ filename: string; csvContent: string; count: number }> {
  // Export only real research records; demo/test rows are excluded by design.
  const conditions = [eq(surveyResponses.isDemo, false)];

  if (filters.dateRange === 'today') {
    conditions.push(sql`DATE(${surveyResponses.submittedAt}) = CURRENT_DATE`);
  } else if (filters.dateRange === '7d') {
    conditions.push(sql`${surveyResponses.submittedAt} >= NOW() - INTERVAL '7 days'`);
  } else if (filters.dateRange === '30d') {
    conditions.push(sql`${surveyResponses.submittedAt} >= NOW() - INTERVAL '30 days'`);
  } else if (filters.dateRange === 'custom') {
    if (filters.startDate) {
      conditions.push(gte(surveyResponses.submittedAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      conditions.push(lte(surveyResponses.submittedAt, new Date(filters.endDate)));
    }
  }

  if (filters.businessType && filters.businessType !== 'All') {
    conditions.push(eq(businessProfiles.businessType, filters.businessType));
  }
  if (filters.area && filters.area !== 'All') {
    conditions.push(eq(businessProfiles.businessArea, filters.area));
  }
  if (filters.platform && filters.platform !== 'All') {
    conditions.push(eq(operationalAnswers.preferredSolutionPlatform, filters.platform));
  }
  if (filters.willingToPay && filters.willingToPay !== 'All') {
    conditions.push(eq(validationAndFeedback.willingToPay, filters.willingToPay));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select({
      id: surveyResponses.id,
      submittedAt: surveyResponses.submittedAt,
      completionTimeSeconds: surveyResponses.completionTimeSeconds,
      businessName: businessProfiles.businessName,
      businessType: businessProfiles.businessType,
      businessTypeOther: businessProfiles.businessTypeOther,
      yearsInBusiness: businessProfiles.yearsInBusiness,
      approxDailyCustomers: businessProfiles.approxDailyCustomers,
      approxDailySales: businessProfiles.approxDailySales,
      businessArea: businessProfiles.businessArea,
      contactWhatsapp: businessProfiles.contactWhatsapp,
      salesRecordingMethod: operationalAnswers.salesRecordingMethod,
      salesProblems: operationalAnswers.salesProblems,
      inventoryManagementMethod: operationalAnswers.inventoryManagementMethod,
      inventoryProblems: operationalAnswers.inventoryProblems,
      providesCredit: operationalAnswers.providesCredit,
      creditManagementMethod: operationalAnswers.creditManagementMethod,
      creditProblems: operationalAnswers.creditProblems,
      expenseTrackingMethod: operationalAnswers.expenseTrackingMethod,
      expenseProblems: operationalAnswers.expenseProblems,
      currentTechnology: operationalAnswers.currentTechnology,
      techComfortLevel: operationalAnswers.techComfortLevel,
      preferredSolutionPlatform: operationalAnswers.preferredSolutionPlatform,
      preferredLanguage: operationalAnswers.preferredLanguage,
      biggestProblemAreas: validationAndFeedback.biggestProblemAreas,
      singleBiggestProblem: validationAndFeedback.singleBiggestProblem,
      wouldUseSoftware: validationAndFeedback.wouldUseSoftware,
      willingToPay: validationAndFeedback.willingToPay,
      preferredPricingModel: validationAndFeedback.preferredPricingModel,
      priceRange: validationAndFeedback.priceRange,
      oneThingToChange: validationAndFeedback.oneThingToChange,
    })
    .from(surveyResponses)
    .leftJoin(businessProfiles, eq(surveyResponses.id, businessProfiles.responseId))
    .leftJoin(operationalAnswers, eq(surveyResponses.id, operationalAnswers.responseId))
    .leftJoin(validationAndFeedback, eq(surveyResponses.id, validationAndFeedback.responseId))
    .where(whereClause)
    .orderBy(sql`${surveyResponses.submittedAt} desc`);

  const headers = [
    'Response ID',
    'Submission Date (UTC)',
    'Completion Time (Seconds)',
    'Business Name',
    'Business Type',
    'Business Type (Other)',
    'Years in Business',
    'Daily Customers',
    'Daily Sales',
    'Area / Bazaar in Dadu',
    ...(includeContact ? ['Contact / WhatsApp'] : []),
    'Sales Recording Method',
    'Sales Problems',
    'Inventory Method',
    'Inventory Problems',
    'Provides Credit (Udhaar)',
    'Credit Management Tool',
    'Credit Problems',
    'Expense Tracking Method',
    'Expense Problems',
    'Current Technology',
    'Software Comfort Level',
    'Preferred Platform',
    'Preferred Interface Language',
    'Biggest Problem Areas',
    'Single Biggest Problem (Open-Ended)',
    'Would Use Solution',
    'Willingness to Pay',
    'Preferred Pricing Model',
    'Acceptable Price Range',
    'One Thing to Change (Open-Ended)',
  ];

  const rows = records.map((r) => [
    r.id,
    r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
    r.completionTimeSeconds || '',
    r.businessName || 'Anonymous',
    r.businessType || '',
    r.businessTypeOther || '',
    r.yearsInBusiness || '',
    r.approxDailyCustomers || '',
    r.approxDailySales || '',
    r.businessArea || '',
    ...(includeContact ? [r.contactWhatsapp || ''] : []),
    r.salesRecordingMethod || '',
    Array.isArray(r.salesProblems) ? r.salesProblems.join('; ') : '',
    r.inventoryManagementMethod || '',
    Array.isArray(r.inventoryProblems) ? r.inventoryProblems.join('; ') : '',
    r.providesCredit || '',
    r.creditManagementMethod || '',
    Array.isArray(r.creditProblems) ? r.creditProblems.join('; ') : '',
    r.expenseTrackingMethod || '',
    Array.isArray(r.expenseProblems) ? r.expenseProblems.join('; ') : '',
    Array.isArray(r.currentTechnology) ? r.currentTechnology.join('; ') : '',
    r.techComfortLevel || '',
    r.preferredSolutionPlatform || '',
    r.preferredLanguage || '',
    Array.isArray(r.biggestProblemAreas) ? r.biggestProblemAreas.join('; ') : '',
    r.singleBiggestProblem || '',
    r.wouldUseSoftware || '',
    r.willingToPay || '',
    r.preferredPricingModel || '',
    r.priceRange || '',
    r.oneThingToChange || '',
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Dadu-Business-Insights-Responses-${dateStr}.csv`;
  const csvContent = buildCsvString(headers, rows);

  return { filename, csvContent, count: records.length };
}

/**
 * Generates Analytics Summary CSV for empirical auditing
 */
export async function generateAnalyticsSummaryCsv(
  filters: AnalyticsFilterParams
): Promise<{ filename: string; csvContent: string }> {
  const analytics: ResearchAnalyticsPayload = await computeResearchAnalytics(filters);

  const headers = [
    'Metric Category',
    'Dimension / Variable',
    'Count (Frequency)',
    'Percentage (%)',
    'Denominator (Sample N)',
    'Filter Context',
  ];

  const filterSummary = [
    filters.dateRange ? `Range:${filters.dateRange}` : 'Range:all',
    filters.businessType ? `Type:${filters.businessType}` : '',
    filters.area ? `Area:${filters.area}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const rows: unknown[][] = [];

  const addRow = (cat: string, dim: string, count: number, pct: number, denom: number) => {
    rows.push([cat, dim, count, `${pct}%`, denom, filterSummary || 'All Data']);
  };

  // 1. Business Types
  analytics.businessTypeDistribution.forEach((b) => {
    addRow('Business Category', b.name, b.count, b.percentage, analytics.sampleSize);
  });

  // 2. Locations
  analytics.areaDistribution.forEach((a) => {
    addRow('Bazaar Location', a.name, a.count, a.percentage, analytics.sampleSize);
  });

  // 3. Sales Methods & Problems
  analytics.salesManagement.methods.forEach((m) => {
    addRow('Sales Recording Method', m.name, m.count, m.percentage, analytics.sampleSize);
  });
  analytics.salesManagement.problems.forEach((p) => {
    addRow('Sales Problem', p.name, p.count, p.percentage, analytics.sampleSize);
  });

  // 4. Stock & Inventory
  analytics.inventoryManagement.methods.forEach((m) => {
    addRow('Inventory Method', m.name, m.count, m.percentage, analytics.sampleSize);
  });
  analytics.inventoryManagement.problems.forEach((p) => {
    addRow('Inventory Problem', p.name, p.count, p.percentage, analytics.sampleSize);
  });

  // 5. Udhaar / Credit
  addRow(
    'Offers Credit',
    'Yes',
    analytics.creditUdhaar.offersCredit.yesCount,
    analytics.creditUdhaar.offersCredit.yesPercentage,
    analytics.sampleSize
  );
  addRow(
    'Offers Credit',
    'Sometimes',
    analytics.creditUdhaar.offersCredit.sometimesCount,
    analytics.creditUdhaar.offersCredit.sometimesPercentage,
    analytics.sampleSize
  );
  addRow(
    'Offers Credit',
    'No (Cash Only)',
    analytics.creditUdhaar.offersCredit.noCount,
    analytics.creditUdhaar.offersCredit.noPercentage,
    analytics.sampleSize
  );

  analytics.creditUdhaar.methods.forEach((m) => {
    addRow(
      'Credit Management Tool',
      m.name,
      m.count,
      m.percentage,
      analytics.creditUdhaar.creditBusinessesDenominator
    );
  });
  analytics.creditUdhaar.problems.forEach((p) => {
    addRow(
      'Credit Bottleneck',
      p.name,
      p.count,
      p.percentage,
      analytics.creditUdhaar.creditBusinessesDenominator
    );
  });

  // 6. Technology & Platform
  analytics.technology.deviceUsage.forEach((d) => {
    addRow('Technology Device In Use', d.name, d.count, d.percentage, analytics.sampleSize);
  });
  analytics.technology.comfortLevels.forEach((c) => {
    addRow('Software Comfort Level', c.name, c.count, c.percentage, analytics.sampleSize);
  });
  analytics.solutionPreferences.platforms.forEach((p) => {
    addRow('Preferred Platform', p.name, p.count, p.percentage, analytics.sampleSize);
  });
  analytics.solutionPreferences.languages.forEach((l) => {
    addRow('Preferred Language', l.name, l.count, l.percentage, analytics.sampleSize);
  });

  // 7. Problem Ranking
  analytics.biggestProblemsRanking.forEach((r) => {
    addRow(`Problem Area (Rank #${r.rank})`, r.name, r.count, r.percentage, analytics.sampleSize);
  });

  // 8. Cross-analysis (actual Phase 6 calculated values only)
  analytics.crossAnalysis.businessTypeByProblem.forEach((x) => {
    addRow('Business Type × Biggest Problem', x.businessType + ' → ' + x.topProblem, x.count, analytics.sampleSize ? Number(((x.count / analytics.sampleSize) * 100).toFixed(1)) : 0, analytics.sampleSize);
  });
  analytics.crossAnalysis.businessTypeByPlatform.forEach((x) => {
    addRow('Business Type × Preferred Platform', x.businessType + ' → ' + x.topPlatform, x.count, analytics.sampleSize ? Number(((x.count / analytics.sampleSize) * 100).toFixed(1)) : 0, analytics.sampleSize);
  });
  analytics.crossAnalysis.businessTypeByWillingness.forEach((x) => {
    rows.push(['Business Type × Willingness to Pay', x.businessType, x.willingPercentage, x.willingPercentage + '%', x.total, filterSummary || 'All Data']);
  });

  // 8. Cross-analysis from the Phase 6 analytics engine
  analytics.crossAnalysis.businessTypeByProblem.forEach((x) => {
    const percentage = analytics.sampleSize ? Number(((x.count / analytics.sampleSize) * 100).toFixed(1)) : 0;
    addRow('Business Type × Biggest Problem', `${x.businessType} → ${x.topProblem}`, x.count, percentage, analytics.sampleSize);
  });
  analytics.crossAnalysis.businessTypeByPlatform.forEach((x) => {
    const percentage = analytics.sampleSize ? Number(((x.count / analytics.sampleSize) * 100).toFixed(1)) : 0;
    addRow('Business Type × Preferred Platform', `${x.businessType} → ${x.topPlatform}`, x.count, percentage, analytics.sampleSize);
  });
  analytics.crossAnalysis.businessTypeByWillingness.forEach((x) => {
    rows.push(['Business Type × Willingness to Pay', x.businessType, x.willingPercentage, `${x.willingPercentage}%`, x.total, filterSummary || 'All Data']);
  });

  // 8. Software Validation & Pricing
  analytics.validationPricing.wouldUseSoftware.forEach((w) => {
    addRow('Would Use Software Solution', w.name, w.count, w.percentage, analytics.sampleSize);
  });
  analytics.validationPricing.willingnessToPay.forEach((w) => {
    addRow('Willingness to Pay', w.name, w.count, w.percentage, analytics.sampleSize);
  });
  analytics.validationPricing.priceRanges.forEach((p) => {
    addRow('Acceptable Monthly Price Range', p.name, p.count, p.percentage, analytics.sampleSize);
  });
  analytics.validationPricing.pricingModels.forEach((m) => {
    addRow('Preferred Billing Model', m.name, m.count, m.percentage, analytics.sampleSize);
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Dadu-Business-Insights-Analytics-Summary-${dateStr}.csv`;
  const csvContent = buildCsvString(headers, rows);

  return { filename, csvContent };
}
