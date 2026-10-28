import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://frontdesk.arenova.in');

  const siteUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  const routes: { route: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { route: '/contact', priority: 0.8, changeFrequency: 'monthly' },
    { route: '/terms-of-service', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/privacy-policy', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/refund-policy', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/login', priority: 0.6, changeFrequency: 'monthly' },
    { route: '/register', priority: 0.8, changeFrequency: 'monthly' },
  ];

  return routes.map((item) => ({
    url: `${siteUrl}${item.route}`,
    lastModified: new Date(),
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
