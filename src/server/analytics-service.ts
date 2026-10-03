import { db } from '../db/index.ts';
import {
  surveyResponses,
  businessProfiles,
  operationalAnswers,
  validationAndFeedback,
} from '../db/schema.ts';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

export interface AnalyticsFilterParams {
  dateRange?: string; // 'all' | 'today' | '7d' | '30d' | 'custom'
  startDate?: string;
  endDate?: string;
  businessType?: string;
  area?: string;
  platform?: string;
  willingToPay?: string;
}

export interface ResearchAnalyticsPayload {
  sampleSize: number;
  sampleStatus: 'none' | 'early' | 'small' | 'established';
  sampleNotice: string;
  lastUpdated: string;
  kpis: {
    totalResponses: number;
    responsesToday: number;
    responsesThisWeek: number;
    businessesSurveyed: number;
    mostCommonBusinessType: { name: string; count: number; percentage: number } | null;
    mostReportedProblem: { name: string; count: number; percentage: number } | null;
    mostPreferredPlatform: { name: string; count: number; percentage: number } | null;
    willingnessToPayRate: { count: number; percentage: number } | null;
  };
  businessTypeDistribution: Array<{ name: string; count: number; percentage: number }>;
  areaDistribution: Array<{ name: string; count: number; percentage: number }>;
  timeSeries: Array<{ date: string; count: number }>;
  salesManagement: {
    methods: Array<{ name: string; count: number; percentage: number }>;
    problems: Array<{ name: string; count: number; percentage: number }>;
  };
  inventoryManagement: {
    methods: Array<{ name: string; count: number; percentage: number }>;
    problems: Array<{ name: string; count: number; percentage: number }>;
  };
  creditUdhaar: {
    offersCredit: {
      yesCount: number;
      yesPercentage: number;
      sometimesCount: number;
      sometimesPercentage: number;
      noCount: number;
      noPercentage: number;
    };
    creditBusinessesDenominator: number;
    methods: Array<{ name: string; count: number; percentage: number }>;
    problems: Array<{ name: string; count: number; percentage: number }>;
  };
  expenseProfit: {
    methods: Array<{ name: string; count: number; percentage: number }>;
    problems: Array<{ name: string; count: number; percentage: number }>;
  };
  technology: {
    deviceUsage: Array<{ name: string; count: number; percentage: number }>;
    comfortLevels: Array<{ name: string; count: number; percentage: number }>;
  };
  solutionPreferences: {
    platforms: Array<{ name: string; count: number; percentage: number }>;
    languages: Array<{ name: string; count: number; percentage: number }>;
  };
  biggestProblemsRanking: Array<{ name: string; count: number; percentage: number; rank: number }>;
  voiceQuotes: Array<{
    id: string;
    businessType: string;
    area: string;
    singleBiggestProblem: string;
    oneThingToChange: string;
    submittedAt: string;
  }>;
  validationPricing: {
    wouldUseSoftware: Array<{ name: string; count: number; percentage: number }>;
    willingnessToPay: Array<{ name: string; count: number; percentage: number }>;
    priceRanges: Array<{ name: string; count: number; percentage: number }>;
    pricingModels: Array<{ name: string; count: number; percentage: number }>;
  };
  crossAnalysis: {
    businessTypeByProblem: Array<{ businessType: string; topProblem: string; count: number }>;
    businessTypeByPlatform: Array<{ businessType: string; topPlatform: string; count: number }>;
    businessTypeByWillingness: Array<{ businessType: string; willingPercentage: number; total: number }>;
  };
  automatedInsights: string[];
}

export async function computeResearchAnalytics(
  filters: AnalyticsFilterParams
): Promise<ResearchAnalyticsPayload> {
  // Research exports/analytics never include development/demo records.
  const conditions = [eq(surveyResponses.isDemo, false)];

  // Date Range Filtering
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

  // Category & Dimension Filtering
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

  // Query all matching rows joined
  const rows = await db
    .select({
      id: surveyResponses.id,
      submittedAt: surveyResponses.submittedAt,
      isDemo: surveyResponses.isDemo,
      businessType: businessProfiles.businessType,
      businessArea: businessProfiles.businessArea,
      businessName: businessProfiles.businessName,
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

  const sampleSize = rows.length;

  // Determine Sample Confidence Status
  let sampleStatus: 'none' | 'early' | 'small' | 'established' = 'none';
  let sampleNotice = 'No research data available yet.';

  if (sampleSize >= 20) {
    sampleStatus = 'established';
    sampleNotice = `Insights are based on the current submitted sample (N = ${sampleSize}).`;
  } else if (sampleSize >= 5) {
    sampleStatus = 'small';
    sampleNotice = `Small sample (N = ${sampleSize}) — findings should be interpreted cautiously.`;
  } else if (sampleSize >= 1) {
    sampleStatus = 'early';
    sampleNotice = `Early sample (N = ${sampleSize}) — insights are preliminary.`;
  }

  // Helper to calculate percentages
  const pct = (count: number, denom = sampleSize) =>
    denom > 0 ? Math.round((count / denom) * 1000) / 10 : 0;

  // 1. KPI Counts
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const responsesToday = rows.filter((r) => {
    return r.submittedAt && new Date(r.submittedAt).toISOString().slice(0, 10) === todayStr;
  }).length;

  const responsesThisWeek = rows.filter((r) => {
    return r.submittedAt && new Date(r.submittedAt) >= oneWeekAgo;
  }).length;

  // 2. Frequency counting helper for single string field
  const countDistribution = (getter: (r: (typeof rows)[0]) => string | null | undefined) => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const val = getter(r);
      if (val && val.trim()) {
        counts[val] = (counts[val] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: pct(count),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 3. Frequency counting helper for array field
  const countArrayDistribution = (getter: (r: (typeof rows)[0]) => string[] | null | undefined, customDenom?: number) => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const arr = getter(r);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && item.trim()) {
            counts[item] = (counts[item] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: pct(count, customDenom ?? sampleSize),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Compute distributions
  const businessTypeDistribution = countDistribution((r) => r.businessType);
  const areaDistribution = countDistribution((r) => r.businessArea);

  // Time series (by Day)
  const timeSeriesMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.submittedAt) {
      const d = new Date(r.submittedAt).toISOString().slice(0, 10);
      timeSeriesMap[d] = (timeSeriesMap[d] || 0) + 1;
    }
  }
  const timeSeries = Object.entries(timeSeriesMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sales Management
  const salesMethods = countDistribution((r) => r.salesRecordingMethod);
  const salesProblems = countArrayDistribution((r) => r.salesProblems);

  // Inventory Management
  const inventoryMethods = countDistribution((r) => r.inventoryManagementMethod);
  const inventoryProblems = countArrayDistribution((r) => r.inventoryProblems);

  // Customer Credit (Udhaar)
  const yesCredit = rows.filter((r) => r.providesCredit === 'Yes').length;
  const sometimesCredit = rows.filter((r) => r.providesCredit === 'Sometimes').length;
  const noCredit = rows.filter((r) => r.providesCredit === 'No').length;
  const creditDenom = yesCredit + sometimesCredit;

  // Credit methods & problems (denominator is strictly businesses that give credit)
  const creditMethods = countDistribution((r) =>
    r.providesCredit === 'Yes' || r.providesCredit === 'Sometimes' ? r.creditManagementMethod : null
  ).map((item) => ({
    ...item,
    percentage: pct(item.count, creditDenom),
  }));

  const creditProblems = countArrayDistribution(
    (r) => (r.providesCredit === 'Yes' || r.providesCredit === 'Sometimes' ? r.creditProblems : null),
    creditDenom
  );

  // Expenses & Profit
  const expenseMethods = countDistribution((r) => r.expenseTrackingMethod);
  const expenseProblems = countArrayDistribution((r) => r.expenseProblems);

  // Technology Readiness
  const deviceUsage = countArrayDistribution((r) => r.currentTechnology);
  const techComfort = countDistribution((r) => r.techComfortLevel);

  // Solution Preferences
  const solutionPlatforms = countDistribution((r) => r.preferredSolutionPlatform);
  const languages = countDistribution((r) => r.preferredLanguage);

  // Biggest Problem Areas (Ranking)
  const rawProblemRanking = countArrayDistribution((r) => r.biggestProblemAreas);
  const biggestProblemsRanking = rawProblemRanking.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  // Software Validation & Pricing
  const wouldUseSoftware = countDistribution((r) => r.wouldUseSoftware);
  const willingnessToPay = countDistribution((r) => r.willingToPay);
  const priceRanges = countDistribution((r) => r.priceRange);
  const pricingModels = countDistribution((r) => r.preferredPricingModel);

  // Voice Quotes (Sample of actual merchant quotes, avoiding PII)
  const voiceQuotes = rows
    .filter((r) => (r.singleBiggestProblem && r.singleBiggestProblem.trim().length > 5) || (r.oneThingToChange && r.oneThingToChange.trim().length > 5))
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      businessType: r.businessType || 'Retail Shop',
      area: r.businessArea || 'Dadu',
      singleBiggestProblem: r.singleBiggestProblem || '',
      oneThingToChange: r.oneThingToChange || '',
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '',
    }));

  // Cross-Analysis
  // 1. Business Type × Biggest Problem Area
  const bizTypeProblemMap: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const bt = r.businessType || 'Other';
    if (!bizTypeProblemMap[bt]) bizTypeProblemMap[bt] = {};
    if (Array.isArray(r.biggestProblemAreas)) {
      for (const p of r.biggestProblemAreas) {
        bizTypeProblemMap[bt][p] = (bizTypeProblemMap[bt][p] || 0) + 1;
      }
    }
  }

  const businessTypeByProblem: Array<{ businessType: string; topProblem: string; count: number }> = [];
  for (const [bt, pMap] of Object.entries(bizTypeProblemMap)) {
    let topP = 'None';
    let maxC = 0;
    for (const [p, c] of Object.entries(pMap)) {
      if (c > maxC) {
        maxC = c;
        topP = p;
      }
    }
    if (maxC > 0) {
      businessTypeByProblem.push({ businessType: bt, topProblem: topP, count: maxC });
    }
  }

  // 2. Business Type × Preferred Platform
  const bizTypePlatformMap: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const bt = r.businessType || 'Other';
    const plat = r.preferredSolutionPlatform || 'Not Sure';
    if (!bizTypePlatformMap[bt]) bizTypePlatformMap[bt] = {};
    bizTypePlatformMap[bt][plat] = (bizTypePlatformMap[bt][plat] || 0) + 1;
  }
  const businessTypeByPlatform: Array<{ businessType: string; topPlatform: string; count: number }> = [];
  for (const [bt, plMap] of Object.entries(bizTypePlatformMap)) {
    let topPlat = 'Not Sure';
    let maxC = 0;
    for (const [plat, c] of Object.entries(plMap)) {
      if (c > maxC) {
        maxC = c;
        topPlat = plat;
      }
    }
    if (maxC > 0) {
      businessTypeByPlatform.push({ businessType: bt, topPlatform: topPlat, count: maxC });
    }
  }

  // 3. Business Type × Willingness to Pay
  const bizTypeWillingMap: Record<string, { total: number; willing: number }> = {};
  for (const r of rows) {
    const bt = r.businessType || 'Other';
    if (!bizTypeWillingMap[bt]) bizTypeWillingMap[bt] = { total: 0, willing: 0 };
    bizTypeWillingMap[bt].total++;
    if (r.willingToPay === 'Yes') {
      bizTypeWillingMap[bt].willing++;
    }
  }
  const businessTypeByWillingness = Object.entries(bizTypeWillingMap)
    .filter(([_, data]) => data.total >= 1)
    .map(([bt, data]) => ({
      businessType: bt,
      total: data.total,
      willingPercentage: Math.round((data.willing / data.total) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);

  // Automated Research Insights (Deterministic Statistical Observations)
  const automatedInsights: string[] = [];

  if (sampleSize > 0) {
    // Insight 1: Most common business type
    if (businessTypeDistribution.length > 0) {
      const topBiz = businessTypeDistribution[0];
      automatedInsights.push(
        `${topBiz.count} of ${sampleSize} surveyed merchants (${topBiz.percentage}%) operate in the "${topBiz.name}" category.`
      );
    }

    // Insight 2: Sales recording method
    const notebookSales = salesMethods.find((m) => m.name.toLowerCase().includes('notebook'));
    if (notebookSales) {
      automatedInsights.push(
        `${notebookSales.percentage}% of respondents (${notebookSales.count} of ${sampleSize}) primarily use a paper notebook or register to log daily sales.`
      );
    }

    // Insight 3: Udhaar prevalence & bottleneck
    if (creditDenom > 0) {
      const udhaarPct = pct(creditDenom, sampleSize);
      automatedInsights.push(
        `${creditDenom} of ${sampleSize} businesses (${udhaarPct}%) extend customer credit (udhaar). Among them, ${
          creditProblems.length > 0
            ? `${creditProblems[0].count} (${creditProblems[0].percentage}%) reported "${creditProblems[0].name}"`
            : 'various credit collection challenges were cited'
        }.`
      );
    }

    // Insight 4: Preferred platform
    if (solutionPlatforms.length > 0) {
      const topPlatform = solutionPlatforms[0];
      automatedInsights.push(
        `${topPlatform.count} of ${sampleSize} respondents (${topPlatform.percentage}%) indicated "${topPlatform.name}" as their preferred digital interface format.`
      );
    }

    // Insight 5: Software adoption & Willingness to Pay
    const willingYes = willingnessToPay.find((w) => w.name === 'Yes');
    if (willingYes) {
      automatedInsights.push(
        `${willingYes.count} respondents (${willingYes.percentage}%) expressed initial willingness to pay for a dedicated solution that resolves their daily operational friction.`
      );
    }

    // Insight 6: Top ranked problem area
    if (biggestProblemsRanking.length > 0) {
      const topProb = biggestProblemsRanking[0];
      automatedInsights.push(
        `The most frequently reported operational friction area is "${topProb.name}", cited by ${topProb.count} merchants (${topProb.percentage}%).`
      );
    }
  }

  // Top KPI Entities
  const mostCommonBusinessType = businessTypeDistribution[0] || null;
  const mostReportedProblem = biggestProblemsRanking[0] || null;
  const mostPreferredPlatform = solutionPlatforms[0] || null;
  const willingPayYes = willingnessToPay.find((w) => w.name === 'Yes');
  const willingnessToPayRate = willingPayYes
    ? { count: willingPayYes.count, percentage: willingPayYes.percentage }
    : null;

  return {
    sampleSize,
    sampleStatus,
    sampleNotice,
    lastUpdated: new Date().toISOString(),
    kpis: {
      totalResponses: sampleSize,
      responsesToday,
      responsesThisWeek,
      businessesSurveyed: sampleSize,
      mostCommonBusinessType,
      mostReportedProblem,
      mostPreferredPlatform,
      willingnessToPayRate,
    },
    businessTypeDistribution,
    areaDistribution,
    timeSeries,
    salesManagement: {
      methods: salesMethods,
      problems: salesProblems,
    },
    inventoryManagement: {
      methods: inventoryMethods,
      problems: inventoryProblems,
    },
    creditUdhaar: {
      offersCredit: {
        yesCount: yesCredit,
        yesPercentage: pct(yesCredit),
        sometimesCount: sometimesCredit,
        sometimesPercentage: pct(sometimesCredit),
        noCount: noCredit,
        noPercentage: pct(noCredit),
      },
      creditBusinessesDenominator: creditDenom,
      methods: creditMethods,
      problems: creditProblems,
    },
    expenseProfit: {
      methods: expenseMethods,
      problems: expenseProblems,
    },
    technology: {
      deviceUsage,
      comfortLevels: techComfort,
    },
    solutionPreferences: {
      platforms: solutionPlatforms,
      languages,
    },
    biggestProblemsRanking,
    voiceQuotes,
    validationPricing: {
      wouldUseSoftware,
      willingnessToPay,
      priceRanges,
      pricingModels,
    },
    crossAnalysis: {
      businessTypeByProblem,
      businessTypeByPlatform,
      businessTypeByWillingness,
    },
    automatedInsights,
  };
}
