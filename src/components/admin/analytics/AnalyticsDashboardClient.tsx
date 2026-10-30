'use client';

// src/components/admin/analytics/AnalyticsDashboardClient.tsx
// Comprehensive first-party website traffic analytics dashboard

import React, { useState, useEffect, useCallback } from 'react';
import {
  DateRangeKey,
  OverviewMetrics,
  TimeSeriesDataPoint,
  RealtimeData,
  TrafficSourceItem,
  TopPageItem,
  GeoItem,
  CityItem,
  DeviceBreakdownItem,
  CampaignItem,
  LandingExitItem,
} from '@/lib/analytics/types';
import { formatDuration } from '@/lib/analytics/date-utils';
import { AnalyticsTimeSeriesChart } from './AnalyticsTimeSeriesChart';

interface Props {
  initialOverview: OverviewMetrics;
  initialTimeSeries: TimeSeriesDataPoint[];
  initialRealtime: RealtimeData;
  initialSources: { sources: TrafficSourceItem[]; totalSessions: number };
  initialPages: TopPageItem[];
  initialGeo: { countries: GeoItem[]; cities: CityItem[]; totalSessions: number };
  initialDevices: {
    devices: DeviceBreakdownItem[];
    browsers: DeviceBreakdownItem[];
    os: DeviceBreakdownItem[];
  };
  initialCampaigns: CampaignItem[];
  initialLandingExit: LandingExitItem;
}

export function AnalyticsDashboardClient({
  initialOverview,
  initialTimeSeries,
  initialRealtime,
  initialSources,
  initialPages,
  initialGeo,
  initialDevices,
  initialCampaigns,
  initialLandingExit,
}: Props) {
  // Filters state
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('last7d');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'pageViews' | 'uniqueVisitors' | 'sessions' | 'visitors'>('pageViews');
  const [pageSortBy, setPageSortBy] = useState<'views' | 'visitors'>('views');
  const [campaignSearch, setCampaignSearch] = useState<string>('');

  // Live Auto-Refresh State
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Dashboard Data State
  const [overview, setOverview] = useState<OverviewMetrics>(initialOverview);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>(initialTimeSeries);
  const [realtime, setRealtime] = useState<RealtimeData>(initialRealtime);
  const [sources, setSources] = useState(initialSources);
  const [pages, setPages] = useState<TopPageItem[]>(initialPages);
  const [geo, setGeo] = useState(initialGeo);
  const [devices, setDevices] = useState(initialDevices);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [landingExit, setLandingExit] = useState<LandingExitItem>(initialLandingExit);

  // Helper to build query parameters
  const getParams = useCallback(
    (customSort?: string) => {
      const p = new URLSearchParams();
      p.set('range', rangeKey);
      if (rangeKey === 'custom') {
        if (customFrom) p.set('from', customFrom);
        if (customTo) p.set('to', customTo);
      }
      if (customSort) p.set('sort', customSort);
      return p.toString();
    },
    [rangeKey, customFrom, customTo]
  );

  // Fetch full dashboard data
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true);
      try {
        const query = getParams(pageSortBy);

        const [
          overviewRes,
          timeSeriesRes,
          realtimeRes,
          sourcesRes,
          pagesRes,
          geoRes,
          devicesRes,
          campaignsRes,
          landingExitRes,
        ] = await Promise.all([
          fetch(`/api/v1/admin/analytics/overview?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/timeseries?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/realtime`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/sources?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/pages?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/geo?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/devices?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/campaigns?${query}`).then((r) => r.json()),
          fetch(`/api/v1/admin/analytics/landing-exit?${query}`).then((r) => r.json()),
        ]);

        if (overviewRes.success) setOverview(overviewRes.data);
        if (timeSeriesRes.success) setTimeSeries(timeSeriesRes.data.points);
        if (realtimeRes.success) setRealtime(realtimeRes.data);
        if (sourcesRes.success) setSources(sourcesRes.data);
        if (pagesRes.success) setPages(pagesRes.data.pages);
        if (geoRes.success) setGeo(geoRes.data);
        if (devicesRes.success) setDevices(devicesRes.data);
        if (campaignsRes.success) setCampaigns(campaignsRes.data.campaigns);
        if (landingExitRes.success) setLandingExit(landingExitRes.data);

        setLastRefreshedAt(new Date());
      } catch (err) {
        console.error('Failed to refresh analytics dashboard', err);
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [getParams, pageSortBy]
  );

  // Auto-refresh timer for real-time activity every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Refresh realtime stats quietly
      fetch(`/api/v1/admin/analytics/realtime`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setRealtime(res.data);
        })
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Refetch when filters or sorting change
  useEffect(() => {
    fetchData();
  }, [rangeKey, pageSortBy, fetchData]);

  // Date filter options
  const filterRanges: Array<{ key: DateRangeKey; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7d', label: 'Last 7 Days' },
    { key: 'last30d', label: 'Last 30 Days' },
    { key: 'last90d', label: 'Last 90 Days' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'custom', label: 'Custom' },
  ];

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.campaign_name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c.campaign_source.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c.campaign_medium.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E84B2C] shadow-[0_0_10px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              First-Party Traffic Engine
            </span>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">●</span>
            <div className="flex items-center gap-1.5 text-xs text-[#63C7A2] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#63C7A2] animate-pulse" />
              <span>{realtime.activeVisitorsNow} active now</span>
            </div>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Website Traffic Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Privacy-conscious visitor telemetry, traffic source attribution, and real-time behavioral insights.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn text-xs font-mono px-3 py-1.5 border transition-all ${
              autoRefresh
                ? 'bg-[#63C7A2]/10 border-[#63C7A2]/40 text-[#63C7A2]'
                : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] text-[var(--color-text-muted)]'
            }`}
          >
            {autoRefresh ? '● Live Polling (15s)' : '○ Polling Paused'}
          </button>

          <button
            type="button"
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="btn btn-secondary text-xs font-mono flex items-center gap-2"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--color-surface-elevated)] p-2.5 rounded-xl border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterRanges.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRangeKey(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
                rangeKey === f.key
                  ? 'bg-[#E84B2C] text-white shadow-[0_0_12px_rgba(232,75,44,0.35)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {rangeKey === 'custom' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border-subtle)]">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[var(--color-obsidian)] border border-[var(--color-border-standard)] rounded text-[var(--color-text-primary)] font-mono"
            />
            <span className="text-xs text-[var(--color-text-muted)]">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[var(--color-obsidian)] border border-[var(--color-border-standard)] rounded text-[var(--color-text-primary)] font-mono"
            />
            <button
              type="button"
              onClick={() => fetchData()}
              className="btn btn-primary text-xs py-1 px-2.5 font-mono"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 3. A. KPI Overview Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Visitors */}
        <MetricCard
          label="Total Visitors"
          icon="👥"
          value={overview.totalVisitors.current.toLocaleString()}
          change={overview.totalVisitors.changePercent}
          trend={overview.totalVisitors.trend}
          prevValue={overview.totalVisitors.previous}
          color="#E87A38"
        />

        {/* Card 2: Unique Visitors */}
        <MetricCard
          label="Unique Visitors"
          icon="👤"
          value={overview.uniqueVisitors.current.toLocaleString()}
          change={overview.uniqueVisitors.changePercent}
          trend={overview.uniqueVisitors.trend}
          prevValue={overview.uniqueVisitors.previous}
          color="#E84B2C"
        />

        {/* Card 3: Total Page Views */}
        <MetricCard
          label="Total Page Views"
          icon="📄"
          value={overview.totalPageViews.current.toLocaleString()}
          change={overview.totalPageViews.changePercent}
          trend={overview.totalPageViews.trend}
          prevValue={overview.totalPageViews.previous}
          color="#63C7A2"
        />

        {/* Card 4: Sessions */}
        <MetricCard
          label="Total Sessions"
          icon="⚡"
          value={overview.totalSessions.current.toLocaleString()}
          change={overview.totalSessions.changePercent}
          trend={overview.totalSessions.trend}
          prevValue={overview.totalSessions.previous}
          color="#D4AF37"
        />

        {/* Card 5: Average Session Duration */}
        <MetricCard
          label="Avg Session Duration"
          icon="⏱️"
          value={formatDuration(overview.avgSessionDuration.current)}
          change={overview.avgSessionDuration.changePercent}
          trend={overview.avgSessionDuration.trend}
          prevValue={
            overview.avgSessionDuration.previous !== null
              ? formatDuration(overview.avgSessionDuration.previous)
              : null
          }
          color="#C86938"
        />

        {/* Card 6: Bounce Rate */}
        <MetricCard
          label="Bounce Rate"
          icon="📉"
          value={`${overview.bounceRate.current}%`}
          change={overview.bounceRate.changePercent}
          trend={overview.bounceRate.trend}
          prevValue={
            overview.bounceRate.previous !== null ? `${overview.bounceRate.previous}%` : null
          }
          color="#E84B2C"
          invertTrendColor
          extraSubtext={`Engaged: ${overview.engagementRate.current}%`}
        />
      </div>

      {/* 4. B. Interactive Time Series Chart Section */}
      <div className="card p-6 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Traffic Volume Over Time
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Hourly and daily trajectory across your website visitors
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1 bg-[var(--color-obsidian)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
            {[
              { key: 'pageViews', label: 'Page Views', color: '#63C7A2' },
              { key: 'uniqueVisitors', label: 'Unique Visitors', color: '#E84B2C' },
              { key: 'sessions', label: 'Sessions', color: '#D4AF37' },
              { key: 'visitors', label: 'Visitors', color: '#E87A38' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setChartMetric(m.key as any)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  chartMetric === m.key
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] font-semibold shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="pt-2">
          <AnalyticsTimeSeriesChart
            data={timeSeries}
            metricKey={chartMetric}
            metricLabel={
              chartMetric === 'pageViews'
                ? 'Page Views'
                : chartMetric === 'uniqueVisitors'
                ? 'Unique Visitors'
                : chartMetric === 'sessions'
                ? 'Sessions'
                : 'Visitors'
            }
            color={
              chartMetric === 'pageViews'
                ? '#63C7A2'
                : chartMetric === 'uniqueVisitors'
                ? '#E84B2C'
                : chartMetric === 'sessions'
                ? '#D4AF37'
                : '#E87A38'
            }
          />
        </div>
      </div>

      {/* 5. C. Real-Time Telemetry & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Status Card */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#63C7A2] animate-pulse" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#63C7A2]">
                  Live Pulse (5m)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Sync: {lastRefreshedAt.toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)]">
                <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] mb-1">
                  Active Right Now
                </div>
                <div className="font-mono text-3xl font-bold text-[#63C7A2]">
                  {realtime.activeVisitorsNow}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">in last 60s</div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)]">
                <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] mb-1">
                  Active (Last 5m)
                </div>
                <div className="font-mono text-3xl font-bold text-[#E87A38]">
                  {realtime.activeVisitorsLast5m}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">active sessions</div>
              </div>
            </div>

            {/* Currently Active Pages */}
            <div className="mt-4">
              <div className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
                Pages Currently Being Viewed
              </div>
              {realtime.topActivePages.length === 0 ? (
                <div className="text-xs text-[var(--color-text-muted)] py-3 text-center italic bg-[var(--color-obsidian)] rounded-lg">
                  No active visitors in the last 5 minutes.
                </div>
              ) : (
                <div className="space-y-2">
                  {realtime.topActivePages.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="font-medium text-[var(--color-text-primary)] truncate">
                          {p.page_title}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--color-text-muted)] truncate">
                          {p.page_path}
                        </div>
                      </div>
                      <span className="font-mono px-2 py-0.5 rounded bg-[#63C7A2]/15 text-[#63C7A2] font-semibold text-[11px] whitespace-nowrap">
                        {p.active_count} active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Stream of Recent Events */}
        <div className="lg:col-span-2 card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>⚡</span>
              <span>Recent Page-View Stream</span>
            </h3>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">Latest 15 hits</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-1">
            {realtime.recentEvents.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] py-12 text-center italic">
                No recent page visits recorded yet. Tracking events will appear here in real time.
              </div>
            ) : (
              realtime.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-standard)] transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 mr-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-[var(--color-text-primary)] truncate">
                        {evt.page_title}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--color-text-muted)] truncate">
                        {evt.page_path}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      {evt.country}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] capitalize">
                      {evt.device_type}
                    </span>
                    <span className="text-[var(--color-text-muted)] w-16 text-right">
                      {evt.relative_time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. D. Traffic Sources & Technology Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Traffic Sources
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Direct, Organic, Paid, Social, and Campaigns
              </p>
            </div>
            <span className="text-xs font-mono text-[#E87A38]">
              {sources.totalSessions.toLocaleString()} sessions
            </span>
          </div>

          {sources.sources.length === 0 ? (
            <div className="text-xs text-[var(--color-text-muted)] py-8 text-center italic">
              No session data in this period.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {sources.sources.map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {s.label}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[var(--color-text-secondary)]">
                        {s.sessions.toLocaleString()} sessions
                      </span>
                      <span className="text-[var(--color-text-muted)] text-[11px]">
                        ({s.percentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-[var(--color-obsidian)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.percentage}%`,
                        backgroundColor:
                          s.source === 'direct'
                            ? '#63C7A2'
                            : s.source === 'organic_search'
                            ? '#E87A38'
                            : s.source === 'paid_search'
                            ? '#E84B2C'
                            : s.source === 'social'
                            ? '#D4AF37'
                            : '#C86938',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device & OS Breakdowns */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Device &amp; Technology Breakdown
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Hardware category, browsers, and operating systems
          </p>

          {/* Device Types Pills */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {['desktop', 'mobile', 'tablet'].map((type) => {
              const match = devices.devices.find((d) => d.label === type);
              const count = match ? match.count : 0;
              const pct = match ? match.percentage : 0;
              const icon = type === 'desktop' ? '💻' : type === 'mobile' ? '📱' : '📟';

              return (
                <div
                  key={type}
                  className="p-3 rounded-xl bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-center"
                >
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] capitalize">
                    {type}
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                    {count}
                  </div>
                  <div className="text-[10px] font-mono text-[#E87A38]">{pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Top Browsers & OS in 2 columns */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-subtle)]">
            <div>
              <div className="text-xs font-mono uppercase text-[var(--color-text-muted)] mb-2">
                Top Browsers
              </div>
              <div className="space-y-1.5 text-xs">
                {devices.browsers.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] italic">No data</div>
                ) : (
                  devices.browsers.slice(0, 4).map((b) => (
                    <div key={b.label} className="flex justify-between items-center font-mono">
                      <span className="text-[var(--color-text-secondary)] truncate mr-2">
                        {b.label}
                      </span>
                      <span className="text-[var(--color-text-muted)]">{b.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase text-[var(--color-text-muted)] mb-2">
                Top Operating Systems
              </div>
              <div className="space-y-1.5 text-xs">
                {devices.os.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] italic">No data</div>
                ) : (
                  devices.os.slice(0, 4).map((o) => (
                    <div key={o.label} className="flex justify-between items-center font-mono">
                      <span className="text-[var(--color-text-secondary)] truncate mr-2">
                        {o.label}
                      </span>
                      <span className="text-[var(--color-text-muted)]">{o.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. E. Top Pages Table Section */}
      <div className="card p-6 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Top Visited Pages
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Views, unique readers, bounce rate, and average reading time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">Sort by:</span>
            <button
              type="button"
              onClick={() => setPageSortBy('views')}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                pageSortBy === 'views'
                  ? 'bg-[#E84B2C]/20 border-[#E84B2C] text-[#E84B2C] font-semibold'
                  : 'bg-[var(--color-obsidian)] border-[var(--color-border-standard)] text-[var(--color-text-muted)]'
              }`}
            >
              Page Views
            </button>
            <button
              type="button"
              onClick={() => setPageSortBy('visitors')}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                pageSortBy === 'visitors'
                  ? 'bg-[#E84B2C]/20 border-[#E84B2C] text-[#E84B2C] font-semibold'
                  : 'bg-[var(--color-obsidian)] border-[var(--color-border-standard)] text-[var(--color-text-muted)]'
              }`}
            >
              Unique Visitors
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-standard)] text-[var(--color-text-muted)] font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Page Title &amp; Path</th>
                <th className="py-2.5 px-3 text-right">Page Views</th>
                <th className="py-2.5 px-3 text-right">Unique Visitors</th>
                <th className="py-2.5 px-3 text-right">Avg Duration</th>
                <th className="py-2.5 px-3 text-right">Bounce Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)] italic">
                    No page views recorded in this time range.
                  </td>
                </tr>
              ) : (
                pages.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--color-surface-hover)] transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium text-[var(--color-text-primary)] group-hover:text-[#E87A38] transition-colors">
                        {p.page_title}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--color-text-muted)]">
                        {p.page_path}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                      {p.page_views.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--color-text-secondary)]">
                      {p.unique_visitors.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatDuration(p.avg_time_seconds)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          p.bounce_rate > 60
                            ? 'bg-[#E84B2C]/15 text-[#E84B2C]'
                            : 'bg-[#63C7A2]/15 text-[#63C7A2]'
                        }`}
                      >
                        {p.bounce_rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. F. Geographic Analytics & Landing/Exit Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Geographic Distribution
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Top visitor countries &amp; cities (transiently geolocated)
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              {geo.countries.length} locations
            </span>
          </div>

          {geo.countries.length === 0 ? (
            <div className="text-xs text-[var(--color-text-muted)] py-8 text-center italic">
              No geographical data recorded in this period.
            </div>
          ) : (
            <div className="space-y-3">
              {geo.countries.slice(0, 6).map((c) => (
                <div key={c.country} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-[#E87A38]">
                        {c.country}
                      </span>
                      <span>{c.country_name}</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[var(--color-text-secondary)]">
                        {c.sessions.toLocaleString()} sessions
                      </span>
                      <span className="text-[var(--color-text-muted)] text-[11px]">
                        ({c.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--color-obsidian)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E84B2C] to-[#E87A38]"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Top Cities */}
              {geo.cities.length > 0 && (
                <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="text-[11px] font-mono uppercase text-[var(--color-text-muted)] mb-2">
                    Top Metropolitan Areas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {geo.cities.slice(0, 6).map((ct, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-xs font-mono"
                      >
                        {ct.city}, {ct.country} ({ct.sessions})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Landing & Exit Pages */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Landing &amp; Exit Flow
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Most frequent session entry points and exit drop-offs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Landing Pages */}
            <div>
              <div className="text-xs font-mono uppercase text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                <span className="text-[#63C7A2]">↗</span> Top Landing Pages
              </div>
              <div className="space-y-2">
                {landingExit.landingPages.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] italic">No entries</div>
                ) : (
                  landingExit.landingPages.slice(0, 5).map((l, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-xs"
                    >
                      <div className="font-mono text-[var(--color-text-primary)] truncate">
                        {l.page_path}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] mt-1">
                        <span>{l.count} entries</span>
                        <span className="text-[#63C7A2]">{l.bounce_rate}% bounce</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Exit Pages */}
            <div>
              <div className="text-xs font-mono uppercase text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                <span className="text-[#E84B2C]">↘</span> Top Exit Pages
              </div>
              <div className="space-y-2">
                {landingExit.exitPages.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] italic">No exits</div>
                ) : (
                  landingExit.exitPages.slice(0, 5).map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[var(--color-obsidian)] border border-[var(--color-border-subtle)] text-xs"
                    >
                      <div className="font-mono text-[var(--color-text-primary)] truncate">
                        {e.page_path}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] mt-1">
                        <span>{e.count} exits</span>
                        <span className="text-[#E84B2C]">{e.exit_rate}% exit rate</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. H. Campaign UTM Analytics */}
      <div className="card p-6 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              UTM Campaign Performance
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Acquisition telemetry tagged via utm_source, utm_medium, and utm_campaign
            </p>
          </div>

          <input
            type="text"
            placeholder="Filter campaigns or source..."
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[var(--color-obsidian)] border border-[var(--color-border-standard)] rounded-lg text-[var(--color-text-primary)] font-mono w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-standard)] text-[var(--color-text-muted)] font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Medium</th>
                <th className="py-2.5 px-3 text-right">Visitors</th>
                <th className="py-2.5 px-3 text-right">Sessions</th>
                <th className="py-2.5 px-3 text-right">Page Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)] italic">
                    {campaigns.length === 0
                      ? 'No UTM tagged campaigns detected. Append ?utm_source=...&utm_medium=... to landing URLs to track campaigns.'
                      : 'No campaigns match the filter search.'}
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">
                      {c.campaign_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--color-text-secondary)]">
                      {c.campaign_source}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--color-text-secondary)]">
                      {c.campaign_medium}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--color-text-primary)]">
                      {c.visitors.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#E87A38]">
                      {c.sessions.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--color-text-secondary)]">
                      {c.page_views.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Sub-component for KPI Metric Cards
function MetricCard({
  label,
  icon,
  value,
  change,
  trend,
  prevValue,
  color,
  invertTrendColor = false,
  extraSubtext,
}: {
  label: string;
  icon: string;
  value: string;
  change: number | null;
  trend: 'up' | 'down' | 'neutral' | 'no_data';
  prevValue: string | number | null;
  color: string;
  invertTrendColor?: boolean;
  extraSubtext?: string;
}) {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  // For bounce rate, "down" is good (emerald), "up" is caution (flame)
  const isPositive = invertTrendColor ? isDown : isUp;
  const trendColorClass = isPositive ? 'text-[#63C7A2]' : 'text-[#E84B2C]';

  return (
    <div className="card p-4 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm">{icon}</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] truncate">
              {label}
            </span>
          </div>
        </div>

        <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] text-[11px] font-mono flex flex-wrap items-center justify-between gap-1">
        {trend === 'no_data' || change === null ? (
          <span className="text-[var(--color-text-muted)]">— Baseline absent</span>
        ) : (
          <div className={`flex items-center gap-1 ${trendColorClass} font-semibold`}>
            <span>{isUp ? '↑' : isDown ? '↓' : '•'}</span>
            <span>{Math.abs(change)}%</span>
            <span className="text-[var(--color-text-muted)] font-normal text-[10px]">vs prev</span>
          </div>
        )}

        {extraSubtext && (
          <span className="text-[10px] text-[var(--color-text-muted)]">{extraSubtext}</span>
        )}
      </div>
    </div>
  );
}

