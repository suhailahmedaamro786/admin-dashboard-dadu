import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  MapPin,
  Calendar,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Receipt,
  Boxes,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Filter,
  X,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Quote,
  Shield,
  Layers,
} from 'lucide-react';
import type { ResearchAnalyticsPayload, AnalyticsFilterParams } from '../../server/analytics-service.ts';
import { DADU_AREAS, BUSINESS_TYPES } from '../../types/survey.ts';

export function AdminAnalyticsView() {
  const [data, setData] = useState<ResearchAnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [businessType, setBusinessType] = useState('All');
  const [area, setArea] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [willingToPay, setWillingToPay] = useState('All');

  // Active analytical section tab
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'operations' | 'udhaar' | 'tech' | 'pricing' | 'voices' | 'cross'>('overview');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
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
        throw new Error(`Failed to load research analytics (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      } else {
        throw new Error(json.error || 'Failed to process analytics data');
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Unable to load research data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, businessType, area, platform, willingToPay]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  // Render Horizontal Bar Row
  const renderBarRow = (
    name: string,
    count: number,
    percentage: number,
    maxCount: number,
    accentColor = 'bg-emerald-500',
    subtitle?: string
  ) => {
    const widthPct = maxCount > 0 ? Math.max(3, (count / maxCount) * 100) : 0;
    return (
      <div key={name} className="space-y-1 py-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <span className="font-medium text-slate-200 truncate">{name}</span>
            {subtitle && <span className="text-[10px] text-slate-500 font-normal">({subtitle})</span>}
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span className="text-white font-semibold">{count}</span>
            <span className="text-[10px] text-slate-500 w-10 text-right">{percentage}%</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
          <div
            className={`h-full rounded-full transition-all duration-300 ${accentColor}`}
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Research Intelligence Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Data-driven insights from local business research in Dadu, Sindh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {data?.lastUpdated && (
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Methodology & Sample Size Transparency Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                (data?.sampleSize ?? 0) >= 20
                  ? 'bg-emerald-400 animate-pulse'
                  : (data?.sampleSize ?? 0) >= 5
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-bold text-white tracking-tight">
              {data ? data.sampleNotice : 'Analyzing database records...'}
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                Filters Active
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Field Project: <strong>Dadu SME Digitization & Credit Study</strong>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5 border-t border-slate-800/60">
          <Info className="w-3 h-3 inline mr-1 text-slate-500" />
          These insights describe responses collected through the Dadu Business Insights survey. They represent the current survey sample and should not automatically be interpreted as representative of all businesses in Dadu.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Segment & Filter Analytics</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
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

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
                <div className="h-3 w-1/2 bg-slate-800 rounded" />
                <div className="h-6 w-3/4 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800" />
        </div>
      ) : !data || data.sampleSize === 0 ? (
        /* Empty State */
        <div className="py-24 px-6 rounded-3xl border border-slate-800 bg-slate-900/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">
              {hasActiveFilters ? 'No research data matching active filters' : 'No research data available yet.'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {hasActiveFilters
                ? 'Try widening your date range, resetting business types, or clicking "Clear filters".'
                : 'As local merchants in Dadu complete the survey, real statistical distributions, problem rankings, technology comfort, and willingness-to-pay rates will calculate here automatically.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white"
            >
              Clear active filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 8 Real Data KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Total Responses */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Responses
              </span>
              <div className="text-2xl font-bold text-white tracking-tight">
                {data.kpis.totalResponses}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Validated survey records
              </span>
            </div>

            {/* KPI 2: Responses Today */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Responses Today
              </span>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {data.kpis.responsesToday}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Logged during current UTC date
              </span>
            </div>

            {/* KPI 3: Responses This Week */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                This Week
              </span>
              <div className="text-2xl font-bold text-blue-400 tracking-tight">
                {data.kpis.responsesThisWeek}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Past 7 calendar days
              </span>
            </div>

            {/* KPI 4: Businesses Surveyed */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Businesses Surveyed
              </span>
              <div className="text-2xl font-bold text-purple-400 tracking-tight">
                {data.kpis.businessesSurveyed}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Distinct merchant profiles
              </span>
            </div>

            {/* KPI 5: Most Common Business Type */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Top Business Type
              </span>
              <div className="text-sm font-bold text-white truncate" title={data.kpis.mostCommonBusinessType?.name || 'N/A'}>
                {data.kpis.mostCommonBusinessType?.name || 'No data yet'}
              </div>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {data.kpis.mostCommonBusinessType ? `${data.kpis.mostCommonBusinessType.count} (${data.kpis.mostCommonBusinessType.percentage}%)` : '—'}
              </span>
            </div>

            {/* KPI 6: Most Reported Problem */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Top Pain Point
              </span>
              <div className="text-sm font-bold text-white truncate" title={data.kpis.mostReportedProblem?.name || 'N/A'}>
                {data.kpis.mostReportedProblem?.name || 'No data yet'}
              </div>
              <span className="text-[10px] text-amber-400 block font-mono">
                {data.kpis.mostReportedProblem ? `${data.kpis.mostReportedProblem.count} citations (${data.kpis.mostReportedProblem.percentage}%)` : '—'}
              </span>
            </div>

            {/* KPI 7: Most Preferred Platform */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Top Platform
              </span>
              <div className="text-sm font-bold text-white truncate" title={data.kpis.mostPreferredPlatform?.name || 'N/A'}>
                {data.kpis.mostPreferredPlatform?.name || 'No data yet'}
              </div>
              <span className="text-[10px] text-blue-400 block font-mono">
                {data.kpis.mostPreferredPlatform ? `${data.kpis.mostPreferredPlatform.count} (${data.kpis.mostPreferredPlatform.percentage}%)` : '—'}
              </span>
            </div>

            {/* KPI 8: Willingness to Pay */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Willingness to Pay
              </span>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {data.kpis.willingnessToPayRate ? `${data.kpis.willingnessToPayRate.percentage}%` : '0%'}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {data.kpis.willingnessToPayRate ? `${data.kpis.willingnessToPayRate.count} of ${data.sampleSize} validated 'Yes'` : 'No data yet'}
              </span>
            </div>
          </div>

          {/* Section Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview & Demographics
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('operations')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'operations'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales & Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('udhaar')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'udhaar'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Udhaar / Customer Credit
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('tech')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'tech'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Technology & Platform
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('pricing')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'pricing'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Software Validation & Pricing
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cross')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'cross'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross-Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('voices')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'voices'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Merchant Voices ({data.voiceQuotes.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & DEMOGRAPHICS */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Automated Insights Block */}
              {data.automatedInsights.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Automated Statistical Insights (N = {data.sampleSize})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {data.automatedInsights.map((insight, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <span className="text-slate-300 leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid: Business Types & Locations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Type Distribution */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Business Type Distribution
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      N = {data.sampleSize}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {data.businessTypeDistribution.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No categories recorded.</p>
                    ) : (
                      data.businessTypeDistribution.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.businessTypeDistribution[0].count,
                          'bg-emerald-500'
                        )
                      )
                    )}
                  </div>
                </div>

                {/* Area Distribution */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Location / Bazaar Presence
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      N = {data.sampleSize}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {data.areaDistribution.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">Location data unavailable.</p>
                    ) : (
                      data.areaDistribution.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.areaDistribution[0].count,
                          'bg-blue-500'
                        )
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Submissions Over Time */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Survey Responses Timeline
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Daily Submissions
                  </span>
                </div>

                {data.timeSeries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No timeline data available.</p>
                ) : (
                  <div className="flex items-end gap-2 h-36 pt-4 px-2 overflow-x-auto">
                    {data.timeSeries.map((d) => {
                      const maxDaily = Math.max(...data.timeSeries.map((t) => t.count), 1);
                      const heightPct = Math.max(10, Math.round((d.count / maxDaily) * 100));
                      return (
                        <div key={d.date} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 group">
                          <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.count}
                          </span>
                          <div
                            className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[8px] font-mono text-slate-500 truncate max-w-full">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONS (Sales & Inventory) */}
          {activeSubTab === 'operations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Recording Methods */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Sales Recording Method
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.salesManagement.methods.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.salesManagement.methods[0]?.count || 1,
                        'bg-emerald-500'
                      )
                    )}
                  </div>
                </div>

                {/* Sales Problems */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Reported Sales Friction
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Multi-select</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.salesManagement.problems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No sales problems reported.</p>
                    ) : (
                      data.salesManagement.problems.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.salesManagement.problems[0]?.count || 1,
                          'bg-amber-500'
                        )
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Methods */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Inventory Tracking Method
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.inventoryManagement.methods.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.inventoryManagement.methods[0]?.count || 1,
                        'bg-blue-500'
                      )
                    )}
                  </div>
                </div>

                {/* Stock Problems */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Inventory & Stock Bottlenecks
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Multi-select</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.inventoryManagement.problems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No inventory issues reported.</p>
                    ) : (
                      data.inventoryManagement.problems.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.inventoryManagement.problems[0]?.count || 1,
                          'bg-rose-500'
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UDHAAR / CUSTOMER CREDIT */}
          {activeSubTab === 'udhaar' && (
            <div className="space-y-6 animate-fade-in">
              {/* Udhaar Overview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Provides Udhaar (Yes)
                  </span>
                  <div className="text-2xl font-bold text-emerald-400">
                    {data.creditUdhaar.offersCredit.yesCount}{' '}
                    <span className="text-xs font-normal text-slate-400">({data.creditUdhaar.offersCredit.yesPercentage}%)</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Sometimes
                  </span>
                  <div className="text-2xl font-bold text-amber-400">
                    {data.creditUdhaar.offersCredit.sometimesCount}{' '}
                    <span className="text-xs font-normal text-slate-400">({data.creditUdhaar.offersCredit.sometimesPercentage}%)</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Cash Only (No Udhaar)
                  </span>
                  <div className="text-2xl font-bold text-slate-400">
                    {data.creditUdhaar.offersCredit.noCount}{' '}
                    <span className="text-xs font-normal text-slate-500">({data.creditUdhaar.offersCredit.noPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Denominator Note */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                Note: In this section, credit method and problem percentages are calculated strictly among businesses that extend credit (<strong>N = {data.creditUdhaar.creditBusinessesDenominator}</strong>).
              </div>

              {/* Udhaar Management Methods & Problems */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Credit Recording Tool
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      N = {data.creditUdhaar.creditBusinessesDenominator}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {data.creditUdhaar.methods.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No credit providers in sample.</p>
                    ) : (
                      data.creditUdhaar.methods.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.creditUdhaar.methods[0]?.count || 1,
                          'bg-emerald-500'
                        )
                      )
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Credit Collection Challenges
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      N = {data.creditUdhaar.creditBusinessesDenominator}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {data.creditUdhaar.problems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No credit problems reported.</p>
                    ) : (
                      data.creditUdhaar.problems.map((item) =>
                        renderBarRow(
                          item.name,
                          item.count,
                          item.percentage,
                          data.creditUdhaar.problems[0]?.count || 1,
                          'bg-amber-500'
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH READINESS & PREFERRED PLATFORM */}
          {activeSubTab === 'tech' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Devices */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Hardware & Apps in Daily Use
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.technology.deviceUsage.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.technology.deviceUsage[0]?.count || 1,
                        'bg-emerald-500'
                      )
                    )}
                  </div>
                </div>

                {/* Software Comfort Level */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Software Comfort Level
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.technology.comfortLevels.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.technology.comfortLevels[0]?.count || 1,
                        'bg-blue-500'
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Platform & Language Preferences */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Preferred Solution Platform
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.solutionPreferences.platforms.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.solutionPreferences.platforms[0]?.count || 1,
                        'bg-purple-500'
                      )
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Preferred Operating Language
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.solutionPreferences.languages.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.solutionPreferences.languages[0]?.count || 1,
                        'bg-amber-500'
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOFTWARE VALIDATION & PRICING */}
          {activeSubTab === 'pricing' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Would Use Software */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Openness to Use Software
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.validationPricing.wouldUseSoftware.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.validationPricing.wouldUseSoftware[0]?.count || 1,
                        item.name === 'Yes' ? 'bg-emerald-500' : item.name === 'Maybe' ? 'bg-amber-500' : 'bg-slate-600'
                      )
                    )}
                  </div>
                </div>

                {/* Willingness to Pay */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Willingness to Pay For Solution
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.validationPricing.willingnessToPay.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.validationPricing.willingnessToPay[0]?.count || 1,
                        item.name === 'Yes' ? 'bg-emerald-500' : item.name === 'Maybe' ? 'bg-amber-500' : 'bg-slate-600'
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Price Ranges & Pricing Models */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Acceptable Monthly Price Range
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.validationPricing.priceRanges.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.validationPricing.priceRanges[0]?.count || 1,
                        'bg-blue-500'
                      )
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Preferred Billing Model
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">N = {data.sampleSize}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.validationPricing.pricingModels.map((item) =>
                      renderBarRow(
                        item.name,
                        item.count,
                        item.percentage,
                        data.validationPricing.pricingModels[0]?.count || 1,
                        'bg-purple-500'
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CROSS-ANALYSIS */}
          {activeSubTab === 'cross' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Type × Top Problem */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Trade Category × Top Friction Area
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Cross-Tab</span>
                  </div>

                  <div className="space-y-2">
                    {data.crossAnalysis.businessTypeByProblem.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No correlation data available.</p>
                    ) : (
                      data.crossAnalysis.businessTypeByProblem.map((item) => (
                        <div
                          key={item.businessType}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white">{item.businessType}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-medium">
                              {item.topProblem}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({item.count} citations)
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Business Type × Preferred Platform */}
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Trade Category × Preferred Platform
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Cross-Tab</span>
                  </div>

                  <div className="space-y-2">
                    {data.crossAnalysis.businessTypeByPlatform.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">No correlation data available.</p>
                    ) : (
                      data.crossAnalysis.businessTypeByPlatform.map((item) => (
                        <div
                          key={item.businessType}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white">{item.businessType}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[11px] font-medium">
                              {item.topPlatform}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({item.count})
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Business Type × Willingness to Pay % */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Trade Category × Willingness to Pay Rate
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Cross-Tab</span>
                </div>

                <div className="space-y-1.5">
                  {data.crossAnalysis.businessTypeByWillingness.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No data available.</p>
                  ) : (
                    data.crossAnalysis.businessTypeByWillingness.map((item) =>
                      renderBarRow(
                        item.businessType,
                        Math.round((item.willingPercentage / 100) * item.total),
                        item.willingPercentage,
                        item.total,
                        'bg-blue-500',
                        `Total N = ${item.total}`
                      )
                    )
                  )}
                  </div>
              </div>
            </div>
          )}

          {/* TAB 7: MERCHANT VOICES (Curated Free-Text Statements) */}
          {activeSubTab === 'voices' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Quote className="w-4 h-4 text-emerald-400" />
                  <span>Business Owners' Direct Voice Records</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Unfiltered respondent answers to: "What is your single biggest problem?" and "If you could change ONE thing...". Sensitive identity tokens and phone numbers are redacted for privacy.
                </p>
              </div>

              {data.voiceQuotes.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500 italic">
                  No qualitative text responses found for the active filter set.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.voiceQuotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-800">
                          <span className="font-semibold text-emerald-400">
                            {q.businessType} · {q.area}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{q.submittedAt}</span>
                        </div>

                        {q.singleBiggestProblem && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-amber-400 block uppercase tracking-wider">
                              Primary Problem:
                            </span>
                            <blockquote className="text-xs text-slate-200 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                              "{q.singleBiggestProblem}"
                            </blockquote>
                          </div>
                        )}

                        {q.oneThingToChange && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-purple-400 block uppercase tracking-wider">
                              Operational Wishlist:
                            </span>
                            <blockquote className="text-xs text-slate-200 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                              "{q.oneThingToChange}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
