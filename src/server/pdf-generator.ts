import PDFDocument from 'pdfkit';
import fs from 'fs';

export interface FullSurveyResponseRecord {
  id: string;
  submittedAt: string | Date;
  ipHash: string | null;
  completionTimeSeconds: number | null;
  isDemo: boolean;
  businessProfile: {
    businessName: string | null;
    businessType: string;
    businessTypeOther: string | null;
    yearsInBusiness: string;
    approxDailyCustomers: string;
    approxDailySales: string;
    businessArea: string;
    contactWhatsapp: string | null;
  } | null;
  operationalAnswers: {
    salesRecordingMethod: string;
    salesProblems: string[];
    inventoryManagementMethod: string;
    inventoryProblems: string[];
    providesCredit: string;
    creditManagementMethod: string | null;
    creditProblems: string[];
    expenseTrackingMethod: string;
    expenseProblems: string[];
    currentTechnology: string[];
    techComfortLevel: string;
    preferredSolutionPlatform: string;
    preferredLanguage: string;
  } | null;
  validationAndFeedback: {
    biggestProblemAreas: string[];
    singleBiggestProblem: string;
    wouldUseSoftware: string;
    willingToPay: string;
    preferredPricingModel: string;
    priceRange: string;
    oneThingToChange: string;
  } | null;
}

const UNICODE_FONT_PATH = '/usr/share/fonts/truetype/freefont/FreeSerif.ttf';
const UNICODE_BOLD_FONT_PATH = '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf';

export function generateSurveyResponsePdf(record: FullSurveyResponseRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Dadu Business Insights - Response ${record.id}`,
        Author: 'Dadu Business Insights Research Team',
        Subject: 'SME Field Research Survey Record',
        Keywords: 'Dadu, Sindh, SME, Field Research, Business Insights',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Register Unicode fonts if available
    const hasUnicodeFont = fs.existsSync(UNICODE_FONT_PATH);
    const hasBoldFont = fs.existsSync(UNICODE_BOLD_FONT_PATH);

    if (hasUnicodeFont) {
      doc.registerFont('Regular', UNICODE_FONT_PATH);
    }
    if (hasBoldFont) {
      doc.registerFont('Bold', UNICODE_BOLD_FONT_PATH);
    }

    const regFont = hasUnicodeFont ? 'Regular' : 'Helvetica';
    const boldFont = hasBoldFont ? 'Bold' : (hasUnicodeFont ? 'Regular' : 'Helvetica-Bold');

    // Helper: Section Header
    const drawSectionHeader = (title: string, sectionNumber: number) => {
      // Avoid orphan section headers near page bottom
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.moveDown(0.8);
      const startY = doc.y;

      // Section label pill
      doc.rect(40, startY, doc.page.width - 80, 22).fill('#f1f5f9');
      doc.rect(40, startY, 4, 22).fill('#059669'); // Emerald accent bar

      doc.font(boldFont).fontSize(10).fillColor('#0f172a');
      doc.text(`SECTION ${sectionNumber}: ${title.toUpperCase()}`, 52, startY + 5);

      doc.y = startY + 28;
    };

    // Helper: Field Row
    const drawFieldRow = (label: string, value: string | null | undefined, isHighlight = false) => {
      const displayVal = value && value.trim() ? value.trim() : 'Not provided';

      // Check remaining space
      if (doc.y > doc.page.height - 70) {
        doc.addPage();
      }

      const currentY = doc.y;
      doc.font(boldFont).fontSize(8.5).fillColor('#475569');
      doc.text(label, 48, currentY, { width: 170 });

      doc.font(regFont).fontSize(8.5).fillColor(isHighlight ? '#047857' : '#0f172a');
      doc.text(displayVal, 225, currentY, { width: doc.page.width - 275 });

      doc.moveDown(0.3);
    };

    // Helper: Array / Tags Row
    const drawArrayRow = (label: string, items: string[] | undefined) => {
      if (doc.y > doc.page.height - 70) {
        doc.addPage();
      }

      const currentY = doc.y;
      doc.font(boldFont).fontSize(8.5).fillColor('#475569');
      doc.text(label, 48, currentY, { width: 170 });

      const text = items && items.length > 0 ? items.join(', ') : 'None reported / None selected';
      doc.font(regFont).fontSize(8.5).fillColor('#0f172a');
      doc.text(text, 225, currentY, { width: doc.page.width - 275 });

      doc.moveDown(0.3);
    };

    // Helper: Quote Box for free text
    const drawNarrativeBox = (label: string, narrative: string | null | undefined) => {
      if (doc.y > doc.page.height - 90) {
        doc.addPage();
      }

      const currentY = doc.y;
      doc.font(boldFont).fontSize(8.5).fillColor('#475569');
      doc.text(label, 48, currentY);
      doc.moveDown(0.3);

      const content = narrative && narrative.trim() ? narrative.trim() : 'Not provided';
      const quoteY = doc.y;

      // Draw light background card
      doc.font(regFont).fontSize(8.5);
      const textHeight = doc.heightOfString(content, { width: doc.page.width - 110 });
      doc.rect(48, quoteY, doc.page.width - 96, textHeight + 12).fill('#f8fafc');
      doc.rect(48, quoteY, 3, textHeight + 12).fill('#0ea5e9');

      doc.font(regFont).fontSize(8.5).fillColor('#1e293b');
      doc.text(`"${content}"`, 56, quoteY + 6, { width: doc.page.width - 112 });

      doc.y = quoteY + textHeight + 18;
    };

    // ==========================================
    // 1. BRAND HEADER & RESEARCH TITLE
    // ==========================================
    // Top banner
    doc.rect(40, 40, doc.page.width - 80, 50).fill('#0f172a');

    doc.font(boldFont).fontSize(14).fillColor('#ffffff');
    doc.text('DADU BUSINESS INSIGHTS', 52, 48);

    doc.font(regFont).fontSize(8).fillColor('#34d399');
    doc.text('FIELD RESEARCH INITIATIVE · SME DIGITAL OPERATIONS STUDY (DADU, SINDH)', 52, 66);

    doc.font(regFont).fontSize(7.5).fillColor('#94a3b8');
    doc.text('OFFICIAL RECORD · RESTRICTED RESEARCH ACCESS', 52, 77);

    doc.y = 100;

    // Metadata card
    doc.rect(40, 100, doc.page.width - 80, 42).fill('#f8fafc');
    doc.rect(40, 100, doc.page.width - 80, 42).stroke('#e2e8f0');

    const submittedDateStr = record.submittedAt
      ? new Date(record.submittedAt).toUTCString()
      : 'Unknown';

    doc.font(boldFont).fontSize(8).fillColor('#64748b');
    doc.text('RESPONSE ID:', 50, 107);
    doc.font(regFont).fontSize(8).fillColor('#0f172a');
    doc.text(record.id, 125, 107);

    doc.font(boldFont).fontSize(8).fillColor('#64748b');
    doc.text('SUBMITTED AT:', 50, 120);
    doc.font(regFont).fontSize(8).fillColor('#0f172a');
    doc.text(submittedDateStr, 125, 120);

    doc.font(boldFont).fontSize(8).fillColor('#64748b');
    doc.text('RECORD TYPE:', 360, 107);
    doc.font(boldFont).fontSize(8).fillColor(record.isDemo ? '#f59e0b' : '#059669');
    doc.text(record.isDemo ? 'VERIFICATION SAMPLE' : 'LIVE MERCHANT SUBMISSION', 430, 107);

    doc.font(boldFont).fontSize(8).fillColor('#64748b');
    doc.text('COMPLETION TIME:', 360, 120);
    doc.font(regFont).fontSize(8).fillColor('#0f172a');
    doc.text(
      record.completionTimeSeconds
        ? `${Math.round(record.completionTimeSeconds / 60)} min (${record.completionTimeSeconds}s)`
        : 'Not recorded',
      450,
      120
    );

    doc.y = 150;

    // ==========================================
    // 2. SURVEY SECTIONS (1 TO 10)
    // ==========================================
    const bp = record.businessProfile;
    const ops = record.operationalAnswers;
    const val = record.validationAndFeedback;

    // Section 1: Business Information
    drawSectionHeader('Business Information & Demographics', 1);
    drawFieldRow('Business Name', bp?.businessName);
    drawFieldRow(
      'Business Category',
      bp?.businessType === 'Other' && bp?.businessTypeOther
        ? `Other (${bp.businessTypeOther})`
        : bp?.businessType
    );
    drawFieldRow('Operating Location (Dadu)', bp?.businessArea, true);
    drawFieldRow('Years in Business', bp?.yearsInBusiness);
    drawFieldRow('Approx. Daily Customers', bp?.approxDailyCustomers);
    drawFieldRow('Approx. Daily Sales Volume', bp?.approxDailySales);
    drawFieldRow('Contact WhatsApp', bp?.contactWhatsapp);

    // Section 2: Sales Recording
    drawSectionHeader('Sales Recording & Daily Cash Management', 2);
    drawFieldRow('Recording Method', ops?.salesRecordingMethod);
    drawArrayRow('Sales Management Problems', ops?.salesProblems);

    // Section 3: Stock / Inventory
    drawSectionHeader('Inventory & Stock Management', 3);
    drawFieldRow('Inventory Method', ops?.inventoryManagementMethod);
    drawArrayRow('Inventory / Stock Problems', ops?.inventoryProblems);

    // Section 4: Customer Credit / Udhaar
    drawSectionHeader('Customer Credit & Udhaar Management', 4);
    drawFieldRow('Provides Credit (Udhaar)', ops?.providesCredit, ops?.providesCredit === 'Yes');
    drawFieldRow(
      'Credit Management Method',
      ops?.providesCredit === 'No' ? 'Not applicable (Cash only)' : ops?.creditManagementMethod
    );
    drawArrayRow('Credit / Udhaar Problems', ops?.creditProblems);

    // Section 5: Expenses & Profit
    drawSectionHeader('Expense Tracking & Net Profit Calculation', 5);
    drawFieldRow('Expense Tracking Method', ops?.expenseTrackingMethod);
    drawArrayRow('Expense / Profit Problems', ops?.expenseProblems);

    // Section 6: Technology Adoption
    drawSectionHeader('Current Technology & Digital Comfort', 6);
    drawArrayRow('Digital Tools in Daily Use', ops?.currentTechnology);
    drawFieldRow('Software Comfort Level', ops?.techComfortLevel);

    // Section 7: Preferred Digital Solution
    drawSectionHeader('Preferred Digital Solution Platform & Language', 7);
    drawFieldRow('Preferred Platform', ops?.preferredSolutionPlatform);
    drawFieldRow('Preferred Interface Language', ops?.preferredLanguage, true);

    // Section 8: Priority Bottlenecks & Free Text
    drawSectionHeader('Critical Operational Bottlenecks', 8);
    drawArrayRow('Biggest Problem Areas Selected', val?.biggestProblemAreas);
    drawNarrativeBox('Single Biggest Operational Bottleneck (Merchant Statement):', val?.singleBiggestProblem);

    // Section 9: Software & Payment Validation
    drawSectionHeader('Software Validation & Pricing Acceptability', 9);
    drawFieldRow('Would Use Digital Software', val?.wouldUseSoftware, val?.wouldUseSoftware === 'Yes');
    drawFieldRow('Willingness to Pay for Solution', val?.willingToPay, val?.willingToPay === 'Yes');
    drawFieldRow('Preferred Pricing Model', val?.preferredPricingModel);
    drawFieldRow('Acceptable Price Range', val?.priceRange);

    // Section 10: Final Field Research Question
    drawSectionHeader('One Operational Change Wishlist', 10);
    drawNarrativeBox(
      'The One Thing You Would Change About Running Your Business (Merchant Wishlist):',
      val?.oneThingToChange
    );

    // ==========================================
    // 3. PAGINATION & FOOTERS (All Pages)
    // ==========================================
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.font(regFont).fontSize(7.5).fillColor('#94a3b8');

      // Bottom divider line
      doc.moveTo(40, doc.page.height - 30).lineTo(doc.page.width - 40, doc.page.height - 30).stroke('#e2e8f0');

      doc.text(
        'Dadu Business Insights · Confidential Academic & Field Research · Dadu, Sindh',
        40,
        doc.page.height - 24
      );

      doc.text(
        `Page ${i + 1} of ${totalPages}`,
        doc.page.width - 100,
        doc.page.height - 24,
        { align: 'right', width: 60 }
      );
    }

    doc.end();
  });
}
