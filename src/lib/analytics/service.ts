// src/lib/analytics/service.ts
// Core analytics ingestion, session lifecycle, and aggregation service

import { queryAnalytics } from './db';
import {
  CollectPayload,
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
  DateRangeKey,
  TrafficSource,
} from './types';
import {
  classifyTrafficSource,
  parseUserAgent,
  extractGeolocation,
  getCountryName,
} from './classifier';
import {
  resolveDateRange,
  calculateComparison,
} from './date-utils';
import { format, eachDayOfInterval, eachHourOfInterval } from 'date-fns';

/**
 * Ingests a client tracking event, maintaining visitor profiles and session boundaries.
 */
export async function recordAnalyticsEvent(
  payload: CollectPayload,
  headers: Headers
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const {
      visitor_id,
      session_id,
      event_name,
      page_path,
      page_title,
      referrer,
      utm,
      screen_resolution,
      event_properties = {},
    } = payload;

    if (!visitor_id || !session_id || !event_name || !page_path) {
      return { success: false, error: 'Missing required tracking fields' };
    }

    // 1. User Agent and Device Intelligence
    const rawUA = headers.get('user-agent') || '';
    const uaParsed = parseUserAgent(rawUA);

    // Filter out bots from recording metrics
    if (uaParsed.isBot) {
      return { success: true };
    }

    const deviceType = payload.device_type || uaParsed.deviceType;
    const browser = payload.browser || uaParsed.browser;
    const browserVersion = payload.browser_version || uaParsed.browserVersion;
    const os = payload.operating_system || uaParsed.os;

    // 2. Geolocation (transiently extracted, IP discarded)
    const geo = extractGeolocation(headers);

    // 3. Traffic Source Classification
    const hostHeader = headers.get('host') || headers.get('x-forwarded-host');
    const { source: trafficSource, referringDomain } = classifyTrafficSource({
      referrer,
      utm,
      currentHost: hostHeader,
    });

    const isPageView = event_name === 'page_view';
    const isScrollMilestone = event_name === 'scroll_depth';
    const scrollDepth = isScrollMilestone ? Number(event_properties?.depth || 0) : 0;
    const isQualifyingAction =
      (isScrollMilestone && scrollDepth >= 50) ||
      event_name === 'cta_click' ||
      event_name === 'form_submit' ||
      event_name === 'contact_form_submitted';

    // 4. Upsert Visitor
    await queryAnalytics(
      `
      INSERT INTO public.analytics_visitors (
        id, first_seen_at, last_seen_at, total_sessions, total_page_views,
        device_type, browser, operating_system, country, region, city
      ) VALUES ($1, NOW(), NOW(), 1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        last_seen_at = NOW(),
        total_sessions = public.analytics_visitors.total_sessions + (CASE WHEN $9 = true THEN 1 ELSE 0 END),
        total_page_views = public.analytics_visitors.total_page_views + (CASE WHEN $10 = true THEN 1 ELSE 0 END),
        device_type = COALESCE(EXCLUDED.device_type, public.analytics_visitors.device_type),
        browser = COALESCE(EXCLUDED.browser, public.analytics_visitors.browser),
        operating_system = COALESCE(EXCLUDED.operating_system, public.analytics_visitors.operating_system),
        country = CASE WHEN EXCLUDED.country <> 'UNKNOWN' THEN EXCLUDED.country ELSE public.analytics_visitors.country END,
        region = COALESCE(EXCLUDED.region, public.analytics_visitors.region),
        city = COALESCE(EXCLUDED.city, public.analytics_visitors.city),
        updated_at = NOW();
      `,
      [
        visitor_id,
        isPageView ? 1 : 0,
        deviceType,
        browser,
        os,
        geo.country,
        geo.region,
        geo.city,
        Boolean(payload.is_new_session),
        isPageView,
      ]
    );

    // 5. Upsert Session
    const existingSessionRes = await queryAnalytics(
      `SELECT id, started_at, page_views, duration_seconds, is_bounce, has_qualified_engagement, exit_page FROM public.analytics_sessions WHERE id = $1`,
      [session_id]
    );

    if (existingSessionRes.rows.length === 0) {
      // New Session
      await queryAnalytics(
        `
        INSERT INTO public.analytics_sessions (
          id, visitor_id, entry_page, exit_page, referrer, referring_domain,
          traffic_source, campaign_source, campaign_medium, campaign_name,
          campaign_term, campaign_content, device_type, browser, browser_version,
          operating_system, screen_resolution, country, region, city,
          started_at, last_activity_at, duration_seconds, page_views, is_bounce,
          has_qualified_engagement
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          NOW(), NOW(), 0, $21, $22,
          $23
        );
        `,
        [
          session_id,
          visitor_id,
          page_path,
          page_path,
          referrer || null,
          referringDomain,
          trafficSource,
          utm?.source || null,
          utm?.medium || null,
          utm?.campaign || null,
          utm?.term || null,
          utm?.content || null,
          deviceType,
          browser,
          browserVersion,
          os,
          screen_resolution || null,
          geo.country,
          geo.region,
          geo.city,
          isPageView ? 1 : 0,
          !isQualifyingAction,
          isQualifyingAction,
        ]
      );
    } else {
      // Update existing session
      const sess = existingSessionRes.rows[0];
      const startedAt = new Date(sess.started_at).getTime();
      const now = Date.now();
      const currentDuration = Math.max(0, Math.round((now - startedAt) / 1000));
      const newPageViews = isPageView ? sess.page_views + 1 : sess.page_views;
      const qualifies = sess.has_qualified_engagement || isQualifyingAction || currentDuration >= 15 || newPageViews > 1;
      const isBounce = !qualifies;

      await queryAnalytics(
        `
        UPDATE public.analytics_sessions
        SET
          last_activity_at = NOW(),
          ended_at = NOW(),
          duration_seconds = GREATEST(duration_seconds, $1),
          exit_page = CASE WHEN $2 = true THEN $3 ELSE exit_page END,
          page_views = $4,
          is_bounce = $5,
          has_qualified_engagement = $6,
          updated_at = NOW()
        WHERE id = $7;
        `,
        [
          currentDuration,
          isPageView,
          page_path,
          newPageViews,
          isBounce,
          qualifies,
          session_id,
        ]
      );
    }

    // 6. Record Event
    const eventRes = await queryAnalytics(
      `
      INSERT INTO public.analytics_events (
        event_name, visitor_id, session_id, page_path, page_title,
        referrer, event_properties, device_type, browser,
        operating_system, country, region, city, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id;
      `,
      [
        event_name,
        visitor_id,
        session_id,
        page_path,
        page_title || null,
        referrer || null,
        JSON.stringify(event_properties),
        deviceType,
        browser,
        os,
        geo.country,
        geo.region,
        geo.city,
      ]
    );

    return { success: true, eventId: eventRes.rows[0]?.id };
  } catch (err: any) {
    console.error('Error in recordAnalyticsEvent:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves high-level KPI overview with previous-period comparison.
 */
export async function getOverviewMetrics(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<OverviewMetrics> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  // Helper query for metrics in a time range
  const fetchPeriodStats = async (start: Date, end: Date) => {
    const res = await queryAnalytics(
      `
      SELECT
        COUNT(DISTINCT visitor_id) AS unique_visitors,
        COUNT(DISTINCT id) AS total_sessions,
        COALESCE(SUM(page_views), 0) AS total_page_views,
        COALESCE(AVG(duration_seconds), 0) AS avg_duration,
        COUNT(CASE WHEN is_bounce = true THEN 1 END) AS bounce_count,
        COUNT(CASE WHEN has_qualified_engagement = true THEN 1 END) AS engaged_count
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2;
      `,
      [start.toISOString(), end.toISOString()]
    );

    const row = res.rows[0] || {};
    const totalSessions = Number(row.total_sessions || 0);
    const bounceCount = Number(row.bounce_count || 0);
    const engagedCount = Number(row.engaged_count || 0);

    const bounceRate = totalSessions > 0 ? (bounceCount / totalSessions) * 100 : 0;
    const engagementRate = totalSessions > 0 ? (engagedCount / totalSessions) * 100 : 0;

    return {
      uniqueVisitors: Number(row.unique_visitors || 0),
      totalSessions,
      totalPageViews: Number(row.total_page_views || 0),
      avgDuration: Math.round(Number(row.avg_duration || 0)),
      bounceRate: Math.round(bounceRate * 10) / 10,
      engagementRate: Math.round(engagementRate * 10) / 10,
    };
  };

  const [current, previous] = await Promise.all([
    fetchPeriodStats(range.startDate, range.endDate),
    fetchPeriodStats(range.prevStartDate, range.prevEndDate),
  ]);

  // Check if historical baseline exists
  const hasHistory = previous.totalSessions > 0 || previous.totalPageViews > 0;

  return {
    totalVisitors: {
      current: current.totalSessions,
      previous: hasHistory ? previous.totalSessions : null,
      ...calculateComparison(current.totalSessions, hasHistory ? previous.totalSessions : null),
    },
    uniqueVisitors: {
      current: current.uniqueVisitors,
      previous: hasHistory ? previous.uniqueVisitors : null,
      ...calculateComparison(current.uniqueVisitors, hasHistory ? previous.uniqueVisitors : null),
    },
    totalPageViews: {
      current: current.totalPageViews,
      previous: hasHistory ? previous.totalPageViews : null,
      ...calculateComparison(current.totalPageViews, hasHistory ? previous.totalPageViews : null),
    },
    totalSessions: {
      current: current.totalSessions,
      previous: hasHistory ? previous.totalSessions : null,
      ...calculateComparison(current.totalSessions, hasHistory ? previous.totalSessions : null),
    },
    avgSessionDuration: {
      current: current.avgDuration,
      previous: hasHistory ? previous.avgDuration : null,
      ...calculateComparison(current.avgDuration, hasHistory ? previous.avgDuration : null),
    },
    bounceRate: {
      current: current.bounceRate,
      previous: hasHistory ? previous.bounceRate : null,
      ...calculateComparison(current.bounceRate, hasHistory ? previous.bounceRate : null),
    },
    engagementRate: {
      current: current.engagementRate,
      previous: hasHistory ? previous.engagementRate : null,
      ...calculateComparison(current.engagementRate, hasHistory ? previous.engagementRate : null),
    },
    period: {
      start: range.startDate.toISOString(),
      end: range.endDate.toISOString(),
      previousStart: range.prevStartDate.toISOString(),
      previousEnd: range.prevEndDate.toISOString(),
      rangeKey,
    },
  };
}

/**
 * Retrieves time-series aggregations with zero-fill.
 */
export async function getTimeSeries(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<TimeSeriesDataPoint[]> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);
  const { startDate, endDate, bucketType } = range;

  const dateTrunc = bucketType === 'hour' ? 'hour' : bucketType === 'month' ? 'month' : 'day';

  const res = await queryAnalytics(
    `
    SELECT
      DATE_TRUNC('${dateTrunc}', started_at) AS bucket,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COUNT(id) AS sessions,
      COALESCE(SUM(page_views), 0) AS page_views
    FROM public.analytics_sessions
    WHERE started_at >= $1 AND started_at <= $2
    GROUP BY bucket
    ORDER BY bucket ASC;
    `,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const dataMap = new Map<string, { uniqueVisitors: number; sessions: number; pageViews: number }>();
  for (const r of res.rows) {
    const key = new Date(r.bucket).toISOString();
    dataMap.set(key, {
      uniqueVisitors: Number(r.unique_visitors || 0),
      sessions: Number(r.sessions || 0),
      pageViews: Number(r.page_views || 0),
    });
  }

  // Generate zero-filled continuous series
  const points: TimeSeriesDataPoint[] = [];

  if (bucketType === 'hour') {
    const hours = eachHourOfInterval({ start: startDate, end: endDate });
    for (const h of hours) {
      const matchKey = h.toISOString();
      let match = dataMap.get(matchKey);
      if (!match) {
        // Fallback matching by truncated hour
        for (const [k, v] of dataMap.entries()) {
          if (new Date(k).getTime() === h.getTime()) {
            match = v;
            break;
          }
        }
      }

      points.push({
        date: h.toISOString(),
        label: format(h, 'HH:mm'),
        visitors: match ? match.sessions : 0,
        uniqueVisitors: match ? match.uniqueVisitors : 0,
        pageViews: match ? match.pageViews : 0,
        sessions: match ? match.sessions : 0,
      });
    }
  } else {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    for (const d of days) {
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);

      let match: { uniqueVisitors: number; sessions: number; pageViews: number } | undefined;
      for (const [k, v] of dataMap.entries()) {
        const itemDate = new Date(k);
        if (
          itemDate.getUTCFullYear() === dayStart.getUTCFullYear() &&
          itemDate.getUTCMonth() === dayStart.getUTCMonth() &&
          itemDate.getUTCDate() === dayStart.getUTCDate()
        ) {
          match = v;
          break;
        }
      }

      points.push({
        date: d.toISOString(),
        label: format(d, 'MMM dd'),
        visitors: match ? match.sessions : 0,
        uniqueVisitors: match ? match.uniqueVisitors : 0,
        pageViews: match ? match.pageViews : 0,
        sessions: match ? match.sessions : 0,
      });
    }
  }

  return points;
}

/**
 * Real-time visitor activity (active now, active in 5m, top pages, live feed).
 */
export async function getRealtimeStats(): Promise<RealtimeData> {
  const [nowRes, last5mRes, topPagesRes, eventsRes] = await Promise.all([
    // Active in last 60 seconds
    queryAnalytics(`
      SELECT COUNT(DISTINCT visitor_id) AS count
      FROM public.analytics_sessions
      WHERE last_activity_at >= NOW() - INTERVAL '60 seconds';
    `),
    // Active in last 5 minutes
    queryAnalytics(`
      SELECT COUNT(DISTINCT visitor_id) AS count
      FROM public.analytics_sessions
      WHERE last_activity_at >= NOW() - INTERVAL '5 minutes';
    `),
    // Top active pages in last 5 minutes
    queryAnalytics(`
      SELECT
        page_path,
        COALESCE(MAX(page_title), page_path) AS page_title,
        COUNT(DISTINCT visitor_id) AS active_count
      FROM public.analytics_events
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'
      GROUP BY page_path
      ORDER BY active_count DESC
      LIMIT 6;
    `),
    // Recent 15 events
    queryAnalytics(`
      SELECT
        id, event_name, page_path, page_title, country, device_type, timestamp
      FROM public.analytics_events
      WHERE event_name = 'page_view'
      ORDER BY timestamp DESC
      LIMIT 15;
    `),
  ]);

  const activeNow = Number(nowRes.rows[0]?.count || 0);
  const active5m = Number(last5mRes.rows[0]?.count || 0);

  const nowMs = Date.now();
  const recentEvents = eventsRes.rows.map((r) => {
    const diffSecs = Math.max(0, Math.round((nowMs - new Date(r.timestamp).getTime()) / 1000));
    let rel = `${diffSecs}s ago`;
    if (diffSecs >= 60) {
      rel = `${Math.floor(diffSecs / 60)}m ago`;
    }

    return {
      id: r.id,
      event_name: r.event_name,
      page_path: r.page_path,
      page_title: r.page_title || r.page_path,
      country: r.country || 'UNKNOWN',
      device_type: r.device_type || 'desktop',
      timestamp: r.timestamp,
      relative_time: rel,
    };
  });

  return {
    activeVisitorsNow: activeNow,
    activeVisitorsLast5m: active5m,
    topActivePages: topPagesRes.rows.map((r) => ({
      page_path: r.page_path,
      page_title: r.page_title || r.page_path,
      active_count: Number(r.active_count || 0),
    })),
    recentEvents,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Traffic sources breakdown.
 */
export async function getTrafficSources(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<{ sources: TrafficSourceItem[]; totalSessions: number }> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const res = await queryAnalytics(
    `
    SELECT
      traffic_source,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(id) AS sessions
    FROM public.analytics_sessions
    WHERE started_at >= $1 AND started_at <= $2
    GROUP BY traffic_source
    ORDER BY sessions DESC;
    `,
    [range.startDate.toISOString(), range.endDate.toISOString()]
  );

  const sourceLabels: Record<TrafficSource, string> = {
    direct: 'Direct Traffic',
    organic_search: 'Organic Search',
    paid_search: 'Paid Search / CPC',
    social: 'Social Media',
    referral: 'Referral',
    email: 'Email Campaigns',
    other: 'Other Campaigns',
  };

  const totalSessions = res.rows.reduce((sum, r) => sum + Number(r.sessions || 0), 0);

  const sources: TrafficSourceItem[] = res.rows.map((r) => {
    const src = r.traffic_source as TrafficSource;
    const sessCount = Number(r.sessions || 0);
    const pct = totalSessions > 0 ? Math.round((sessCount / totalSessions) * 1000) / 10 : 0;

    return {
      source: src,
      label: sourceLabels[src] || src,
      visitors: Number(r.visitors || 0),
      sessions: sessCount,
      percentage: pct,
    };
  });

  return { sources, totalSessions };
}

/**
 * Top pages with unique visitors, bounce rate, and avg time.
 */
export async function getTopPages(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string,
  sortBy: 'views' | 'visitors' = 'views'
): Promise<TopPageItem[]> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const res = await queryAnalytics(
    `
    WITH page_stats AS (
      SELECT
        page_path,
        COALESCE(MAX(page_title), page_path) AS page_title,
        COUNT(id) AS page_views,
        COUNT(DISTINCT visitor_id) AS unique_visitors
      FROM public.analytics_events
      WHERE event_name = 'page_view' AND timestamp >= $1 AND timestamp <= $2
      GROUP BY page_path
    ),
    entry_stats AS (
      SELECT
        entry_page,
        COUNT(id) AS total_entries,
        COUNT(CASE WHEN is_bounce = true THEN 1 END) AS bounce_entries,
        COALESCE(AVG(duration_seconds), 0) AS avg_duration
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY entry_page
    )
    SELECT
      p.page_path,
      p.page_title,
      p.page_views,
      p.unique_visitors,
      COALESCE(e.avg_duration, 0) AS avg_time_seconds,
      CASE
        WHEN COALESCE(e.total_entries, 0) > 0
        THEN (e.bounce_entries * 100.0 / e.total_entries)
        ELSE 0
      END AS bounce_rate
    FROM page_stats p
    LEFT JOIN entry_stats e ON p.page_path = e.entry_page
    ORDER BY ${sortBy === 'visitors' ? 'p.unique_visitors' : 'p.page_views'} DESC
    LIMIT 20;
    `,
    [range.startDate.toISOString(), range.endDate.toISOString()]
  );

  return res.rows.map((r) => ({
    page_path: r.page_path,
    page_title: r.page_title || r.page_path,
    page_views: Number(r.page_views || 0),
    unique_visitors: Number(r.unique_visitors || 0),
    avg_time_seconds: Math.round(Number(r.avg_time_seconds || 0)),
    bounce_rate: Math.round(Number(r.bounce_rate || 0) * 10) / 10,
  }));
}

/**
 * Geographic analytics: Top Countries & Cities.
 */
export async function getGeoAnalytics(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<{ countries: GeoItem[]; cities: CityItem[]; totalSessions: number }> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const [countriesRes, citiesRes] = await Promise.all([
    queryAnalytics(
      `
      SELECT
        country,
        COUNT(DISTINCT visitor_id) AS visitors,
        COUNT(id) AS sessions
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY country
      ORDER BY sessions DESC
      LIMIT 15;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
    queryAnalytics(
      `
      SELECT
        city,
        country,
        COUNT(DISTINCT visitor_id) AS visitors,
        COUNT(id) AS sessions
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2 AND city IS NOT NULL AND city <> ''
      GROUP BY city, country
      ORDER BY sessions DESC
      LIMIT 15;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
  ]);

  const totalSessions = countriesRes.rows.reduce((sum, r) => sum + Number(r.sessions || 0), 0);

  const countries: GeoItem[] = countriesRes.rows.map((r) => {
    const count = Number(r.sessions || 0);
    const pct = totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0;
    return {
      country: r.country || 'UNKNOWN',
      country_name: getCountryName(r.country),
      sessions: count,
      visitors: Number(r.visitors || 0),
      percentage: pct,
    };
  });

  const cities: CityItem[] = citiesRes.rows.map((r) => ({
    city: r.city,
    country: r.country || 'UNKNOWN',
    sessions: Number(r.sessions || 0),
    visitors: Number(r.visitors || 0),
  }));

  return { countries, cities, totalSessions };
}

/**
 * Device, Browser, and OS breakdowns.
 */
export async function getDeviceBreakdown(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<{
  devices: DeviceBreakdownItem[];
  browsers: DeviceBreakdownItem[];
  os: DeviceBreakdownItem[];
}> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const [devRes, browserRes, osRes] = await Promise.all([
    queryAnalytics(
      `
      SELECT device_type AS label, COUNT(id) AS count
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY device_type
      ORDER BY count DESC;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
    queryAnalytics(
      `
      SELECT COALESCE(browser, 'Other') AS label, COUNT(id) AS count
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY label
      ORDER BY count DESC
      LIMIT 6;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
    queryAnalytics(
      `
      SELECT COALESCE(operating_system, 'Other') AS label, COUNT(id) AS count
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY label
      ORDER BY count DESC
      LIMIT 6;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
  ]);

  const mapPercentages = (rows: any[]): DeviceBreakdownItem[] => {
    const total = rows.reduce((s, r) => s + Number(r.count || 0), 0);
    return rows.map((r) => ({
      label: r.label,
      count: Number(r.count || 0),
      percentage: total > 0 ? Math.round((Number(r.count || 0) / total) * 1000) / 10 : 0,
    }));
  };

  return {
    devices: mapPercentages(devRes.rows),
    browsers: mapPercentages(browserRes.rows),
    os: mapPercentages(osRes.rows),
  };
}

/**
 * UTM Campaign Performance.
 */
export async function getCampaignAnalytics(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<CampaignItem[]> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const res = await queryAnalytics(
    `
    SELECT
      COALESCE(campaign_name, '(not set)') AS campaign_name,
      COALESCE(campaign_source, '(direct)') AS campaign_source,
      COALESCE(campaign_medium, '(none)') AS campaign_medium,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(id) AS sessions,
      COALESCE(SUM(page_views), 0) AS page_views
    FROM public.analytics_sessions
    WHERE started_at >= $1 AND started_at <= $2
      AND (campaign_name IS NOT NULL OR campaign_source IS NOT NULL OR campaign_medium IS NOT NULL)
    GROUP BY campaign_name, campaign_source, campaign_medium
    ORDER BY sessions DESC
    LIMIT 25;
    `,
    [range.startDate.toISOString(), range.endDate.toISOString()]
  );

  return res.rows.map((r) => ({
    campaign_name: r.campaign_name,
    campaign_source: r.campaign_source,
    campaign_medium: r.campaign_medium,
    visitors: Number(r.visitors || 0),
    sessions: Number(r.sessions || 0),
    page_views: Number(r.page_views || 0),
  }));
}

/**
 * Landing and Exit Pages Breakdown.
 */
export async function getLandingAndExitPages(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): Promise<LandingExitItem> {
  const range = resolveDateRange(rangeKey, customFrom, customTo);

  const [landingRes, exitRes] = await Promise.all([
    queryAnalytics(
      `
      SELECT
        entry_page AS page_path,
        COUNT(id) AS count,
        CASE
          WHEN COUNT(id) > 0 THEN (COUNT(CASE WHEN is_bounce = true THEN 1 END) * 100.0 / COUNT(id))
          ELSE 0
        END AS bounce_rate
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY entry_page
      ORDER BY count DESC
      LIMIT 10;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
    queryAnalytics(
      `
      WITH total_page_exits AS (
        SELECT COUNT(id) AS total FROM public.analytics_sessions WHERE started_at >= $1 AND started_at <= $2
      )
      SELECT
        exit_page AS page_path,
        COUNT(id) AS count,
        CASE
          WHEN (SELECT total FROM total_page_exits) > 0
          THEN (COUNT(id) * 100.0 / (SELECT total FROM total_page_exits))
          ELSE 0
        END AS exit_rate
      FROM public.analytics_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY exit_page
      ORDER BY count DESC
      LIMIT 10;
      `,
      [range.startDate.toISOString(), range.endDate.toISOString()]
    ),
  ]);

  return {
    landingPages: landingRes.rows.map((r) => ({
      page_path: r.page_path,
      count: Number(r.count || 0),
      bounce_rate: Math.round(Number(r.bounce_rate || 0) * 10) / 10,
    })),
    exitPages: exitRes.rows.map((r) => ({
      page_path: r.page_path,
      count: Number(r.count || 0),
      exit_rate: Math.round(Number(r.exit_rate || 0) * 10) / 10,
    })),
  };
}

