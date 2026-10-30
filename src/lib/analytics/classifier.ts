// src/lib/analytics/classifier.ts
// Intelligent classification of traffic sources, user agents, devices, and privacy-preserving geography

import { TrafficSource, DeviceType, UtmParameters } from './types';

export const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  AE: 'United Arab Emirates',
  SG: 'Singapore',
  NL: 'Netherlands',
  BR: 'Brazil',
  JP: 'Japan',
  SA: 'Saudi Arabia',
  ZA: 'South Africa',
  NZ: 'New Zealand',
  IE: 'Ireland',
  SE: 'Sweden',
  CH: 'Switzerland',
  IT: 'Italy',
  ES: 'Spain',
  UNKNOWN: 'Unknown Location',
};

export function getCountryName(code: string): string {
  const normalized = (code || '').toUpperCase().trim();
  return COUNTRY_NAMES[normalized] || normalized || 'Unknown Location';
}

/**
 * Extracts a clean domain from a referrer URL.
 * Removes protocols, ports, paths, and www prefixes.
 */
export function extractDomain(referrer?: string | null): string | null {
  if (!referrer || typeof referrer !== 'string') return null;
  const trimmed = referrer.trim();
  if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Classifies traffic into Direct, Organic Search, Paid Search, Social, Referral, Email, or Other.
 */
export function classifyTrafficSource(params: {
  referrer?: string | null;
  utm?: UtmParameters | null;
  currentHost?: string | null;
}): { source: TrafficSource; referringDomain: string | null } {
  const { referrer, utm, currentHost } = params;
  const refDomain = extractDomain(referrer);

  // Normalize UTM parameters
  const utmSource = (utm?.source || '').toLowerCase().trim();
  const utmMedium = (utm?.medium || '').toLowerCase().trim();

  // 1. Paid Traffic Detection (UTM mediums or paid ad tags)
  const paidMediums = ['cpc', 'ppc', 'paid', 'paidsearch', 'paidsocial', 'cpm', 'display', 'banner', 'retargeting'];
  if (paidMediums.includes(utmMedium)) {
    return { source: 'paid_search', referringDomain: refDomain };
  }

  // 2. Email Detection
  const emailMediums = ['email', 'newsletter', 'e-mail', 'mail'];
  if (
    emailMediums.includes(utmMedium) ||
    utmSource === 'email' ||
    utmSource === 'newsletter' ||
    (refDomain && ['mail.google.com', 'outlook.live.com', 'mail.yahoo.com'].includes(refDomain))
  ) {
    return { source: 'email', referringDomain: refDomain };
  }

  // 3. Social Media Detection
  const socialDomains = [
    'facebook.com',
    'm.facebook.com',
    'l.facebook.com',
    'lm.facebook.com',
    'fb.me',
    'instagram.com',
    'l.instagram.com',
    'twitter.com',
    'x.com',
    't.co',
    'linkedin.com',
    'lnkd.in',
    'reddit.com',
    'redd.it',
    'youtube.com',
    'youtu.be',
    'pinterest.com',
    'pin.it',
    'whatsapp.com',
    'web.whatsapp.com',
    'api.whatsapp.com',
    'wa.me',
    'tiktok.com',
    'telegram.org',
    't.me',
    'threads.net',
    'quora.com',
  ];

  const socialMediums = ['social', 'social-network', 'sm', 'social-media'];
  if (
    socialMediums.includes(utmMedium) ||
    (refDomain && socialDomains.some((d) => refDomain === d || refDomain.endsWith(`.${d}`)))
  ) {
    return { source: 'social', referringDomain: refDomain };
  }

  // 4. Organic Search Detection
  const searchDomains = [
    'google.com',
    'google.co.in',
    'google.co.uk',
    'google.ca',
    'google.com.au',
    'google.de',
    'google.fr',
    'google.co.jp',
    'bing.com',
    'yahoo.com',
    'search.yahoo.com',
    'duckduckgo.com',
    'baidu.com',
    'yandex.com',
    'yandex.ru',
    'ecosia.org',
    'ask.com',
    'brave.com',
    'search.brave.com',
  ];

  if (
    utmMedium === 'organic' ||
    (refDomain &&
      searchDomains.some((d) => refDomain === d || refDomain.endsWith(`.${d}`) || refDomain.includes('google.')))
  ) {
    return { source: 'organic_search', referringDomain: refDomain };
  }

  // 5. Internal / Direct Check
  const normalizedHost = currentHost ? extractDomain(currentHost) : null;
  if (!refDomain || (normalizedHost && refDomain === normalizedHost) || refDomain === 'localhost') {
    if (utmSource || utmMedium) {
      return { source: 'other', referringDomain: null };
    }
    return { source: 'direct', referringDomain: null };
  }

  // 6. Other UTM Campaign
  if (utmSource || utmMedium) {
    return { source: 'other', referringDomain: refDomain };
  }

  // 7. General External Referral
  return { source: 'referral', referringDomain: refDomain };
}

/**
 * Parses User Agent strings to extract Device Type, Browser, OS, and Bot flags.
 */
export function parseUserAgent(uaString?: string | null): {
  deviceType: DeviceType;
  browser: string;
  browserVersion: string;
  os: string;
  isBot: boolean;
} {
  const ua = uaString || '';
  const uaLower = ua.toLowerCase();

  // 1. Bot check
  const botKeywords = [
    'bot',
    'crawler',
    'spider',
    'slurp',
    'googlebot',
    'bingbot',
    'yandexbot',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'pinterest',
    'headlesschrome',
    'phantomjs',
    'curl',
    'python-requests',
    'wget',
    'postmanruntime',
    'uptimerobot',
    'statuscake',
    'lighthouse',
  ];

  const isBot = botKeywords.some((k) => uaLower.includes(k));

  // 2. Device Type check
  let deviceType: DeviceType = 'desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|iemobile)/i.test(ua);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile || /android/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 3. Operating System check
  let os = 'Unknown OS';
  if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 4. Browser check
  let browser = 'Unknown Browser';
  let browserVersion = '';

  if (/edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/opr\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/samsungbrowser\/([0-9.]+)/i.test(ua)) {
    browser = 'Samsung Internet';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/chrome\/([0-9.]+)/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    browser = 'Firefox';
    browserVersion = RegExp.$1.split('.')[0];
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    browser = 'Safari';
    browserVersion = RegExp.$1.split('.')[0];
  }

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    isBot,
  };
}

/**
 * Extracts approximate visitor location from incoming HTTP headers without storing raw IP addresses.
 */
export function extractGeolocation(headers: Headers): {
  country: string;
  region: string | null;
  city: string | null;
} {
  // Check standard serverless & CDN edge headers
  const countryHeader =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code') ||
    headers.get('cloudfront-viewer-country') ||
    headers.get('x-client-geo-country');

  const regionHeader =
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region') ||
    headers.get('x-region-code') ||
    headers.get('cloudfront-viewer-country-region');

  const cityHeader =
    headers.get('x-vercel-ip-city') ||
    headers.get('cf-ipcity') ||
    headers.get('x-city-name') ||
    headers.get('cloudfront-viewer-city');

  const country = countryHeader && countryHeader.trim().length === 2
    ? countryHeader.trim().toUpperCase()
    : 'UNKNOWN';

  const region = regionHeader ? decodeURIComponent(regionHeader.trim()) : null;
  const city = cityHeader ? decodeURIComponent(cityHeader.trim()) : null;

  return {
    country,
    region: region || null,
    city: city || null,
  };
}

