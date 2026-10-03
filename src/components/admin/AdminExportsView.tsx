import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileCheck,
  Lock,
  Layers,
  Info,
} from 'lucide-react';
import { DADU_AREAS, BUSINESS_TYPES } from '../../types/survey.ts';

export function AdminExportsView() {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [businessType, setBusinessType] = useState('All');
  const [area, setArea] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [willingToPay, setWillingToPay] = useState('All');

  // Privacy Toggle
  const [includeContact, setIncludeContact] = useState(false);
  const [contactConfirmed, setContactConfirmed] = useState(false);

  // Export generation progress states
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  const fetchSampleCount = useCallback(async () => {
    setIsLoadingCount(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange !== 'all') params.set('dateRange', dateRange);
      if (businessType !== 'All') params.set('businessType', businessType);
      if (area !== 'All') params.set('area', area);
      if (platform !== 'All') params.set('platform', platform);
      if (willingToPay !== 'All') params.set('willingToPay', willingToPay);

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to query sample count (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.analytics) {
        setTotalCount(json.analytics.sampleSize);
      }
    } catch (err: any) {
      console.error('Failed to query sample count:', err);
      setError(err.message || 'Unable to query sample size.');
    } finally {
      setIsLoadingCount(false);
    }
  }, [dateRange, businessType, area, platform, willingToPay]);

  useEffect(() => {
    fetchSampleCount();
  }, [fetchSampleCount]);

  const handleClearFilters = () => {
    setDateRange('all');
    setBusinessType('All');
    setArea('All');
    setPlatform('All');
    setWillingToPay('All');
  };

  const hasActiveFilters = Boolean(
    dateRange !== 'all' ||
    businessType !== 'All' ||
    area !== 'All' ||
    platform !== 'All' ||
    willingToPay !== 'All'
  );

  const buildFilterQueryParams = () => {
    const params = new URLSearchParams();
    if (dateRange !== 'all') params.set('dateRange', dateRange);
    if (businessType !== 'All') params.set('businessType', businessType);
    if (area !== 'All') params.set('area', area);
    if (platform !== 'All') params.set('platform', platform);
    if (willingToPay !== 'All') params.set('willingToPay', willingToPay);
    return params;
  };

  // 1. Download Responses CSV
  const handleExportResponsesCsv = async () => {
    if (!hasActiveFilters && !window.confirm(`Export all ${totalCount ?? 0} submitted research responses?`)) return;

    if (includeContact && !contactConfirmed) {
      alert('Please check the confirmation box to acknowledge that optional contact information will be included.');
      return;
    }

    setExportingType('responses-csv');
    setExportStatusText('Preparing dataset...');

    try {
      setExportStatusText('Querying database records...');
      const params = buildFilterQueryParams();
      if (includeContact) {
        params.set('includeContact', 'true');
      }

      const res = await fetch(`/api/admin/exports/responses.csv?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      setExportStatusText('Packaging CSV file...');
      const blob = await res.blob();
      const filename =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `Dadu-Business-Insights-Responses-${new Date().toISOString().slice(0, 10)}.csv`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportStatusText('Download complete');
      setTimeout(() => {
        setExportingType(null);
        setExportStatusText('');
      }, 2000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      alert('Unable to generate the export. Please try again.');
      setExportingType(null);
      setExportStatusText('');
    }
  };

  // 2. Download Research Report PDF
  const handleExportResearchPdf = async () => {
    setExportingType('research-pdf');
    setExportStatusText('Preparing research report...');

    try {
      setExportStatusText('Aggregating survey distributions...');
      const params = buildFilterQueryParams();

      const res = await fetch(`/api/admin/exports/research-report.pdf?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      setExportStatusText('Generating 12-section PDF document...');
      const blob = await res.blob();
      const filename =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `Dadu-Business-Insights-Research-Report-${new Date().toISOString().slice(0, 10)}.pdf`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportStatusText('Download complete');
      setTimeout(() => {
        setExportingType(null);
        setExportStatusText('');
      }, 2000);
    } catch (err: any) {
      console.error('PDF report export failed:', err);
      alert('Unable to generate the research report. Please try again.');
      setExportingType(null);
      setExportStatusText('');
    }
  };

  // 3. Download Analytics Summary CSV
  const handleExportAnalyticsCsv = async () => {
    setExportingType('analytics-csv');
    setExportStatusText('Calculating analytical metrics...');

    try {
      const params = buildFilterQueryParams();
      const res = await fetch(`/api/admin/exports/analytics.csv?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      setExportStatusText('Generating summary CSV...');
      const blob = await res.blob();
      const filename =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `Dadu-Business-Insights-Analytics-Summary-${new Date().toISOString().slice(0, 10)}.csv`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportStatusText('Download complete');
      setTimeout(() => {
        setExportingType(null);
        setExportStatusText('');
      }, 2000);
    } catch (err: any) {
      console.error('Analytics CSV export failed:', err);
      alert('Unable to generate the analytics export. Please try again.');
      setExportingType(null);
      setExportStatusText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Research Export Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Export collected business research and generate evidence-based reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Restricted Admin Access</span>
        </div>
      </div>

      {/* Dataset Context Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-tight">
              {isLoadingCount
                ? 'Calculating selected sample size...'
                : totalCount === 0
                ? 'No research responses available for export.'
                : `${totalCount} verified research responses selected for export.`}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {hasActiveFilters ? 'Segmented Sample' : 'Complete Primary Dataset'}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5 border-t border-slate-800/60">
          <Info className="w-3 h-3 inline mr-1 text-slate-500" />
          All exports are queried directly from live PostgreSQL database records. Zero synthetic data is used.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scope & Filter Exports</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear filters (export all)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Time Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Bazaar / Location</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Locations</option>
              {DADU_AREAS.map((ar) => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Preferred Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Platforms</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Website">Website</option>
              <option value="WhatsApp-based Solution">WhatsApp</option>
              <option value="Desktop Software">Desktop</option>
            </select>
          </div>

          {/* Willingness to Pay */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Willing to Pay</label>
            <select
              value={willingToPay}
              onChange={(e) => setWillingToPay(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Responses</option>
              <option value="Yes">Yes (Validated)</option>
              <option value="Maybe">Maybe</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 3 Export Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD A: Complete / Filtered Response Dataset (CSV) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Response Dataset (CSV)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Raw, row-level survey submissions across all 10 questionnaire sections. Compatible with Microsoft Excel, SPSS, and Python.
              </p>
            </div>

            {/* Privacy Shield Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Privacy Protection</span>
                <span className="text-[10px] font-mono text-emerald-400">Default: Secure</span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeContact}
                  onChange={(e) => {
                    setIncludeContact(e.target.checked);
                    if (!e.target.checked) setContactConfirmed(false);
                  }}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                />
                <span className="text-[11px] text-slate-300 leading-tight">
                  Include optional respondent contact / WhatsApp numbers
                </span>
              </label>

              {includeContact && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-fade-in">
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <span>Contact details are privacy-sensitive research data.</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactConfirmed}
                      onChange={(e) => setContactConfirmed(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-500/50"
                    />
                    <span className="text-[10px] text-slate-300 font-medium">
                      I understand this export contains optional contact information.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleExportResponsesCsv}
              disabled={Boolean(exportingType) || totalCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 disabled:opacity-40 transition-all cursor-pointer"
            >
              {exportingType === 'responses-csv' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportStatusText}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Export Responses ({totalCount ?? 0} Rows)
                  </span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500 block text-center">
              UTF-8 BOM encoded for direct Excel compatibility
            </span>
          </div>
        </div>

        {/* CARD B: Executive Research Report (PDF) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Executive Research Report (PDF)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Comprehensive 12-section research report with formal cover page, methodology notes, tables, problem rankings, and deterministic insights.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Publication Sections Included:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
                <li>Cover page with verified sample size N = {totalCount ?? 0}</li>
                <li>Demographics, sales logging & inventory methods</li>
                <li>Udhaar adoption with dedicated credit denominator</li>
                <li>Hardware penetration, software comfort & pricing</li>
                <li>Automated statistical insights & ethical limitations</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleExportResearchPdf}
              disabled={Boolean(exportingType) || totalCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/15 disabled:opacity-40 transition-all cursor-pointer"
            >
              {exportingType === 'research-pdf' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportStatusText}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Research Report (PDF)</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500 block text-center">
              A4 Format with running headers & page numbers
            </span>
          </div>
        </div>

        {/* CARD C: Analytics Summary Dataset (CSV) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Analytics Summary (CSV)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Structured frequency tables containing category, dimension, exact count, percentage, and verified sample denominator for auditing.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Auditing Schema:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
                <li>Metric Category</li>
                <li>Dimension / Variable</li>
                <li>Count (Frequency)</li>
                <li>Percentage (%)</li>
                <li>Denominator Context</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleExportAnalyticsCsv}
              disabled={Boolean(exportingType) || totalCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/15 disabled:opacity-40 transition-all cursor-pointer"
            >
              {exportingType === 'analytics-csv' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportStatusText}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Analytics Summary (CSV)</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500 block text-center">
              Pre-aggregated statistical distribution table
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
