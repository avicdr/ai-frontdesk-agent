import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arenova Frontdesk | AI WhatsApp Receptionist for Clinics',
    short_name: 'Arenova Frontdesk',
    description: 'Intelligent 24/7 AI-powered WhatsApp Receptionist and appointment automation software for healthcare clinics and practices.',
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
