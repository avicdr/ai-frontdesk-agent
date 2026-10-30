// src/lib/seo/config.ts
// Centralized SEO Configuration for Arenova Frontdesk

export const SEO_CONFIG = {
  domain: 'https://frontdesk.arenova.in',
  siteName: 'Arenova Frontdesk',
  legalName: 'Arenova (Arenova Technologies)',
  brand: 'Arenova',
  parentCompany: {
    name: 'Arenova',
    url: 'https://arenova.in',
    description: 'AI Automation & Marketing Agency',
  },
  titleTemplate: '%s | Arenova Frontdesk',
  defaultTitle: 'Arenova Frontdesk | AI WhatsApp Receptionist Software for Clinics',
  defaultDescription:
    'Automate clinic patient enquiries, share practice information, and coordinate appointment requests 24/7 with Arenova Frontdesk — the AI-powered WhatsApp receptionist software for clinics and healthcare practices.',
  supportEmail: 'support@arenova.in',
  locale: 'en_US',
  currency: 'INR',
  twitterHandle: '@arenova_ai',
  ogImage: {
    url: '/metadata.png',
    width: 2912,
    height: 1440,
    alt: 'Arenova Frontdesk — AI WhatsApp Receptionist Software for Clinics',
    type: 'image/png',
  },
  keywords: [
    'AI WhatsApp receptionist for clinics',
    'clinic communication automation',
    'patient enquiry management',
    'dental clinic WhatsApp receptionist',
    'automated appointment booking WhatsApp',
    'clinic front desk automation',
    'healthcare WhatsApp chatbot',
    'Google Calendar appointment coordination',
    'Arenova Frontdesk',
  ],
};

/**
 * Returns the production canonical URL for a given route path.
 * Guarantees HTTPS, no trailing slash (except root), and clean path.
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath === '/' || cleanPath === '') {
    return SEO_CONFIG.domain;
  }
  return `${SEO_CONFIG.domain}${cleanPath.replace(/\/$/, '')}`;
}

