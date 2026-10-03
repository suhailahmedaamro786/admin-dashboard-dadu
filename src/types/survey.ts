/**
 * Dadu Business Insights - Domain Types & Research Survey Contracts
 */

export const BUSINESS_TYPES = [
  'Grocery / General Store',
  'Garments',
  'Pharmacy',
  'Restaurant / Food',
  'Electronics',
  'Mobile Shop',
  'Hardware',
  'Cosmetics',
  'Agriculture-related',
  'Wholesale',
  'Retail',
  'Services',
  'Other',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const YEARS_IN_BUSINESS_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  'More than 10 years',
] as const;

export const DAILY_CUSTOMERS_OPTIONS = [
  'Under 20',
  '20–50',
  '50–100',
  '100–250',
  'More than 250',
] as const;

export const DAILY_SALES_OPTIONS = [
  'Under Rs. 10,000',
  'Rs. 10,000–30,000',
  'Rs. 30,000–75,000',
  'Rs. 75,000–150,000',
  'More than Rs. 150,000',
] as const;

export const DADU_AREAS = [
  'Shahi Bazaar',
  'Station Road',
  'Cinema Road',
  'New Bus Stand',
  'Makhdoom Bilawal Chowk',
  'Phulji Station Road',
  'Gharibabad',
  'Civil Hospital Road',
  'Other Area in Dadu',
] as const;

export const SALES_RECORDING_METHODS = [
  'Notebook / Register',
  'Excel',
  'Mobile App',
  'POS Software',
  'Computer Software',
  'No Proper System',
  'Other',
] as const;

export const SALES_PROBLEMS = [
  'Sales calculation takes too much time',
  'Difficult to maintain records',
  'Difficult to see daily sales',
  'Difficult to see monthly sales',
  'Difficult to calculate profit',
  'Records can be lost',
  'Other',
] as const;

export const INVENTORY_METHODS = [
  'Manually',
  'Notebook',
  'Excel',
  'POS / Software',
  'No Proper System',
  'Other',
] as const;

export const INVENTORY_PROBLEMS = [
  "Don't know exact stock quantity",
  'Products unexpectedly run out',
  'Stock counting takes too much time',
  'Difficult to track purchases',
  'Difficult to track damaged products',
  'Difficult to track expired products',
  'Difficult to identify low-stock products',
  'Other',
] as const;

export const CREDIT_PROVISION_OPTIONS = ['Yes', 'No', 'Sometimes'] as const;

export const CREDIT_METHODS = [
  'Notebook',
  'Excel',
  'Mobile App',
  'Software',
  'Memory / Verbal',
  'Other',
] as const;

export const CREDIT_PROBLEMS = [
  'Difficult to remember outstanding payments',
  'Difficult to calculate total credit',
  'Difficult to track payment history',
  'Customers forget outstanding amounts',
  'Need payment reminders',
  'Other',
] as const;

export const EXPENSE_METHODS = [
  'Notebook',
  'Excel',
  'Software',
  'No Proper Record',
  'Other',
] as const;

export const EXPENSE_PROBLEMS = [
  'Daily expenses are difficult to record',
  'Monthly expenses are unclear',
  'Actual profit is difficult to calculate',
  'Purchase costs are difficult to track',
  'Selling price vs cost is difficult to compare',
  'Other',
] as const;

export const TECHNOLOGY_OPTIONS = [
  'Smartphone',
  'Computer',
  'Laptop',
  'Tablet',
  'WhatsApp',
  'Excel',
  'POS',
  'Accounting Software',
  'Other',
] as const;

export const TECH_COMFORT_LEVELS = [
  'Very Comfortable',
  'Comfortable',
  'Average',
  'Difficult',
  'Very Difficult',
] as const;

export const SOLUTION_PLATFORMS = [
  'Mobile App',
  'Website',
  'Desktop Software',
  'WhatsApp-based Solution',
  'Not Sure',
] as const;

export const LANGUAGE_PREFERENCES = [
  'English',
  'Urdu',
  'Sindhi',
  'Urdu + Sindhi',
  'English + Urdu',
] as const;

export const PROBLEM_AREAS = [
  'Sales',
  'Stock',
  'Customer Credit / Udhaar',
  'Expenses',
  'Profit Calculation',
  'Customer Management',
  'Supplier Management',
  'Reporting',
  'Employee Management',
  'Orders',
  'Payments',
  'Marketing',
  'Other',
] as const;

export const THREE_WAY_CHOICE = ['Yes', 'Maybe', 'No'] as const;

export const PRICING_MODELS = [
  'Monthly Subscription',
  'Yearly Subscription',
  'One-Time Payment',
  'Free',
  'Not Sure',
] as const;

export const PRICE_RANGES = [
  'Under Rs. 500',
  'Rs. 500–1,000',
  'Rs. 1,000–2,500',
  'Rs. 2,500–5,000',
  'More than Rs. 5,000',
  'Not Willing to Pay',
] as const;

/**
 * Survey payload submitted by respondent
 */
export interface SurveySubmissionPayload {
  // Metadata (optional client metrics)
  completionTimeSeconds?: number;
  isDemo?: boolean;

  // Step 1: Business Information
  businessName?: string;
  businessType: string;
  businessTypeOther?: string;
  yearsInBusiness: string;
  approxDailyCustomers: string;
  approxDailySales: string;
  businessArea: string;
  contactWhatsapp?: string;

  // Step 2: Sales Management
  salesRecordingMethod: string;
  salesProblems: string[];

  // Step 3: Stock / Inventory
  inventoryManagementMethod: string;
  inventoryProblems: string[];

  // Step 4: Customer Credit / Udhaar
  providesCredit: string;
  creditManagementMethod?: string;
  creditProblems: string[];

  // Step 5: Expenses & Profit
  expenseTrackingMethod: string;
  expenseProblems: string[];

  // Step 6: Technology
  currentTechnology: string[];
  techComfortLevel: string;

  // Step 7: Preferred Solution
  preferredSolutionPlatform: string;
  preferredLanguage: string;

  // Step 8: Biggest Problems
  biggestProblemAreas: string[];
  singleBiggestProblem: string;

  // Step 9: Software & Payment Validation
  wouldUseSoftware: string;
  willingToPay: string;
  preferredPricingModel: string;
  priceRange: string;

  // Step 10: Final Research Question
  oneThingToChange: string;
}

/**
 * Standard API Response contracts
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
