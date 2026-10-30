// src/lib/seo/metadata.ts
// Standardized Metadata Generator for Arenova Frontdesk pages

import type { Metadata } from 'next';
import { SEO_CONFIG, getCanonicalUrl } from './config';

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  keywords?: string[];
  ogImage?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
}

export function createPageMetadata({
  title,
  description,
  path,
  noindex = false,
  keywords,
  ogImage,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = getCanonicalUrl(path);
  const imageUrl = ogImage?.url
    ? (ogImage.url.startsWith('http') ? ogImage.url : `${SEO_CONFIG.domain}${ogImage.url}`)
    : `${SEO_CONFIG.domain}${SEO_CONFIG.ogImage.url}`;

  const imageWidth = ogImage?.width || SEO_CONFIG.ogImage.width;
  const imageHeight = ogImage?.height || SEO_CONFIG.ogImage.height;
  const imageAlt = ogImage?.alt || title;

  return {
    title,
    description,
    keywords: keywords || SEO_CONFIG.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: SEO_CONFIG.twitterHandle,
      images: [imageUrl],
    },
  };
}

/**
 * Metadata preset for protected or private pages that must not be indexed.
 */
export function createPrivatePageMetadata(title: string): Metadata {
  return {
    title: `${title} | ${SEO_CONFIG.siteName}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

