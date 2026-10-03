import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  Download,
  Eye,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AdminResponseDetailModal } from './AdminResponseDetailModal.tsx';
import { DADU_AREAS, BUSINESS_TYPES } from '../../types/survey.ts';

interface ResponseSummary {
  id: string;
  submittedAt: string;
  isDemo: boolean;
  businessName: string | null;
  businessType: string;
  businessTypeOther: string | null;
  businessArea: string;
  approxDailyCustomers: string;
  approxDailySales: string;
  yearsInBusiness: string;
  contactWhatsapp: string | null;
  salesRecordingMethod: string;
  preferredSolutionPlatform: string;
  preferredLanguage: string;
  providesCredit: string;
  currentTechnology: string[];
  singleBiggestProblem: string;
  wouldUseSoftware: string;
  willingToPay: string;
  priceRange: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function AdminResponsesList() {
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [businessType, setBusinessType] = useState('All');
  const [area, setArea] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [willingToPay, setWillingToPay] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Selected response for inspection modal
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  // PDF downloading IDs
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (businessType !== 'All') params.set('businessType', businessType);
      if (area !== 'All') params.set('area', area);
      if (platform !== 'All') params.set('platform', platform);
      if (willingToPay !== 'All') params.set('willingToPay', willingToPay);
      params.set('sortBy', sortBy);
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));

      const res = await fetch(`/api/admin/responses?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to query responses (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setResponses(data.responses || []);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to retrieve responses');
      }
    } catch (err: any) {
      console.error('Error querying responses:', err);
      setError(err.message || 'Error connecting to database');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, businessType, area, platform, willingToPay, sortBy, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchQuery(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setBusinessType('All');
    setArea('All');
    setPlatform('All');
    setWillingToPay('All');
    setSortBy('newest');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    businessType !== 'All' ||
    area !== 'All' ||
    platform !== 'All' ||
    willingToPay !== 'All' ||
    sortBy !== 'newest'
  );

  const handleDownloadPdf = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/admin/responses/${id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed on server');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dadu-Business-Insights-Response-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not download PDF. Please check server logs.');
    } finally {
      setDownloadingId(null);
    }
  };

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Survey Response Management
          </h2>
          <p className="text-xs text-slate-400">
            Real merchant submissions stored in PostgreSQL. Search, filter, inspect, and export verified records.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchResponses}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by business name, bazaar area, or problem keywords..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            Search Records
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Business Type */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => {
                setBusinessType(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
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
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Location / Bazaar</label>
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Dadu Locations</option>
              {DADU_AREAS.map((ar) => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
          </div>

          {/* Preferred Platform */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Preferred Platform</label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Platforms</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Web Browser / Computer">Web Browser</option>
              <option value="WhatsApp-based Bot / Chat">WhatsApp-based</option>
              <option value="No software preferred">None</option>
            </select>
          </div>

          {/* Willingness to Pay */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Willing to Pay</label>
            <select
              value={willingToPay}
              onChange={(e) => {
                setWillingToPay(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Responses</option>
              <option value="Yes">Yes (Validated)</option>
              <option value="Maybe">Maybe</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="businessName">Business Name (A–Z)</option>
              <option value="businessType">Category (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Pagination & Summary Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400">
          <div>
            <span>
              Showing <strong className="text-white">{startRecord}–{endRecord}</strong> of{' '}
              <strong className="text-white">{pagination.total}</strong> verified responses
            </span>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1 || isLoading}
                className="p-1 rounded-md border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-mono text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="p-1 rounded-md border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading verified database records...</span>
          </div>
        ) : responses.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {hasActiveFilters ? 'No responses match your search filters' : 'No survey responses yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search keywords, business category, or clearing active filters.'
                : 'As local shop owners in Dadu complete the survey, their submitted operational data and field answers will be securely listed here.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:text-white"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Business / Category</th>
                    <th className="py-3 px-4">Area in Dadu</th>
                    <th className="py-3 px-4">Volume (Daily)</th>
                    <th className="py-3 px-4">Platform & Language</th>
                    <th className="py-3 px-4">Pay Willingness</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {responses.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResponseId(r.id)}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block group-hover:text-emerald-400 transition-colors">
                          {r.businessName || <span className="text-slate-500 font-normal italic">Anonymous Merchant</span>}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {r.businessType === 'Other' && r.businessTypeOther ? `Other: ${r.businessTypeOther}` : r.businessType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {r.businessArea}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="block">{r.approxDailyCustomers} cust.</span>
                        <span className="text-[11px] text-slate-400 block">{r.approxDailySales}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="block">{r.preferredSolutionPlatform}</span>
                        <span className="text-[11px] text-emerald-400 block">{r.preferredLanguage}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.willingToPay === 'Yes'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : r.willingToPay === 'Maybe'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {r.willingToPay === 'Yes' ? `Yes (${r.priceRange})` : r.willingToPay}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResponseId(r.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Inspect complete survey"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadPdf(r.id, e)}
                            disabled={downloadingId === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                            title="Download official PDF"
                          >
                            {downloadingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden divide-y divide-slate-800/80">
              {responses.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedResponseId(r.id)}
                  className="p-4 space-y-3 hover:bg-slate-800/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-white text-sm block">
                        {r.businessName || <span className="text-slate-500 font-normal italic">Anonymous Merchant</span>}
                      </span>
                      <span className="text-xs text-emerald-400 block font-medium">
                        {r.businessType} · {r.businessArea}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        r.willingToPay === 'Yes'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Pay: {r.willingToPay}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Daily Customers</span>
                      <span>{r.approxDailyCustomers}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Daily Sales</span>
                      <span>{r.approxDailySales}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Platform</span>
                      <span>{r.preferredSolutionPlatform}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Language</span>
                      <span>{r.preferredLanguage}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResponseId(r.id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        View Full Survey
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(r.id, e)}
                        disabled={downloadingId === r.id}
                        className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-semibold"
                      >
                        {downloadingId === r.id ? 'Generating...' : 'PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Individual Response Detail Modal */}
      {selectedResponseId && (
        <AdminResponseDetailModal
          responseId={selectedResponseId}
          onClose={() => setSelectedResponseId(null)}
        />
      )}
    </div>
  );
}
