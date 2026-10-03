import { Router } from 'express';
import { z } from 'zod';
import {
  createSessionToken,
  getSessionFromRequest,
  requireAdminAuth,
  verifyAdminPassword,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from './auth-session.ts';
import { db } from '../db/index.ts';
import {
  surveyResponses,
  businessProfiles,
  operationalAnswers,
  validationAndFeedback,
} from '../db/schema.ts';
import { sql, eq, and, desc, asc, ilike, or } from 'drizzle-orm';
import { generateSurveyResponsePdf } from './pdf-generator.ts';
import { computeResearchAnalytics, type AnalyticsFilterParams } from './analytics-service.ts';
import { generateResponsesCsv, generateAnalyticsSummaryCsv } from './export-service.ts';
import { generateResearchReportPdf } from './research-report-pdf.ts';
import { createRateLimiter } from '../middleware/rate-limiter.ts';

const router = Router();

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'suhailahmedaamro786@gmail.com';
const FALLBACK_ADMIN_EMAIL = 'admin@dadubusinessinsights.pk';
const adminLoginLimiter = createRateLimiter(15 * 60 * 1000, 10);

const analyticsFilterSchema = z.object({
  dateRange: z.enum(['all', 'today', '7d', '30d', 'custom']).default('all'),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  businessType: z.string().trim().min(1).max(100).optional(),
  area: z.string().trim().min(1).max(150).optional(),
  platform: z.string().trim().min(1).max(100).optional(),
  willingToPay: z.enum(['Yes', 'Maybe', 'No', 'All']).optional(),
}).superRefine((value, ctx) => {
  if (value.dateRange === 'custom' && (!value.startDate || !value.endDate)) {
    ctx.addIssue({ code: 'custom', message: 'Custom date range requires both startDate and endDate.', path: ['dateRange'] });
  }
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    ctx.addIssue({ code: 'custom', message: 'startDate must be before or equal to endDate.', path: ['startDate'] });
  }
});

function parseAnalyticsFilters(query: Record<string, unknown>): AnalyticsFilterParams {
  const parsed = analyticsFilterSchema.safeParse({
    dateRange: typeof query.dateRange === 'string' ? query.dateRange : 'all',
    startDate: typeof query.startDate === 'string' ? query.startDate : undefined,
    endDate: typeof query.endDate === 'string' ? query.endDate : undefined,
    businessType: typeof query.businessType === 'string' ? query.businessType : undefined,
    area: typeof query.area === 'string' ? query.area : undefined,
    platform: typeof query.platform === 'string' ? query.platform : undefined,
    willingToPay: typeof query.willingToPay === 'string' ? query.willingToPay : undefined,
  });
  if (!parsed.success) throw new Error('Invalid export filters');
  return parsed.data;
}

/**
 * POST /api/admin/auth/login
 * Authenticates admin credentials and issues signed HTTP-only cookie.
 */
router.post('/auth/login', adminLoginLimiter, (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Administrator password is required',
      });
    }

    const cleanEmail = DEFAULT_ADMIN_EMAIL.trim().toLowerCase();

    if (!verifyAdminPassword(password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials. Please verify your email and password.',
      });
    }

    // Generate signed HMAC session token
    const token = createSessionToken({
      email: cleanEmail,
      name: 'Administrator (Suhail Ahmed)',
      role: 'admin',
    });

    // Set secure HTTP-only cookie
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS,
    });

    return res.json({
      success: true,
      user: {
        email: cleanEmail,
        name: 'Administrator (Suhail Ahmed)',
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.',
    });
  }
});

/**
 * GET /api/admin/auth/me
 * Verifies active admin session.
 */
router.get('/auth/me', (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({
      authenticated: false,
      error: 'No active session or session expired',
    });
  }

  return res.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      expiresAt: session.expiresAt,
    },
  });
});

/**
 * POST /api/admin/auth/logout
 * Destroys active admin session cookie.
 */
router.post('/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/admin/stats
 * Protected KPI statistics queried directly from PostgreSQL.
 */
router.get('/stats', requireAdminAuth, async (_req, res) => {
  try {
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(surveyResponses);

    const [todayRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(surveyResponses)
      .where(and(eq(surveyResponses.isDemo, false), sql`DATE(${surveyResponses.submittedAt}) = CURRENT_DATE`));

    const [bizRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessProfiles);

    const areaDistribution = await db
      .select({
        area: businessProfiles.businessArea,
        count: sql<number>`count(*)::int`,
      })
      .from(businessProfiles)
      .groupBy(businessProfiles.businessArea)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    return res.json({
      success: true,
      stats: {
        totalResponses: totalRow?.count || 0,
        responsesToday: todayRow?.count || 0,
        businessesSurveyed: bizRow?.count || 0,
        topAreas: areaDistribution || [],
      },
    });
  } catch (error) {
    console.error('Failed to query admin stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve database statistics.',
    });
  }
});

/**
 * GET /api/admin/responses
 * Protected response list with server-side search, filtering, sorting, and pagination.
 */
router.get('/responses', requireAdminAuth, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const businessType = typeof req.query.businessType === 'string' ? req.query.businessType.trim() : '';
    const area = typeof req.query.area === 'string' ? req.query.area.trim() : '';
    const platform = typeof req.query.platform === 'string' ? req.query.platform.trim() : '';
    const willingToPay = typeof req.query.willingToPay === 'string' ? req.query.willingToPay.trim() : '';
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : 'newest';

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(businessProfiles.businessName, searchPattern),
          ilike(businessProfiles.businessType, searchPattern),
          ilike(businessProfiles.businessArea, searchPattern),
          ilike(validationAndFeedback.singleBiggestProblem, searchPattern)
        )
      );
    }

    if (businessType && businessType !== 'All') {
      conditions.push(eq(businessProfiles.businessType, businessType));
    }

    if (area && area !== 'All') {
      conditions.push(eq(businessProfiles.businessArea, area));
    }

    if (platform && platform !== 'All') {
      conditions.push(eq(operationalAnswers.preferredSolutionPlatform, platform));
    }

    if (willingToPay && willingToPay !== 'All') {
      conditions.push(eq(validationAndFeedback.willingToPay, willingToPay));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get filtered total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(surveyResponses)
      .leftJoin(businessProfiles, eq(surveyResponses.id, businessProfiles.responseId))
      .leftJoin(operationalAnswers, eq(surveyResponses.id, operationalAnswers.responseId))
      .leftJoin(validationAndFeedback, eq(surveyResponses.id, validationAndFeedback.responseId))
      .where(whereClause);

    const totalCount = countResult?.count || 0;

    // 2. Determine sort order
    let orderByClause;
    switch (sortBy) {
      case 'oldest':
        orderByClause = asc(surveyResponses.submittedAt);
        break;
      case 'businessType':
        orderByClause = asc(businessProfiles.businessType);
        break;
      case 'businessName':
        orderByClause = asc(businessProfiles.businessName);
        break;
      case 'newest':
      default:
        orderByClause = desc(surveyResponses.submittedAt);
        break;
    }

    // 3. Query paginated records
    const rows = await db
      .select({
        id: surveyResponses.id,
        submittedAt: surveyResponses.submittedAt,
        isDemo: surveyResponses.isDemo,
        completionTimeSeconds: surveyResponses.completionTimeSeconds,
        businessName: businessProfiles.businessName,
        businessType: businessProfiles.businessType,
        businessTypeOther: businessProfiles.businessTypeOther,
        businessArea: businessProfiles.businessArea,
        approxDailyCustomers: businessProfiles.approxDailyCustomers,
        approxDailySales: businessProfiles.approxDailySales,
        yearsInBusiness: businessProfiles.yearsInBusiness,
        contactWhatsapp: businessProfiles.contactWhatsapp,
        salesRecordingMethod: operationalAnswers.salesRecordingMethod,
        preferredSolutionPlatform: operationalAnswers.preferredSolutionPlatform,
        preferredLanguage: operationalAnswers.preferredLanguage,
        providesCredit: operationalAnswers.providesCredit,
        currentTechnology: operationalAnswers.currentTechnology,
        singleBiggestProblem: validationAndFeedback.singleBiggestProblem,
        wouldUseSoftware: validationAndFeedback.wouldUseSoftware,
        willingToPay: validationAndFeedback.willingToPay,
        priceRange: validationAndFeedback.priceRange,
      })
      .from(surveyResponses)
      .leftJoin(businessProfiles, eq(surveyResponses.id, businessProfiles.responseId))
      .leftJoin(operationalAnswers, eq(surveyResponses.id, operationalAnswers.responseId))
      .leftJoin(validationAndFeedback, eq(surveyResponses.id, validationAndFeedback.responseId))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return res.json({
      success: true,
      responses: rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Failed to query responses:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve survey responses from database.',
    });
  }
});

/**
 * Helper to fetch a full response record with all 4 tables
 */
async function fetchFullSurveyRecord(responseId: string) {
  const [response] = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.id, responseId));

  if (!response) return null;

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.responseId, responseId));

  const [ops] = await db
    .select()
    .from(operationalAnswers)
    .where(eq(operationalAnswers.responseId, responseId));

  const [val] = await db
    .select()
    .from(validationAndFeedback)
    .where(eq(validationAndFeedback.responseId, responseId));

  return {
    id: response.id,
    submittedAt: response.submittedAt,
    ipHash: response.ipHash,
    completionTimeSeconds: response.completionTimeSeconds,
    isDemo: response.isDemo,
    businessProfile: profile || null,
    operationalAnswers: ops || null,
    validationAndFeedback: val || null,
  };
}

/**
 * GET /api/admin/responses/:id
 * Protected full detail view for an individual response.
 */
router.get('/responses/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid response ID' });
    }

    const record = await fetchFullSurveyRecord(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Response not found' });
    }

    return res.json({
      success: true,
      response: record,
    });
  } catch (error) {
    console.error('Error fetching individual survey record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve response details from database.',
    });
  }
});

/**
 * GET /api/admin/responses/:id/pdf
 * Generates and downloads a high-fidelity PDF of the research response.
 */
router.get('/responses/:id/pdf', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid response ID' });
    }

    const record = await fetchFullSurveyRecord(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Survey response not found' });
    }

    const pdfBuffer = await generateSurveyResponsePdf(record);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Dadu-Business-Insights-Response-${record.id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error('Failed to generate response PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while generating the PDF document.',
    });
  }
});

/**
 * GET /api/admin/analytics
 * Protected research analytics calculation engine querying live PostgreSQL data.
 */
router.get('/analytics', requireAdminAuth, async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query as Record<string, unknown>);

    const analytics = await computeResearchAnalytics(filters);

    return res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid export filters') {
      return res.status(400).json({ success: false, error: 'Invalid research filters.' });
    }
    console.error('Failed to compute research analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to load research data. Please try again.',
    });
  }
});

/**
 * GET /api/admin/exports/responses.csv
 * Exports real surveyed business response records to CSV.
 * Privacy-first: WhatsApp/contact numbers only included when includeContact=true is explicitly confirmed.
 */
router.get('/exports/responses.csv', requireAdminAuth, async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query as Record<string, unknown>);

    const includeContact = req.query.includeContact === 'true';

    const { filename, csvContent, count } = await generateResponsesCsv(filters, includeContact);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Total-Count', String(count));

    return res.send(csvContent);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid export filters') {
      return res.status(400).json({ success: false, error: 'Invalid export filters.' });
    }
    console.error('Failed to export responses CSV:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to generate the export. Please try again.',
    });
  }
});

/**
 * GET /api/admin/exports/analytics.csv
 * Exports categorized research analytics metrics, counts, and percentages to CSV.
 */
router.get('/exports/analytics.csv', requireAdminAuth, async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query as Record<string, unknown>);

    const { filename, csvContent } = await generateAnalyticsSummaryCsv(filters);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.send(csvContent);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid export filters') {
      return res.status(400).json({ success: false, error: 'Invalid export filters.' });
    }
    console.error('Failed to export analytics summary CSV:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to generate the export. Please try again.',
    });
  }
});

/**
 * GET /api/admin/exports/research-report.pdf
 * Generates official 12-section research report PDF with cover page and deterministic findings.
 */
router.get('/exports/research-report.pdf', requireAdminAuth, async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query as Record<string, unknown>);

    const pdfBuffer = await generateResearchReportPdf(filters);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Dadu-Business-Insights-Research-Report-${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid export filters') {
      return res.status(400).json({ success: false, error: 'Invalid export filters.' });
    }
    console.error('Failed to generate research report PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to generate the research report. Please try again.',
    });
  }
});

export default router;
