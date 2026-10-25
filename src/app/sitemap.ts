import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://frontdesk.arenova.in');

  const siteUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  const routes = ['', '/login', '/register', '/privacy', '/tos'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : route === '/login' || route === '/register' ? 0.8 : 0.5,
  }));
}
