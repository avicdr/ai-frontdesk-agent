// tests/unit/seo-validator.test.ts
// Automated Technical SEO Validator for Arenova Frontdesk

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SEO_CONFIG, getCanonicalUrl } from '@/lib/seo/config';
import { createPageMetadata, createPrivatePageMetadata } from '@/lib/seo/metadata';
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getSoftwareApplicationSchema,
  getBreadcrumbSchema,
  getContactPageSchema,
  getFaqSchema,
} from '@/lib/seo/json-ld';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import nextConfig from '../../next.config';

describe('1. Domain Identification & Canonical URL Rules', () => {
  it('should enforce the official production domain https://frontdesk.arenova.in', () => {
    assert.equal(SEO_CONFIG.domain, 'https://frontdesk.arenova.in');
    assert.equal(SEO_CONFIG.brand, 'Arenova');
    assert.equal(SEO_CONFIG.siteName, 'Arenova Frontdesk');
    assert.equal(SEO_CONFIG.parentCompany.url, 'https://arenova.in');
  });

  it('should generate standardized HTTPS absolute canonical URLs without trailing slashes', () => {
    assert.equal(getCanonicalUrl('/'), 'https://frontdesk.arenova.in');
    assert.equal(getCanonicalUrl(''), 'https://frontdesk.arenova.in');
    assert.equal(getCanonicalUrl('/pricing'), 'https://frontdesk.arenova.in/pricing');
    assert.equal(getCanonicalUrl('/pricing/'), 'https://frontdesk.arenova.in/pricing');
    assert.equal(getCanonicalUrl('contact'), 'https://frontdesk.arenova.in/contact');
    assert.equal(getCanonicalUrl('/terms-of-service'), 'https://frontdesk.arenova.in/terms-of-service');
  });
});

describe('2. Metadata Engine & Dynamic Page Generation', () => {
  it('should generate complete OpenGraph, Twitter, and indexable robots directives for public pages', () => {
    const meta = createPageMetadata({
      title: 'Pricing & Subscription Plans (INR) | Arenova Frontdesk',
      description: 'Transparent B2B subscription pricing for Arenova Frontdesk clinic software.',
      path: '/pricing',
    });

    assert.equal(meta.title, 'Pricing & Subscription Plans (INR) | Arenova Frontdesk');
    assert.equal(meta.alternates?.canonical, 'https://frontdesk.arenova.in/pricing');
    assert.equal(meta.openGraph?.url, 'https://frontdesk.arenova.in/pricing');
    assert.equal(meta.openGraph?.siteName, 'Arenova Frontdesk');
    assert.equal((meta.twitter as Record<string, unknown>)?.card, 'summary_large_image');
    assert.equal(meta.twitter?.creator, '@arenova_ai');

    // Robots must be indexable for public pages
    assert.equal((meta.robots as Record<string, unknown>)?.index, true);
    assert.equal((meta.robots as Record<string, unknown>)?.follow, true);
  });

  it('should enforce strict noindex and nofollow directives on private and auth pages', () => {
    const loginMeta = createPrivatePageMetadata('Clinic Sign In');
    assert.equal((loginMeta.robots as Record<string, unknown>)?.index, false);
    assert.equal((loginMeta.robots as Record<string, unknown>)?.follow, false);

    const adminMeta = createPrivatePageMetadata('Super Admin');
    assert.equal((adminMeta.robots as Record<string, unknown>)?.index, false);
    assert.equal((adminMeta.robots as Record<string, unknown>)?.follow, false);
  });
});

describe('3. XML Sitemap Hygiene & Crawlability Policy', () => {
  const generatedSitemap = sitemap();

  it('should include all primary public canonical routes', () => {
    const urls = generatedSitemap.map((item) => item.url);

    assert.ok(urls.includes('https://frontdesk.arenova.in'), 'Homepage missing from sitemap');
    assert.ok(urls.includes('https://frontdesk.arenova.in/pricing'), 'Pricing missing from sitemap');
    assert.ok(urls.includes('https://frontdesk.arenova.in/contact'), 'Contact missing from sitemap');
    assert.ok(urls.includes('https://frontdesk.arenova.in/terms-of-service'), 'Terms missing from sitemap');
    assert.ok(urls.includes('https://frontdesk.arenova.in/privacy-policy'), 'Privacy missing from sitemap');
    assert.ok(urls.includes('https://frontdesk.arenova.in/refund-policy'), 'Refund policy missing from sitemap');
  });

  it('should strictly exclude private, dashboard, admin, and authentication routes', () => {
    const urls = generatedSitemap.map((item) => item.url);

    for (const url of urls) {
      assert.ok(!url.includes('/login'), `Auth route ${url} must not be in sitemap`);
      assert.ok(!url.includes('/register'), `Auth route ${url} must not be in sitemap`);
      assert.ok(!url.includes('/dashboard'), `Private route ${url} must not be in sitemap`);
      assert.ok(!url.includes('/admin'), `Admin route ${url} must not be in sitemap`);
      assert.ok(!url.includes('/api'), `API route ${url} must not be in sitemap`);
      assert.ok(!url.includes('/onboarding'), `Onboarding wizard ${url} must not be in sitemap`);
    }
  });

  it('should exclude duplicate redirect aliases from sitemap', () => {
    const urls = generatedSitemap.map((item) => item.url);

    assert.ok(!urls.includes('https://frontdesk.arenova.in/terms'), 'Redirect alias /terms in sitemap');
    assert.ok(!urls.includes('https://frontdesk.arenova.in/tos'), 'Redirect alias /tos in sitemap');
    assert.ok(!urls.includes('https://frontdesk.arenova.in/privacy'), 'Redirect alias /privacy in sitemap');
    assert.ok(!urls.includes('https://frontdesk.arenova.in/cancellation-policy'), 'Redirect alias /cancellation-policy in sitemap');
  });

  it('should have valid Date timestamps and priority rankings', () => {
    for (const item of generatedSitemap) {
      assert.ok(item.lastModified instanceof Date, `Invalid timestamp on ${item.url}`);
      assert.ok(typeof item.priority === 'number' && item.priority >= 0.1 && item.priority <= 1.0);
    }
  });
});

describe('4. Robots.txt Directives & Environment Defense', () => {
  it('should allow public pages and restrict private and query parameter URLs', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;

    const r = robots();
    assert.equal(r.sitemap, 'https://frontdesk.arenova.in/sitemap.xml');

    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    const disallow = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    assert.ok(disallow.includes('/api/'));
    assert.ok(disallow.includes('/dashboard/'));
    assert.ok(disallow.includes('/admin/'));
    assert.ok(disallow.includes('/onboarding/'));
    assert.ok(disallow.includes('/login'));
    assert.ok(disallow.includes('/register'));
    assert.ok(disallow.includes('/*?*')); // blocks tracking query params from duplicate indexing
  });

  it('should block the entire site in non-production environments', () => {
    process.env.VERCEL_ENV = 'preview';
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    assert.equal(rules?.disallow, '/');
    delete process.env.VERCEL_ENV;
  });
});

describe('5. Schema.org JSON-LD Structured Data Validation', () => {
  it('should generate valid Organization schema linked to parent brand Arenova', () => {
    const org = getOrganizationSchema();
    assert.equal(org['@context'], 'https://schema.org');
    assert.equal(org['@type'], 'Organization');
    assert.equal(org.url, 'https://frontdesk.arenova.in');
    assert.equal(org.name, 'Arenova (Arenova Technologies)');
    assert.equal(org.parentOrganization?.name, 'Arenova');
    assert.equal(org.parentOrganization?.url, 'https://arenova.in');
  });

  it('should generate valid WebSite schema with proper language and publisher', () => {
    const ws = getWebSiteSchema();
    assert.equal(ws['@context'], 'https://schema.org');
    assert.equal(ws['@type'], 'WebSite');
    assert.equal(ws.url, 'https://frontdesk.arenova.in');
    assert.equal(ws.inLanguage, 'en_US');
  });

  it('should generate valid SoftwareApplication schema with actual INR pricing tiers', () => {
    const app = getSoftwareApplicationSchema();
    assert.equal(app['@context'], 'https://schema.org');
    assert.equal(app['@type'], 'SoftwareApplication');
    assert.equal(app.name, 'Arenova Frontdesk');
    assert.equal(app.applicationCategory, 'BusinessApplication');

    const offers = app.offers;
    assert.equal(offers['@type'], 'AggregateOffer');
    assert.equal(offers.priceCurrency, 'INR');
    assert.equal(offers.lowPrice, '999');
    assert.equal(offers.highPrice, '2999');
    assert.equal(offers.offers.length, 3);
  });

  it('should generate sequential BreadcrumbList schema', () => {
    const breadcrumb = getBreadcrumbSchema([
      { name: 'Pricing Plans', path: '/pricing' },
    ]);
    assert.equal(breadcrumb['@context'], 'https://schema.org');
    assert.equal(breadcrumb['@type'], 'BreadcrumbList');
    assert.equal(breadcrumb.itemListElement.length, 2);
    assert.equal(breadcrumb.itemListElement[0].position, 1);
    assert.equal(breadcrumb.itemListElement[0].name, 'Home');
    assert.equal(breadcrumb.itemListElement[1].position, 2);
    assert.equal(breadcrumb.itemListElement[1].name, 'Pricing Plans');
    assert.equal(breadcrumb.itemListElement[1].item, 'https://frontdesk.arenova.in/pricing');
  });

  it('should generate FAQPage schema with valid questions and answers', () => {
    const faqs = [
      { question: 'What is Arenova Frontdesk?', answer: 'AI receptionist software for clinics.' },
    ];
    const faqSchema = getFaqSchema(faqs);
    assert.equal(faqSchema['@context'], 'https://schema.org');
    assert.equal(faqSchema['@type'], 'FAQPage');
    assert.equal(faqSchema.mainEntity.length, 1);
    assert.equal(faqSchema.mainEntity[0].name, 'What is Arenova Frontdesk?');
  });

  it('should generate ContactPage schema with support endpoint and organization reference', () => {
    const contactSchema = getContactPageSchema();
    assert.equal(contactSchema['@context'], 'https://schema.org');
    assert.equal(contactSchema['@type'], 'ContactPage');
    assert.equal(contactSchema.url, 'https://frontdesk.arenova.in/contact');
  });
});

describe('6. 301 Permanent Redirects Integrity', () => {
  it('should configure 301 permanent redirects for legal alias routes', async () => {
    if (typeof nextConfig.redirects === 'function') {
      const redirects = await nextConfig.redirects();
      const termsRedirect = redirects.find((r) => r.source === '/terms');
      const tosRedirect = redirects.find((r) => r.source === '/tos');
      const privacyRedirect = redirects.find((r) => r.source === '/privacy');
      const cancelRedirect = redirects.find((r) => r.source === '/cancellation-policy');

      assert.ok(termsRedirect, 'Missing /terms redirect');
      assert.equal(termsRedirect.destination, '/terms-of-service');
      assert.equal(termsRedirect.permanent, true);

      assert.ok(tosRedirect, 'Missing /tos redirect');
      assert.equal(tosRedirect.destination, '/terms-of-service');
      assert.equal(tosRedirect.permanent, true);

      assert.ok(privacyRedirect, 'Missing /privacy redirect');
      assert.equal(privacyRedirect.destination, '/privacy-policy');
      assert.equal(privacyRedirect.permanent, true);

      assert.ok(cancelRedirect, 'Missing /cancellation-policy redirect');
      assert.equal(cancelRedirect.destination, '/refund-policy');
      assert.equal(cancelRedirect.permanent, true);
    }
  });
});

