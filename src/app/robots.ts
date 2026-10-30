// src/app/robots.ts
// Environment-aware Robots.txt configuration for Arenova Frontdesk

import type { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  const isProduction =
    process.env.NODE_ENV === 'production' &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production');

  // Preview, staging, and development environments must never be indexed
  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${SEO_CONFIG.domain}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/contact',
          '/terms-of-service',
          '/privacy-policy',
          '/refund-policy',
          '/metadata.png',
          '/arenova.png',
          '/favicon.ico',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/onboarding/',
          '/login',
          '/register',
          '/*?*', // Prevent tracking query parameters from creating duplicate indexable URLs
        ],
      },
    ],
    sitemap: `${SEO_CONFIG.domain}/sitemap.xml`,
  };
}
