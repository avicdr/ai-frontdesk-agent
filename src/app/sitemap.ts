// src/app/sitemap.ts
// Production XML Sitemap for Arenova Frontdesk

import type { MetadataRoute } from 'next';
import { SEO_CONFIG, getCanonicalUrl } from '@/lib/seo/config';

export default function sitemap(): MetadataRoute.Sitemap {
  // Only canonical, publicly indexable marketing and policy URLs
  // Strictly excludes private application routes (/dashboard, /admin, /onboarding)
  // and authentication pages (/login, /register)
  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    lastModified: string;
  }> = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'weekly',
      lastModified: '2026-10-30T00:00:00.000Z',
    },
    {
      path: '/pricing',
      priority: 0.9,
      changeFrequency: 'weekly',
      lastModified: '2026-10-28T00:00:00.000Z',
    },
    {
      path: '/contact',
      priority: 0.8,
      changeFrequency: 'monthly',
      lastModified: '2026-10-27T00:00:00.000Z',
    },
    {
      path: '/terms-of-service',
      priority: 0.5,
      changeFrequency: 'monthly',
      lastModified: '2026-10-27T00:00:00.000Z',
    },
    {
      path: '/privacy-policy',
      priority: 0.5,
      changeFrequency: 'monthly',
      lastModified: '2026-10-27T00:00:00.000Z',
    },
    {
      path: '/refund-policy',
      priority: 0.5,
      changeFrequency: 'monthly',
      lastModified: '2026-10-27T00:00:00.000Z',
    },
  ];

  return staticRoutes.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
