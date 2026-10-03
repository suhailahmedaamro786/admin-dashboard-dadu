import PDFDocument from 'pdfkit';
import fs from 'fs';
import type { AnalyticsFilterParams, ResearchAnalyticsPayload } from './analytics-service.ts';
import { computeResearchAnalytics } from './analytics-service.ts';

const UNICODE_FONT_PATH = '/usr/share/fonts/truetype/freefont/FreeSerif.ttf';
const UNICODE_BOLD_FONT_PATH = '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf';

export async function generateResearchReportPdf(
  filters: AnalyticsFilterParams
): Promise<Buffer> {
  const analytics: ResearchAnalyticsPayload = await computeResearchAnalytics(filters);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      bufferPages: true,
      info: {
        Title: 'Dadu Business Insights — Empirical Research Report',
        Author: 'Dadu Business Insights Research Team',
        Subject: 'SME Digitization & Financial Management Field Study',
        Keywords: 'Dadu, Sindh, SME, Field Research, Credit, Udhaar, Technology',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const hasUnicodeFont = fs.existsSync(UNICODE_FONT_PATH);
    const hasUnicodeBoldFont = fs.existsSync(UNICODE_BOLD_FONT_PATH);

    if (hasUnicodeFont) {
      doc.registerFont('UnicodeRegular', UNICODE_FONT_PATH);
    }
    if (hasUnicodeBoldFont) {
      doc.registerFont('UnicodeBold', UNICODE_BOLD_FONT_PATH);
    }

    const regularFont = hasUnicodeFont ? 'UnicodeRegular' : 'Helvetica';
    const boldFont = hasUnicodeBoldFont ? 'UnicodeBold' : 'Helvetica-Bold';

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;

    // Helper: Draw section header
    const addSectionHeader = (title: string, sub?: string) => {
      if (doc.y > 680) {
        doc.addPage();
      } else {
        doc.moveDown(1.2);
      }

      doc
        .font(boldFont)
        .fontSize(13)
        .fillColor('#065f46') // Emerald 800
        .text(title.toUpperCase(), { characterSpacing: 0.5 });

      if (sub) {
        doc
          .font(regularFont)
          .fontSize(8.5)
          .fillColor('#64748b')
          .text(sub);
      }

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(margin, doc.y + 4)
        .lineTo(pageWidth - margin, doc.y + 4)
        .stroke();

      doc.moveDown(0.7);
    };

    // Helper: Draw two-column table/list
    const addStatTable = (rows: Array<{ label: string; count: number; pct: number }>, maxRows = 10) => {
      const displayRows = rows.slice(0, maxRows);
      const col1Width = contentWidth * 0.65;
      const col2Width = contentWidth * 0.15;
      const col3Width = contentWidth * 0.20;

      // Table Header
      const headerY = doc.y;
      doc
        .rect(margin, headerY, contentWidth, 16)
        .fill('#f1f5f9');

      doc
        .font(boldFont)
        .fontSize(8)
        .fillColor('#334155')
        .text('Category / Variable', margin + 6, headerY + 4, { width: col1Width })
        .text('Count', margin + col1Width, headerY + 4, { width: col2Width, align: 'right' })
        .text('Share (%)', margin + col1Width + col2Width, headerY + 4, { width: col3Width, align: 'right' });

      doc.y = headerY + 20;

      if (displayRows.length === 0) {
        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#94a3b8')
          .text('No entries recorded in this category for the active sample.', margin + 6);
        doc.moveDown(0.5);
        return;
      }

      displayRows.forEach((r, idx) => {
        if (doc.y > 740) {
          doc.addPage();
        }
        const rowY = doc.y;
        if (idx % 2 === 1) {
          doc.rect(margin, rowY - 2, contentWidth, 14).fill('#f8fafc');
        }

        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#1e293b')
          .text(r.label, margin + 6, rowY, { width: col1Width - 10, lineBreak: false })
          .font(boldFont)
          .text(String(r.count), margin + col1Width, rowY, { width: col2Width, align: 'right' })
          .font(regularFont)
          .fillColor('#059669')
          .text(`${r.pct}%`, margin + col1Width + col2Width, rowY, { width: col3Width, align: 'right' });

        doc.y = rowY + 14;
      });

      doc.moveDown(0.5);
    };

    // ==========================================
    // 1. COVER PAGE
    // ==========================================
    doc.rect(margin, margin, contentWidth, pageHeight - margin * 2).strokeColor('#059669').lineWidth(1.5).stroke();

    doc.moveDown(4);

    // Badge
    doc
      .font(boldFont)
      .fontSize(9)
      .fillColor('#059669')
      .text('OFFICIAL FIELD RESEARCH REPORT', { align: 'center', characterSpacing: 1.5 });

    doc.moveDown(1);

    // Title
    doc
      .font(boldFont)
      .fontSize(24)
      .fillColor('#0f172a')
      .text('Dadu Business Insights', { align: 'center' });

    doc
      .font(boldFont)
      .fontSize(14)
      .fillColor('#334155')
      .text('Empirical SME Digitization & Operational Research', { align: 'center' });

    doc.moveDown(0.5);

    // Subtitle
    doc
      .font(regularFont)
      .fontSize(10)
      .fillColor('#64748b')
      .text('"Understanding Local Businesses. Building Better Solutions."', { align: 'center' });

    doc.moveDown(3);

    // Meta Box
    const boxX = margin + 40;
    const boxWidth = contentWidth - 80;
    const boxY = doc.y;

    doc.rect(boxX, boxY, boxWidth, 90).fill('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    doc
      .font(boldFont)
      .fontSize(9)
      .fillColor('#0f172a')
      .text('REPORT METRIC CONTEXT', boxX + 15, boxY + 12);

    doc
      .font(regularFont)
      .fontSize(8.5)
      .fillColor('#334155')
      .text(`Generated Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, boxX + 15, boxY + 30)
      .text(`Validated Research Sample Size: N = ${analytics.sampleSize} submitted responses`, boxX + 15, boxY + 45)
      .text(`Geographic Scope: Dadu District & Central Bazaars, Sindh, Pakistan`, boxX + 15, boxY + 60)
      .text(`Dataset Isolation: Live PostgreSQL Database records (Zero synthetic entries)`, boxX + 15, boxY + 75);

    doc.moveDown(6);

    // Institutional Notice
    doc
      .font(regularFont)
      .fontSize(8)
      .fillColor('#94a3b8')
      .text('Strict Research Confidentiality Maintained · PII Excluded From Aggregations', { align: 'center' });

    // ==========================================
    // 2. SECTION 1 — RESEARCH OVERVIEW
    // ==========================================
    doc.addPage();

    addSectionHeader('Section 1 — Research Overview & Sample Integrity', 'Empirical scope and baseline research sample characteristics');

    doc
      .font(regularFont)
      .fontSize(9)
      .fillColor('#1e293b')
      .text(
        `This report presents quantitative and qualitative findings derived from ${analytics.sampleSize} verified business survey submissions in Dadu, Sindh. The study investigated sales logging, inventory management, customer credit (udhaar), daily operating expenses, technology adoption, and willingness to adopt digital business tools.`
      );

    doc.moveDown(0.5);

    // Method note
    doc
      .rect(margin, doc.y, contentWidth, 38)
      .fill('#f1f5f9');
    doc
      .font(boldFont)
      .fontSize(7.5)
      .fillColor('#0f172a')
      .text('METHODOLOGICAL NOTE & SAMPLING BOUNDARIES:', margin + 10, doc.y - 30);
    doc
      .font(regularFont)
      .fontSize(7.5)
      .fillColor('#475569')
      .text(
        'This report summarizes responses collected through the Dadu Business Insights survey. Results describe the current survey sample and should not automatically be interpreted as representative of all businesses in Dadu.',
        margin + 10,
        doc.y + 2,
        { width: contentWidth - 20 }
      );

    doc.moveDown(1.5);

    // ==========================================
    // 3. SECTION 2 — BUSINESS PROFILE
    // ==========================================
    addSectionHeader('Section 2 — Business Demographics & Bazaar Distribution', 'Trade sector composition and geographic spread in Dadu');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Business Trade Categories (Distribution across N = ' + analytics.sampleSize + ')');
    doc.moveDown(0.3);

    addStatTable(
      analytics.businessTypeDistribution.map((b) => ({
        label: b.name,
        count: b.count,
        pct: b.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Bazaar / Commercial Zone Location');
    doc.moveDown(0.3);

    addStatTable(
      analytics.areaDistribution.map((a) => ({
        label: a.name,
        count: a.count,
        pct: a.percentage,
      }))
    );

    // ==========================================
    // 4. SECTION 3 — SALES MANAGEMENT
    // ==========================================
    addSectionHeader('Section 3 — Sales Management & Daily Transaction Logging', 'How daily sales are documented and specific bookkeeping bottlenecks experienced');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Primary Sales Recording Mechanism');
    doc.moveDown(0.3);

    addStatTable(
      analytics.salesManagement.methods.map((m) => ({
        label: m.name,
        count: m.count,
        pct: m.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Sales-Related Calculation & Visibility Problems (Multi-select)');
    doc.moveDown(0.3);

    addStatTable(
      analytics.salesManagement.problems.map((p) => ({
        label: p.name,
        count: p.count,
        pct: p.percentage,
      }))
    );

    // ==========================================
    // 5. SECTION 4 — INVENTORY & STOCK
    // ==========================================
    addSectionHeader('Section 4 — Stock & Inventory Management', 'Inventory tracking practices and stockout challenges');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Stock Management Method');
    doc.moveDown(0.3);

    addStatTable(
      analytics.inventoryManagement.methods.map((m) => ({
        label: m.name,
        count: m.count,
        pct: m.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Reported Inventory & Supplier Tracking Issues');
    doc.moveDown(0.3);

    addStatTable(
      analytics.inventoryManagement.problems.map((p) => ({
        label: p.name,
        count: p.count,
        pct: p.percentage,
      }))
    );

    // ==========================================
    // 6. SECTION 5 — UDHAAR / CUSTOMER CREDIT
    // ==========================================
    addSectionHeader('Section 5 — Customer Credit (Udhaar) Analysis', 'Customer credit prevalence, ledger tools, and outstanding debt recovery');

    const creditDenom = analytics.creditUdhaar.creditBusinessesDenominator;
    doc
      .font(regularFont)
      .fontSize(8.5)
      .fillColor('#1e293b')
      .text(
        `Customer credit is customary in Dadu. In this survey sample, ${analytics.creditUdhaar.offersCredit.yesCount} businesses (${analytics.creditUdhaar.offersCredit.yesPercentage}%) routinely provide credit, ${analytics.creditUdhaar.offersCredit.sometimesCount} (${analytics.creditUdhaar.offersCredit.sometimesPercentage}%) provide credit occasionally, and ${analytics.creditUdhaar.offersCredit.noCount} (${analytics.creditUdhaar.offersCredit.noPercentage}%) operate exclusively on immediate cash.`
      );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text(`Credit Management Tools (Strictly among credit-offering merchants, N = ${creditDenom})`);
    doc.moveDown(0.3);

    addStatTable(
      analytics.creditUdhaar.methods.map((m) => ({
        label: m.name,
        count: m.count,
        pct: m.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text(`Credit Recovery & Collection Difficulties (N = ${creditDenom})`);
    doc.moveDown(0.3);

    addStatTable(
      analytics.creditUdhaar.problems.map((p) => ({
        label: p.name,
        count: p.count,
        pct: p.percentage,
      }))
    );

    // ==========================================
    // 7. SECTION 6 — EXPENSES & PROFIT
    // ==========================================
    addSectionHeader('Section 6 — Operating Expenses & Net Profit Calculation', 'Shop rent, utility bills, generator fuel, and profit calculation visibility');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Expense Logging Practices');
    doc.moveDown(0.3);

    addStatTable(
      analytics.expenseProfit.methods.map((e) => ({
        label: e.name,
        count: e.count,
        pct: e.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Difficulties in Calculating True Net Profit & Shop Costs');
    doc.moveDown(0.3);

    addStatTable(
      analytics.expenseProfit.problems.map((e) => ({
        label: e.name,
        count: e.count,
        pct: e.percentage,
      }))
    );

    // ==========================================
    // 8. SECTION 7 — TECHNOLOGY READINESS
    // ==========================================
    addSectionHeader('Section 7 — Technology Readiness & Device Penetration', 'Digital hardware usage and confidence in operating business software');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Digital Hardware & Software in Daily Use');
    doc.moveDown(0.3);

    addStatTable(
      analytics.technology.deviceUsage.map((d) => ({
        label: d.name,
        count: d.count,
        pct: d.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Comfort Level Operating Software / Mobile Apps');
    doc.moveDown(0.3);

    addStatTable(
      analytics.technology.comfortLevels.map((c) => ({
        label: c.name,
        count: c.count,
        pct: c.percentage,
      }))
    );

    // ==========================================
    // 9. SECTION 8 — PREFERRED DIGITAL SOLUTIONS
    // ==========================================
    addSectionHeader('Section 8 — Preferred Delivery Platforms & Operating Language', 'Merchant device format preferences and vernacular interface choices');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Preferred Software Form Factor');
    doc.moveDown(0.3);

    addStatTable(
      analytics.solutionPreferences.platforms.map((p) => ({
        label: p.name,
        count: p.count,
        pct: p.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Preferred Operating Language Interface');
    doc.moveDown(0.3);

    addStatTable(
      analytics.solutionPreferences.languages.map((l) => ({
        label: l.name,
        count: l.count,
        pct: l.percentage,
      }))
    );

    // ==========================================
    // 10. SECTION 9 — BIGGEST BUSINESS PROBLEMS
    // ==========================================
    addSectionHeader('Section 9 — Ranked Operational Headaches & Qualitative Voices', 'Frequency ranking of all 13 core friction areas and unfiltered merchant statements');

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Complete Operational Problem Ranking (Ranked by Citation Count)');
    doc.moveDown(0.3);

    addStatTable(
      analytics.biggestProblemsRanking.map((r) => ({
        label: `#${r.rank} ${r.name}`,
        count: r.count,
        pct: r.percentage,
      })),
      13
    );

    // Qualitative quotes sample
    if (analytics.voiceQuotes.length > 0) {
      doc.moveDown(0.8);
      doc
        .font(boldFont)
        .fontSize(8.5)
        .fillColor('#0f172a')
        .text('Curated Merchant Voice Excerpts (Direct Statements)');
      doc.moveDown(0.3);

      analytics.voiceQuotes.slice(0, 3).forEach((q) => {
        if (doc.y > 720) doc.addPage();
        doc
          .font(boldFont)
          .fontSize(7.5)
          .fillColor('#065f46')
          .text(`${q.businessType} — ${q.area}:`);
        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#334155')
          .text(`"${q.singleBiggestProblem}"`, { indent: 10 });
        doc.moveDown(0.4);
      });
    }

    // ==========================================
    // 11. SECTION 10 — SOLUTION VALIDATION & PRICING
    // ==========================================
    addSectionHeader('Section 10 — Solution Validation & Pricing Feasibility', 'Survey-reported willingness to adopt and invest in commercial software');

    doc
      .font(regularFont)
      .fontSize(8)
      .fillColor('#64748b')
      .text('Notice: Figures in this section represent survey-reported willingness and should not be construed as contractual or guaranteed purchase commitments.');
    doc.moveDown(0.4);

    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Would Use a Software Solution Addressing Core Problem');
    doc.moveDown(0.3);

    addStatTable(
      analytics.validationPricing.wouldUseSoftware.map((w) => ({
        label: w.name,
        count: w.count,
        pct: w.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Stated Willingness to Pay a Modest Fee');
    doc.moveDown(0.3);

    addStatTable(
      analytics.validationPricing.willingnessToPay.map((w) => ({
        label: w.name,
        count: w.count,
        pct: w.percentage,
      }))
    );

    doc.moveDown(0.5);
    doc
      .font(boldFont)
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text('Acceptable Monthly Price Range');
    doc.moveDown(0.3);

    addStatTable(
      analytics.validationPricing.priceRanges.map((p) => ({
        label: p.name,
        count: p.count,
        pct: p.percentage,
      }))
    );

    // ==========================================
    // 12. SECTION 11 — AUTOMATED RESEARCH INSIGHTS
    // ==========================================
    addSectionHeader('Section 11 — Automated Statistical Insights', 'Deterministic observations calculated directly from validated response data');

    if (analytics.automatedInsights.length === 0) {
      doc
        .font(regularFont)
        .fontSize(8.5)
        .fillColor('#64748b')
        .text('No statistical conclusions calculated due to an empty response dataset.');
    } else {
      analytics.automatedInsights.forEach((insight) => {
        if (doc.y > 740) doc.addPage();
        doc
          .font(regularFont)
          .fontSize(8.5)
          .fillColor('#1e293b')
          .text(`•  ${insight}`, { indent: 8 });
        doc.moveDown(0.3);
      });
    }

    // ==========================================
    // 13. SECTION 12 — METHODOLOGY & LIMITATIONS
    // ==========================================
    addSectionHeader('Section 12 — Methodology, Ethical Boundaries & Limitations', 'Scope constraints, optional fields, and sample context');

    doc
      .font(regularFont)
      .fontSize(8)
      .fillColor('#334155')
      .text(
        `1. Sample Size: All distributions are calculated from a total of N = ${analytics.sampleSize} surveyed business owners in Dadu.\n` +
        '2. Sampling Technique: Field convenience sampling conducted across primary commercial corridors.\n' +
        '3. Voluntary Information: Business identifiers (shop name and WhatsApp contact) were strictly optional to protect respondent privacy.\n' +
        '4. Cross-Sectional Constraint: Findings represent a cross-sectional snapshot of business sentiment and manual workflow practices in Dadu, Sindh.\n' +
        '5. Data Integrity: All statistics were calculated through deterministic database aggregation without synthetic data imputation or predictive modeling.'
      );

    // ==========================================
    // Page Numbering and Running Headers/Footers
    // ==========================================
    const totalPages = doc.bufferedPageRange().count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      // Skip running header on cover page
      if (i > 0) {
        doc
          .font(regularFont)
          .fontSize(7.5)
          .fillColor('#94a3b8')
          .text('Dadu Business Insights — Field Research Report', margin, 25, { width: contentWidth, align: 'left' })
          .text(`Sample N = ${analytics.sampleSize}`, margin, 25, { width: contentWidth, align: 'right' });

        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(margin, 35)
          .lineTo(pageWidth - margin, 35)
          .stroke();
      }

      // Running footer on all pages except cover
      if (i > 0) {
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(margin, pageHeight - 35)
          .lineTo(pageWidth - margin, pageHeight - 35)
          .stroke();

        doc
          .font(regularFont)
          .fontSize(7.5)
          .fillColor('#94a3b8')
          .text('Confidential Academic & Commercial Research · Dadu, Sindh', margin, pageHeight - 28, {
            width: contentWidth,
            align: 'left',
          })
          .text(`Page ${i + 1} of ${totalPages}`, margin, pageHeight - 28, {
            width: contentWidth,
            align: 'right',
          });
      }
    }

    doc.end();
  });
}
