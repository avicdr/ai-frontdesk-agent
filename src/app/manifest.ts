import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arenova AI Front Desk',
    short_name: 'AI Front Desk',
    description: 'Transform the way your business works. Intelligent 24/7 AI Receptionist for Clinics & Practices.',
    start_url: '/',
    display: 'standalone',
    background_color: '#111110',
    theme_color: '#111110',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/arenova.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/arenova.png',
        sizes: '192x192 512x512',
        type: 'image/png',
      },
      {
        src: '/metadata.png',
        sizes: '2912x1440',
        type: 'image/png',
      },
    ],
  };
}
