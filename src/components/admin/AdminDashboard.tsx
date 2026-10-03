import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  Building2,
  Users,
  Calendar,
  Database,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Download,
} from 'lucide-react';

import { AdminResponsesList } from './AdminResponsesList.tsx';
import { AdminAnalyticsView } from './AdminAnalyticsView.tsx';
import { AdminExportsView } from './AdminExportsView.tsx';

interface AdminDashboardProps {
  user: {
    email: string;
    name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigateHome: () => void;
}

interface AdminStats {
  totalResponses: number;
  responsesToday: number;
  businessesSurveyed: number;
  topAreas: Array<{ area: string; count: number }>;
}

type AdminTab = 'dashboard' | 'responses' | 'analytics' | 'exports';

export function AdminDashboard({ user, onLogout, onNavigateHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        throw new Error(`Failed to load database stats (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to retrieve stats');
      }
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setStatsError(err.message || 'Unable to connect to database');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 p-5 space-y-6 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            DB
          </div>
          <div>
            <span className="text-sm font-bold text-white block tracking-tight">
              Dadu Business Insights
            </span>
            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider block">
              Admin Terminal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'responses'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Responses</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Research Analytics</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exports')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'exports'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4" />
              <span>Export Center</span>
            </div>
          </button>
        </nav>

        {/* Public Portal Link */}
        <div className="pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <span>Public Survey Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-white block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {user.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            DB
          </div>
          <span className="text-xs font-bold text-white">Admin Dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 z-30">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('responses');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Responses</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('analytics');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Research Analytics</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('exports');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Center</span>
            </div>
          </button>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">{user.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-rose-400 font-medium px-2 py-1 rounded bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-900/40">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Dadu Business Insights · Admin Terminal
            </h1>
            <p className="text-xs text-slate-400">
              Empirical Field Research Infrastructure · Dadu, Sindh
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: {user.role}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-5 md:p-8 space-y-6 max-w-6xl w-full">
          {activeTab === 'dashboard' && (
            <>
              {/* Header Title */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Overview & Core Metrics
                </h2>
                <p className="text-xs text-slate-400">
                  Real database figures queried directly from the verified PostgreSQL tables.
                </p>
              </div>

              {statsError && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
                  {statsError}
                </div>
              )}

              {/* Base KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Responses */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Total Responses</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    {isLoadingStats ? '...' : stats ? stats.totalResponses : 'Not available yet'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stored across PostgreSQL tables
                  </p>
                </div>

                {/* Responses Today */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Responses Today</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    {isLoadingStats ? '...' : stats ? stats.responsesToday : 'Not available yet'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Submitted since 00:00 UTC
                  </p>
                </div>

                {/* Businesses Surveyed */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Businesses Surveyed</span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    {isLoadingStats ? '...' : stats ? stats.businessesSurveyed : 'Not available yet'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Verified business profiles on record
                  </p>
                </div>
              </div>

              {/* Geographic Distribution Card */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Top Surveyed Locations in Dadu
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {stats?.topAreas.length || 0} active zones
                  </span>
                </div>

                {isLoadingStats ? (
                  <p className="text-xs text-slate-400 py-4">Querying database distribution...</p>
                ) : stats && stats.topAreas.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.topAreas.map((loc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs"
                      >
                        <span className="font-medium text-slate-200">{loc.area}</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          {loc.count} {loc.count === 1 ? 'response' : 'responses'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">
                    No field responses recorded yet. As shop owners complete surveys, their locations will appear here.
                  </p>
                )}
              </div>

              {/* Research Security & Status Charter */}
              <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex items-start gap-3.5 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-white">Phase 4 Access Model Active</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    This administrative interface is completely isolated from the public merchant survey. Only authenticated sessions with signed HMAC tokens can query backend statistics or response records.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'responses' && (
            <AdminResponsesList />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsView />
          )}

          {activeTab === 'exports' && (
            <AdminExportsView />
          )}
        </div>
      </main>
    </div>
  );
}
