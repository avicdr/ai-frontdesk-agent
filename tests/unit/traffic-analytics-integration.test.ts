// tests/unit/traffic-analytics-integration.test.ts
// End-to-end integration tests verifying real database ingestion, session duration, and aggregation metrics

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import {
  recordAnalyticsEvent,
  getOverviewMetrics,
  getRealtimeStats,
  getTrafficSources,
  getTopPages,
  getCampaignAnalytics,
} from '@/lib/analytics/service';
import { queryAnalytics } from '@/lib/analytics/db';

describe('End-to-End Analytics Ingestion & Persistence in Database', () => {
  const testVisitorId = `test_vis_${Date.now()}`;
  const testSessionId = `test_ses_${Date.now()}`;

  it('1. should record initial page-view event and initialize visitor and session in database', async () => {
    const headers = new Headers();
    headers.set(
      'user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36'
    );
    headers.set('x-vercel-ip-country', 'IN');
    headers.set('x-vercel-ip-city', 'Bangalore');

    const result = await recordAnalyticsEvent(
      {
        visitor_id: testVisitorId,
        session_id: testSessionId,
        event_name: 'page_view',
        page_path: '/',
        page_title: 'Arenova | AI WhatsApp Receptionist',
        referrer: 'https://www.google.com/search?q=arenova',
        utm: {
          source: 'google',
          medium: 'organic',
          campaign: 'seo_brand',
        },
        device_type: 'desktop',
        browser: 'Chrome',
        operating_system: 'Windows',
        is_new_session: true,
      },
      headers
    );

    assert.equal(result.success, true);
    assert.ok(result.eventId);

    // Verify row in analytics_visitors
    const vis = await queryAnalytics(`SELECT * FROM public.analytics_visitors WHERE id = $1`, [
      testVisitorId,
    ]);
    assert.equal(vis.rows.length, 1);
    assert.equal(vis.rows[0].country, 'IN');
    assert.equal(vis.rows[0].city, 'Bangalore');
    assert.equal(vis.rows[0].total_sessions, 1);

    // Verify row in analytics_sessions
    const sess = await queryAnalytics(`SELECT * FROM public.analytics_sessions WHERE id = $1`, [
      testSessionId,
    ]);
    assert.equal(sess.rows.length, 1);
    assert.equal(sess.rows[0].entry_page, '/');
    assert.equal(sess.rows[0].exit_page, '/');
    assert.equal(sess.rows[0].traffic_source, 'organic_search');
    assert.equal(sess.rows[0].campaign_source, 'google');
    assert.equal(sess.rows[0].campaign_name, 'seo_brand');
    assert.equal(sess.rows[0].page_views, 1);
  });

  it('2. should record subsequent page-view in the same session without multiplying visitor count', async () => {
    const headers = new Headers();
    headers.set('x-vercel-ip-country', 'IN');

    const result = await recordAnalyticsEvent(
      {
        visitor_id: testVisitorId,
        session_id: testSessionId,
        event_name: 'page_view',
        page_path: '/pricing',
        page_title: 'Pricing & Plans | Arenova',
        referrer: 'https://frontdesk.arenova.in/',
      },
      headers
    );

    assert.equal(result.success, true);

    const sess = await queryAnalytics(`SELECT * FROM public.analytics_sessions WHERE id = $1`, [
      testSessionId,
    ]);
    assert.equal(sess.rows[0].entry_page, '/');
    assert.equal(sess.rows[0].exit_page, '/pricing');
    assert.equal(sess.rows[0].page_views, 2);
    // Since page_views > 1, session is no longer a bounce!
    assert.equal(sess.rows[0].is_bounce, false);
  });

  it('3. should track custom developer events and qualifying engagement', async () => {
    const headers = new Headers();

    const result = await recordAnalyticsEvent(
      {
        visitor_id: testVisitorId,
        session_id: testSessionId,
        event_name: 'contact_form_submitted',
        page_path: '/contact',
        event_properties: {
          form: 'contact',
          source: 'homepage',
        },
      },
      headers
    );

    assert.equal(result.success, true);

    const evt = await queryAnalytics(
      `SELECT * FROM public.analytics_events WHERE id = $1`,
      [result.eventId]
    );
    assert.equal(evt.rows[0].event_name, 'contact_form_submitted');
    assert.equal(evt.rows[0].event_properties.form, 'contact');
  });

  it('4. should retrieve real-time activity including the active session', async () => {
    const realtime = await getRealtimeStats();
    assert.ok(typeof realtime.activeVisitorsNow === 'number');
    assert.ok(realtime.activeVisitorsNow >= 1);
    assert.ok(realtime.activeVisitorsLast5m >= 1);
    assert.ok(realtime.recentEvents.length >= 1);
  });

  it('5. should aggregate overview metrics without errors', async () => {
    const metrics = await getOverviewMetrics('today');
    assert.ok(metrics.totalVisitors.current >= 1);
    assert.ok(metrics.totalPageViews.current >= 2);
    assert.ok(typeof metrics.bounceRate.current === 'number');
  });

  it('6. should retrieve traffic source breakdowns including organic search', async () => {
    const sources = await getTrafficSources('today');
    assert.ok(sources.sources.length >= 1);
    const orgSearch = sources.sources.find((s) => s.source === 'organic_search');
    assert.ok(orgSearch, 'Organic search traffic was not found in breakdown');
    assert.ok(orgSearch.sessions >= 1);
  });

  it('7. should retrieve top pages with accurate page view counts', async () => {
    const topPages = await getTopPages('today');
    assert.ok(topPages.length >= 1);
    const home = topPages.find((p) => p.page_path === '/');
    assert.ok(home, 'Home page path / was not found in top pages');
    assert.ok(home.page_views >= 1);
  });

  it('8. should retrieve campaign performance including seo_brand', async () => {
    const campaigns = await getCampaignAnalytics('today');
    assert.ok(campaigns.length >= 1);
    const match = campaigns.find((c) => c.campaign_name === 'seo_brand');
    assert.ok(match, 'Campaign seo_brand was not aggregated');
    assert.equal(match.campaign_source, 'google');
  });

  it('9. clean up test data', async () => {
    // Delete test rows
    await queryAnalytics(`DELETE FROM public.analytics_events WHERE visitor_id = $1`, [
      testVisitorId,
    ]);
    await queryAnalytics(`DELETE FROM public.analytics_sessions WHERE visitor_id = $1`, [
      testVisitorId,
    ]);
    await queryAnalytics(`DELETE FROM public.analytics_visitors WHERE id = $1`, [
      testVisitorId,
    ]);
  });
});

