import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://frontdesk.arenova.in');

  const siteUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/admin/', '/onboarding/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
