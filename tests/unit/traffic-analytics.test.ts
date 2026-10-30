// tests/unit/traffic-analytics.test.ts
// Automated unit tests for traffic source classification, user agent parsing, date arithmetic, and analytics logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTrafficSource,
  parseUserAgent,
  extractDomain,
  getCountryName,
} from '@/lib/analytics/classifier';
import {
  resolveDateRange,
  calculateComparison,
  formatDuration,
} from '@/lib/analytics/date-utils';

describe('1. Traffic Source Classification Engine', () => {
  it('should identify Direct traffic when referrer is empty, null, or same origin', () => {
    assert.equal(classifyTrafficSource({ referrer: null }).source, 'direct');
    assert.equal(classifyTrafficSource({ referrer: '' }).source, 'direct');
    assert.equal(
      classifyTrafficSource({
        referrer: 'https://frontdesk.arenova.in/about',
        currentHost: 'frontdesk.arenova.in',
      }).source,
      'direct'
    );
    assert.equal(
      classifyTrafficSource({
        referrer: 'http://localhost:3000/contact',
        currentHost: 'localhost:3000',
      }).source,
      'direct'
    );
  });

  it('should identify Organic Search referrers correctly across global search engines', () => {
    const engines = [
      'https://www.google.com/search?q=dental+receptionist',
      'https://www.google.co.in/',
      'https://www.google.co.uk/url?sa=t',
      'https://www.bing.com/search?q=ai+clinic',
      'https://duckduckgo.com/?q=front+desk',
      'https://search.yahoo.com/search?p=arenova',
      'https://yandex.com/search/?text=arenova',
      'https://ecosia.org/search?q=dentist',
    ];

    for (const ref of engines) {
      const res = classifyTrafficSource({ referrer: ref });
      assert.equal(
        res.source,
        'organic_search',
        `Failed to classify ${ref} as organic_search`
      );
    }
  });

  it('should identify Social Media traffic from known social referrers and UTM mediums', () => {
    const socials = [
      'https://l.instagram.com/',
      'https://www.facebook.com/',
      'https://m.facebook.com/story',
      'https://t.co/xyz123',
      'https://twitter.com/arenova_ai',
      'https://x.com/arenova_ai',
      'https://www.linkedin.com/feed/',
      'https://lnkd.in/test',
      'https://www.reddit.com/r/dentistry',
      'https://web.whatsapp.com/',
      'https://api.whatsapp.com/send',
      'https://www.youtube.com/watch?v=123',
    ];

    for (const ref of socials) {
      const res = classifyTrafficSource({ referrer: ref });
      assert.equal(res.source, 'social', `Failed to classify ${ref} as social`);
    }

    // Via UTM medium
    const utmSocial = classifyTrafficSource({
      referrer: 'https://randomsite.org',
      utm: { medium: 'social', source: 'influencer' },
    });
    assert.equal(utmSocial.source, 'social');
  });

  it('should prioritize Paid Search / CPC traffic when UTM medium indicates advertising', () => {
    const paidMediums = ['cpc', 'ppc', 'paid', 'paidsearch', 'paidsocial', 'cpm', 'display'];

    for (const med of paidMediums) {
      const res = classifyTrafficSource({
        referrer: 'https://www.google.com/',
        utm: { source: 'google', medium: med, campaign: 'winter_launch' },
      });
      assert.equal(res.source, 'paid_search', `Failed for medium ${med}`);
    }
  });

  it('should identify Email campaigns via UTM medium or webmail referrers', () => {
    const utmEmail = classifyTrafficSource({
      utm: { source: 'newsletter', medium: 'email', campaign: 'october_digest' },
    });
    assert.equal(utmEmail.source, 'email');

    const mailRef = classifyTrafficSource({
      referrer: 'https://mail.google.com/mail/u/0/#inbox',
    });
    assert.equal(mailRef.source, 'email');
  });

  it('should classify non-search, non-social external domains as Referral', () => {
    const res = classifyTrafficSource({
      referrer: 'https://techcrunch.com/2026/10/ai-receptionists',
    });
    assert.equal(res.source, 'referral');
    assert.equal(res.referringDomain, 'techcrunch.com');
  });
});

describe('2. User Agent & Device Intelligence Parser', () => {
  it('should detect Desktop Windows 11 Chrome accurately', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    const parsed = parseUserAgent(ua);
    assert.equal(parsed.deviceType, 'desktop');
    assert.equal(parsed.browser, 'Chrome');
    assert.equal(parsed.os, 'Windows 10/11');
    assert.equal(parsed.isBot, false);
  });

  it('should detect Mobile iPhone Safari accurately', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const parsed = parseUserAgent(ua);
    assert.equal(parsed.deviceType, 'mobile');
    assert.equal(parsed.browser, 'Safari');
    assert.equal(parsed.os, 'iOS');
    assert.equal(parsed.isBot, false);
  });

  it('should detect iPad / Tablet correctly', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
    const parsed = parseUserAgent(ua);
    assert.equal(parsed.deviceType, 'tablet');
  });

  it('should identify web search bots, scrapers, and headless crawlers as bots', () => {
    const bots = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Twitterbot/1.0',
      'curl/8.4.0',
      'python-requests/2.31.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0',
    ];

    for (const b of bots) {
      const parsed = parseUserAgent(b);
      assert.equal(parsed.isBot, true, `Bot ${b} was not flagged as bot`);
    }
  });
});

describe('3. Analytics Date Arithmetic & Comparison Formulas', () => {
  it('should accurately resolve today vs yesterday with identical hourly progression', () => {
    const range = resolveDateRange('today');
    assert.ok(range.startDate < range.endDate);
    assert.ok(range.prevStartDate < range.prevEndDate);
    assert.equal(range.bucketType, 'hour');
  });

  it('should resolve last 7 days and previous 7-day baseline correctly', () => {
    const range = resolveDateRange('last7d');
    assert.equal(range.bucketType, 'day');
    const currDuration = range.endDate.getTime() - range.startDate.getTime();
    const prevDuration = range.prevEndDate.getTime() - range.prevStartDate.getTime();
    // Durations should match within a fraction of an hour
    assert.ok(Math.abs(currDuration - prevDuration) < 1000 * 60 * 60);
  });

  it('should calculate accurate percentage changes without fabricated stats when baseline is missing', () => {
    // 150 vs 100 -> +50%
    const up = calculateComparison(150, 100);
    assert.equal(up.changePercent, 50);
    assert.equal(up.trend, 'up');

    // 70 vs 100 -> -30%
    const down = calculateComparison(70, 100);
    assert.equal(down.changePercent, -30);
    assert.equal(down.trend, 'down');

    // Baseline 0 with current > 0 -> +100%
    const fromZero = calculateComparison(25, 0);
    assert.equal(fromZero.changePercent, 100);
    assert.equal(fromZero.trend, 'up');

    // No baseline history -> no_data (prevents fake percentages)
    const noHistory = calculateComparison(120, null);
    assert.equal(noHistory.changePercent, null);
    assert.equal(noHistory.trend, 'no_data');
  });

  it('should format durations cleanly into minutes and seconds', () => {
    assert.equal(formatDuration(0), '0s');
    assert.equal(formatDuration(45), '45s');
    assert.equal(formatDuration(60), '1m 0s');
    assert.equal(formatDuration(134), '2m 14s');
  });
});

describe('4. Privacy & Geolocation Mapping', () => {
  it('should resolve ISO-3166 country codes to proper country names', () => {
    assert.equal(getCountryName('IN'), 'India');
    assert.equal(getCountryName('US'), 'United States');
    assert.equal(getCountryName('GB'), 'United Kingdom');
    assert.equal(getCountryName('UNKNOWN'), 'Unknown Location');
  });

  it('should extract domains cleanly without port or protocol leakage', () => {
    assert.equal(extractDomain('https://www.google.com/search?q=test'), 'google.com');
    assert.equal(extractDomain('http://subdomain.domain.co.uk:8080/path'), 'subdomain.domain.co.uk');
    assert.equal(extractDomain(null), null);
    assert.equal(extractDomain(''), null);
  });
});

