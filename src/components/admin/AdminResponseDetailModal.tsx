import React, { useState } from 'react';
import {
  X,
  Download,
  Calendar,
  Clock,
  Building2,
  Receipt,
  Boxes,
  CreditCard,
  TrendingDown,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import type { FullSurveyResponseRecord } from '../../server/pdf-generator.ts';

interface AdminResponseDetailModalProps {
  responseId: string;
  onClose: () => void;
}

export function AdminResponseDetailModal({ responseId, onClose }: AdminResponseDetailModalProps) {
  const [record, setRecord] = React.useState<FullSurveyResponseRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  React.useEffect(() => {
    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/responses/${responseId}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Survey response not found' : 'Failed to retrieve response');
        }
        const data = await res.json();
        if (data.success && data.response) {
          setRecord(data.response);
        } else {
          throw new Error(data.error || 'Failed to parse response record');
        }
      } catch (err: any) {
        setError(err.message || 'Error connecting to database');
      } finally {
        setIsLoading(false);
      }
    }

    if (responseId) {
      loadDetail();
    }
  }, [responseId]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch(`/api/admin/responses/${responseId}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed on server');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dadu-Business-Insights-Response-${responseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not download PDF. Please check server logs.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const renderField = (label: string, value: string | null | undefined, highlight = false) => (
    <div className="space-y-0.5">
      <span className="text-[11px] font-medium text-slate-400 block">{label}</span>
      <span className={`text-xs font-semibold block ${highlight ? 'text-emerald-400' : 'text-slate-100'}`}>
        {value && value.trim() ? value : <span className="text-slate-500 font-normal italic">Not provided</span>}
      </span>
    </div>
  );

  const renderPillList = (label: string, items: string[] | undefined) => (
    <div className="space-y-1.5">
      <span className="text-[11px] font-medium text-slate-400 block">{label}</span>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/80"
            >
              {it}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-xs text-slate-500 italic">None reported</span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex justify-center p-3 sm:p-6 font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Full Response Inspection
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {responseId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || isLoading || !!error}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400">Loading complete survey response...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          ) : record ? (
            <>
              {/* Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(record.submittedAt).toLocaleDateString()} {new Date(record.submittedAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{record.completionTimeSeconds ? `${record.completionTimeSeconds}s completion` : 'Time not logged'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500">TYPE:</span>
                  <span className={record.isDemo ? 'text-amber-400' : 'text-emerald-400'}>
                    {record.isDemo ? 'Verification Sample' : 'Live Submission'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500">ANON HASH:</span>
                  <span className="font-mono text-[10px] truncate max-w-[120px] text-slate-400">
                    {record.ipHash || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Section 1: Business Information */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                  <Building2 className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    1. Business Information & Demographics
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderField('Business Name', record.businessProfile?.businessName)}
                  {renderField(
                    'Category',
                    record.businessProfile?.businessType === 'Other' && record.businessProfile?.businessTypeOther
                      ? `Other: ${record.businessProfile.businessTypeOther}`
                      : record.businessProfile?.businessType
                  )}
                  {renderField('Location in Dadu', record.businessProfile?.businessArea, true)}
                  {renderField('Years in Business', record.businessProfile?.yearsInBusiness)}
                  {renderField('Daily Customers', record.businessProfile?.approxDailyCustomers)}
                  {renderField('Daily Sales', record.businessProfile?.approxDailySales)}
                  {renderField('WhatsApp Contact', record.businessProfile?.contactWhatsapp)}
                </div>
              </div>

              {/* Section 2 & 3: Sales & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <Receipt className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      2. Sales Management
                    </h4>
                  </div>
                  {renderField('Sales Recording Method', record.operationalAnswers?.salesRecordingMethod)}
                  {renderPillList('Sales Bottlenecks', record.operationalAnswers?.salesProblems)}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <Boxes className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      3. Stock / Inventory
                    </h4>
                  </div>
                  {renderField('Inventory Method', record.operationalAnswers?.inventoryManagementMethod)}
                  {renderPillList('Stock Problems', record.operationalAnswers?.inventoryProblems)}
                </div>
              </div>

              {/* Section 4 & 5: Credit & Expenses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      4. Customer Credit / Udhaar
                    </h4>
                  </div>
                  {renderField('Provides Credit', record.operationalAnswers?.providesCredit, record.operationalAnswers?.providesCredit === 'Yes')}
                  {renderField('Credit Recording Method', record.operationalAnswers?.creditManagementMethod)}
                  {renderPillList('Credit Bottlenecks', record.operationalAnswers?.creditProblems)}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <TrendingDown className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      5. Expenses & Profit
                    </h4>
                  </div>
                  {renderField('Expense Tracking Method', record.operationalAnswers?.expenseTrackingMethod)}
                  {renderPillList('Expense / Profit Problems', record.operationalAnswers?.expenseProblems)}
                </div>
              </div>

              {/* Section 6 & 7: Technology & Solution Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      6. Technology Adoption
                    </h4>
                  </div>
                  {renderField('Comfort Level', record.operationalAnswers?.techComfortLevel)}
                  {renderPillList('Digital Devices in Use', record.operationalAnswers?.currentTechnology)}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                    <Globe className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      7. Preferred Solution
                    </h4>
                  </div>
                  {renderField('Preferred Platform', record.operationalAnswers?.preferredSolutionPlatform, true)}
                  {renderField('Preferred Language', record.operationalAnswers?.preferredLanguage, true)}
                </div>
              </div>

              {/* Section 8: Priority Bottlenecks & Narrative */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    8. Biggest Operational Problems
                  </h4>
                </div>
                {renderPillList('Top Selected Problem Categories', record.validationAndFeedback?.biggestProblemAreas)}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-medium text-slate-400 block">Single Biggest Problem (Direct Merchant Quote):</span>
                  <div className="p-3 rounded-lg bg-slate-900 border-l-2 border-amber-500 text-xs text-slate-200 leading-relaxed italic">
                    "{record.validationAndFeedback?.singleBiggestProblem || 'Not provided'}"
                  </div>
                </div>
              </div>

              {/* Section 9: Software & Payment Validation */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    9. Software & Payment Validation
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {renderField('Would Use Software', record.validationAndFeedback?.wouldUseSoftware, record.validationAndFeedback?.wouldUseSoftware === 'Yes')}
                  {renderField('Willing to Pay', record.validationAndFeedback?.willingToPay, record.validationAndFeedback?.willingToPay === 'Yes')}
                  {renderField('Pricing Model', record.validationAndFeedback?.preferredPricingModel)}
                  {renderField('Price Range', record.validationAndFeedback?.priceRange)}
                </div>
              </div>

              {/* Section 10: Final Wishlist */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/70 text-purple-400">
                  <HelpCircle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    10. One Change In Daily Operations
                  </h4>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border-l-2 border-purple-500 text-xs text-slate-200 leading-relaxed italic">
                  "{record.validationAndFeedback?.oneThingToChange || 'Not provided'}"
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
