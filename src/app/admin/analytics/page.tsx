// src/app/admin/analytics/page.tsx
// Platform Super-Admin Traffic Analytics & Telemetry Page

import { requireSuperAdmin } from '@/lib/supabase/server';
import {
  getOverviewMetrics,
  getTimeSeries,
  getRealtimeStats,
  getTrafficSources,
  getTopPages,
  getGeoAnalytics,
  getDeviceBreakdown,
  getCampaignAnalytics,
  getLandingAndExitPages,
} from '@/lib/analytics/service';
import { AnalyticsDashboardClient } from '@/components/admin/analytics/AnalyticsDashboardClient';

export const metadata = {
  title: 'Traffic Analytics & Visitor Telemetry | Arenova Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requireSuperAdmin();

  // Load baseline datasets server-side for instant initial render
  const [
    initialOverview,
    initialTimeSeries,
    initialRealtime,
    initialSources,
    initialPages,
    initialGeo,
    initialDevices,
    initialCampaigns,
    initialLandingExit,
  ] = await Promise.all([
    getOverviewMetrics('last7d'),
    getTimeSeries('last7d'),
    getRealtimeStats(),
    getTrafficSources('last7d'),
    getTopPages('last7d', undefined, undefined, 'views'),
    getGeoAnalytics('last7d'),
    getDeviceBreakdown('last7d'),
    getCampaignAnalytics('last7d'),
    getLandingAndExitPages('last7d'),
  ]);

  return (
    <AnalyticsDashboardClient
      initialOverview={initialOverview}
      initialTimeSeries={initialTimeSeries}
      initialRealtime={initialRealtime}
      initialSources={initialSources}
      initialPages={initialPages}
      initialGeo={initialGeo}
      initialDevices={initialDevices}
      initialCampaigns={initialCampaigns}
      initialLandingExit={initialLandingExit}
    />
  );
}

