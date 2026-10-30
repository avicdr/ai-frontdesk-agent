// src/lib/analytics/types.ts
// Type definitions for first-party website traffic analytics

export type TrafficSource =
  | 'direct'
  | 'organic_search'
  | 'paid_search'
  | 'social'
  | 'referral'
  | 'email'
  | 'other';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export type DateRangeKey =
  | 'today'
  | 'yesterday'
  | 'last7d'
  | 'last30d'
  | 'last90d'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface UtmParameters {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
}

export interface AnalyticsVisitor {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  total_sessions: number;
  total_page_views: number;
  device_type: DeviceType;
  browser?: string | null;
  operating_system?: string | null;
  country: string;
  region?: string | null;
  city?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSession {
  id: string;
  visitor_id: string;
  entry_page: string;
  exit_page: string;
  referrer?: string | null;
  referring_domain?: string | null;
  traffic_source: TrafficSource;
  campaign_source?: string | null;
  campaign_medium?: string | null;
  campaign_name?: string | null;
  campaign_term?: string | null;
  campaign_content?: string | null;
  device_type: DeviceType;
  browser?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  screen_resolution?: string | null;
  country: string;
  region?: string | null;
  city?: string | null;
  started_at: string;
  last_activity_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  page_views: number;
  is_bounce: boolean;
  has_qualified_engagement: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  visitor_id: string;
  session_id: string;
  page_path: string;
  page_title?: string | null;
  referrer?: string | null;
  event_properties: Record<string, any>;
  device_type: DeviceType;
  browser?: string | null;
  operating_system?: string | null;
  country: string;
  region?: string | null;
  city?: string | null;
  timestamp: string;
}

export interface CollectPayload {
  visitor_id: string;
  session_id: string;
  event_name: string;
  page_path: string;
  page_title?: string;
  referrer?: string;
  utm?: UtmParameters;
  screen_resolution?: string;
  viewport_dimension?: string;
  device_type?: DeviceType;
  browser?: string;
  browser_version?: string;
  operating_system?: string;
  event_properties?: Record<string, any>;
  is_new_session?: boolean;
  timestamp?: string;
}

export interface MetricComparison {
  current: number;
  previous: number | null;
  changePercent: number | null;
  trend: 'up' | 'down' | 'neutral' | 'no_data';
}

export interface OverviewMetrics {
  totalVisitors: MetricComparison;
  uniqueVisitors: MetricComparison;
  totalPageViews: MetricComparison;
  totalSessions: MetricComparison;
  avgSessionDuration: MetricComparison; // in seconds
  bounceRate: MetricComparison; // 0-100 percentage
  engagementRate: MetricComparison; // 0-100 percentage
  period: {
    start: string;
    end: string;
    previousStart: string;
    previousEnd: string;
    rangeKey: DateRangeKey;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  label: string;
  visitors: number;
  uniqueVisitors: number;
  pageViews: number;
  sessions: number;
}

export interface RealtimeData {
  activeVisitorsNow: number;
  activeVisitorsLast5m: number;
  topActivePages: Array<{
    page_path: string;
    page_title: string;
    active_count: number;
  }>;
  recentEvents: Array<{
    id: string;
    event_name: string;
    page_path: string;
    page_title: string;
    country: string;
    device_type: string;
    timestamp: string;
    relative_time: string;
  }>;
  timestamp: string;
}

export interface TrafficSourceItem {
  source: TrafficSource;
  label: string;
  visitors: number;
  sessions: number;
  percentage: number;
}

export interface TopPageItem {
  page_path: string;
  page_title: string;
  page_views: number;
  unique_visitors: number;
  avg_time_seconds: number;
  bounce_rate: number;
}

export interface GeoItem {
  country: string;
  country_name: string;
  sessions: number;
  visitors: number;
  percentage: number;
}

export interface CityItem {
  city: string;
  country: string;
  sessions: number;
  visitors: number;
}

export interface DeviceBreakdownItem {
  label: string;
  count: number;
  percentage: number;
}

export interface CampaignItem {
  campaign_name: string;
  campaign_source: string;
  campaign_medium: string;
  visitors: number;
  sessions: number;
  page_views: number;
}

export interface LandingExitItem {
  landingPages: Array<{
    page_path: string;
    count: number;
    bounce_rate: number;
  }>;
  exitPages: Array<{
    page_path: string;
    count: number;
    exit_rate: number;
  }>;
}

