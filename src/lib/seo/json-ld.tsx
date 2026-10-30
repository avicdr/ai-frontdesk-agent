// src/lib/seo/json-ld.tsx
// Production-grade Schema.org JSON-LD Generators and Component for Arenova Frontdesk

import React from 'react';
import { SEO_CONFIG, getCanonicalUrl } from './config';

export function JsonLd({ schema }: { schema: Record<string, any> | Array<Record<string, any>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization Schema for Arenova & Arenova Frontdesk.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SEO_CONFIG.domain}/#organization`,
    name: SEO_CONFIG.legalName,
    alternateName: SEO_CONFIG.brand,
    url: SEO_CONFIG.domain,
    logo: `${SEO_CONFIG.domain}/arenova.png`,
    image: `${SEO_CONFIG.domain}${SEO_CONFIG.ogImage.url}`,
    email: SEO_CONFIG.supportEmail,
    description: SEO_CONFIG.defaultDescription,
    parentOrganization: {
      '@type': 'Organization',
      name: SEO_CONFIG.parentCompany.name,
      url: SEO_CONFIG.parentCompany.url,
      description: SEO_CONFIG.parentCompany.description,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SEO_CONFIG.supportEmail,
        availableLanguage: ['English', 'Hindi'],
      },
    ],
  };
}

/**
 * WebSite Schema with Canonical Search / Site Metadata.
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.domain}/#website`,
    url: SEO_CONFIG.domain,
    name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.defaultDescription,
    publisher: {
      '@id': `${SEO_CONFIG.domain}/#organization`,
    },
    inLanguage: SEO_CONFIG.locale,
  };
}

/**
 * SoftwareApplication Schema for Arenova Frontdesk.
 */
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SEO_CONFIG.domain}/#software`,
    name: SEO_CONFIG.siteName,
    operatingSystem: 'All (Cloud, Web, WhatsApp Business)',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Healthcare Administrative Software',
    url: SEO_CONFIG.domain,
    image: `${SEO_CONFIG.domain}${SEO_CONFIG.ogImage.url}`,
    description: SEO_CONFIG.defaultDescription,
    author: {
      '@id': `${SEO_CONFIG.domain}/#organization`,
    },
    publisher: {
      '@id': `${SEO_CONFIG.domain}/#organization`,
    },
    featureList: [
      '24/7 Automated WhatsApp patient enquiry management',
      'Appointment scheduling with Google Calendar 2-way sync',
      'Clinic procedure guidance and standard fee quotation',
      'Patient safety red-flag emergency detection',
      '1-click human receptionist takeover inbox',
      'Automated post-appointment Google review requests',
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '999',
      highPrice: '2999',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Practice',
          price: '999',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${SEO_CONFIG.domain}/pricing`,
          description: '500 AI patient chats / month, 1 WhatsApp clinic number, 1 location.',
        },
        {
          '@type': 'Offer',
          name: 'Pro Practice',
          price: '1499',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${SEO_CONFIG.domain}/pricing`,
          description: '1,500 AI patient chats / month, priority response, calendar sync.',
        },
        {
          '@type': 'Offer',
          name: 'Growth Clinic',
          price: '2999',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${SEO_CONFIG.domain}/pricing`,
          description: '4,000 AI patient chats / month, multi-provider calendar scheduling.',
        },
      ],
    },
  };
}

/**
 * BreadcrumbList Schema for Sub-pages.
 */
export function getBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SEO_CONFIG.domain,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        item: getCanonicalUrl(item.path),
      })),
    ],
  };
}

/**
 * ContactPage Schema.
 */
export function getContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SEO_CONFIG.domain}/contact#webpage`,
    url: `${SEO_CONFIG.domain}/contact`,
    name: `Contact Support & Clinic Enquiries | ${SEO_CONFIG.siteName}`,
    description: 'Get in touch with Arenova Frontdesk customer care and technical support.',
    isPartOf: {
      '@id': `${SEO_CONFIG.domain}/#website`,
    },
    about: {
      '@id': `${SEO_CONFIG.domain}/#organization`,
    },
  };
}

/**
 * FAQPage Schema for Real Frequently Asked Questions.
 */
export function getFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

