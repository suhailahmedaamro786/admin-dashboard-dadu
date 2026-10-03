import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Admin Users table for managing researchers and administrators.
 * Linked to Firebase Authentication UID.
 */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role').notNull().default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_admin_users_email').on(table.email),
    index('idx_admin_users_uid').on(table.uid),
  ]
);

/**
 * Survey Responses - Parent record for each submitted survey
 */
export const surveyResponses = pgTable(
  'survey_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    ipHash: text('ip_hash'), // Anonymized SHA-256 hash for fraud/rate-limiting detection
    completionTimeSeconds: integer('completion_time_seconds'),
    isDemo: boolean('is_demo').default(false).notNull(), // Guaranteed separation: demo data never pollutes research
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_survey_responses_submitted_at').on(table.submittedAt),
    index('idx_survey_responses_is_demo').on(table.isDemo),
  ]
);

/**
 * Business Profiles - Demographic and business metadata (Step 1)
 */
export const businessProfiles = pgTable(
  'business_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    responseId: uuid('response_id')
      .references(() => surveyResponses.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    businessName: text('business_name'), // Optional
    businessType: text('business_type').notNull(), // Grocery, Garments, Pharmacy, etc.
    businessTypeOther: text('business_type_other'),
    yearsInBusiness: text('years_in_business').notNull(),
    approxDailyCustomers: text('approx_daily_customers').notNull(),
    approxDailySales: text('approx_daily_sales').notNull(),
    businessArea: text('business_area').notNull(), // Shahi Bazaar, Station Road, etc.
    contactWhatsapp: text('contact_whatsapp'), // Optional
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_business_profiles_type').on(table.businessType),
    index('idx_business_profiles_area').on(table.businessArea),
  ]
);

/**
 * Operational Answers - Day-to-day workflow, methods, and specific problems (Steps 2-7)
 */
export const operationalAnswers = pgTable(
  'operational_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    responseId: uuid('response_id')
      .references(() => surveyResponses.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    // Step 2: Sales
    salesRecordingMethod: text('sales_recording_method').notNull(),
    salesProblems: text('sales_problems').array().notNull().default([]),
    // Step 3: Stock / Inventory
    inventoryManagementMethod: text('inventory_management_method').notNull(),
    inventoryProblems: text('inventory_problems').array().notNull().default([]),
    // Step 4: Customer Credit / Udhaar
    providesCredit: text('provides_credit').notNull(), // 'Yes' | 'No' | 'Sometimes'
    creditManagementMethod: text('credit_management_method'),
    creditProblems: text('credit_problems').array().notNull().default([]),
    // Step 5: Expenses & Profit
    expenseTrackingMethod: text('expense_tracking_method').notNull(),
    expenseProblems: text('expense_problems').array().notNull().default([]),
    // Step 6: Technology
    currentTechnology: text('current_technology').array().notNull().default([]),
    techComfortLevel: text('tech_comfort_level').notNull(),
    // Step 7: Preferences
    preferredSolutionPlatform: text('preferred_solution_platform').notNull(),
    preferredLanguage: text('preferred_language').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_operational_provides_credit').on(table.providesCredit),
    index('idx_operational_platform').on(table.preferredSolutionPlatform),
  ]
);

/**
 * Validation & Feedback - Pain point prioritization, qualitative narratives & pricing (Steps 8-10)
 */
export const validationAndFeedback = pgTable(
  'validation_and_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    responseId: uuid('response_id')
      .references(() => surveyResponses.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    // Step 8: Biggest Problems
    biggestProblemAreas: text('biggest_problem_areas').array().notNull().default([]),
    singleBiggestProblem: text('single_biggest_problem').notNull(),
    // Step 9: Software & Payment Validation
    wouldUseSoftware: text('would_use_software').notNull(), // 'Yes' | 'Maybe' | 'No'
    willingToPay: text('willing_to_pay').notNull(), // 'Yes' | 'Maybe' | 'No'
    preferredPricingModel: text('preferred_pricing_model').notNull(),
    priceRange: text('price_range').notNull(),
    // Step 10: Final Research Question
    oneThingToChange: text('one_thing_to_change').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_validation_willing_to_pay').on(table.willingToPay),
    index('idx_validation_would_use').on(table.wouldUseSoftware),
  ]
);

/**
 * Relationships
 */
export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  businessProfile: one(businessProfiles, {
    fields: [surveyResponses.id],
    references: [businessProfiles.responseId],
  }),
  operationalAnswers: one(operationalAnswers, {
    fields: [surveyResponses.id],
    references: [operationalAnswers.responseId],
  }),
  validationAndFeedback: one(validationAndFeedback, {
    fields: [surveyResponses.id],
    references: [validationAndFeedback.responseId],
  }),
}));

export const businessProfilesRelations = relations(businessProfiles, ({ one }) => ({
  surveyResponse: one(surveyResponses, {
    fields: [businessProfiles.responseId],
    references: [surveyResponses.id],
  }),
}));

export const operationalAnswersRelations = relations(operationalAnswers, ({ one }) => ({
  surveyResponse: one(surveyResponses, {
    fields: [operationalAnswers.responseId],
    references: [surveyResponses.id],
  }),
}));

export const validationAndFeedbackRelations = relations(validationAndFeedback, ({ one }) => ({
  surveyResponse: one(surveyResponses, {
    fields: [validationAndFeedback.responseId],
    references: [surveyResponses.id],
  }),
}));
