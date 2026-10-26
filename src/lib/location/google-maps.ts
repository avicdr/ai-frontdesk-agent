// src/lib/location/google-maps.ts
// Helper utilities for resolving Google Maps locations, URLs, coordinates, and reverse geocoding

export interface ResolvedLocation {
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  displayName: string;
  placeName?: string;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  formattedAddress: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
}

/**
 * Extracts coordinates and place names from a Google Maps URL or string.
 */
export function extractCoordinatesFromUrl(urlStr: string): { lat: number; lng: number } | null {
  if (!urlStr) return null;

  // 1. Match @lat,lng,zoom (e.g., /@28.6139,77.2090,17z)
  const atMatch = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // 2. Match !3dlat!4dlng (Google Maps protobuf link)
  const dMatch = urlStr.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }

  // 3. Match query params ?q=lat,lng or &q=lat,lng
  const qMatch = urlStr.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // 4. Match ll=lat,lng
  const llMatch = urlStr.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }

  return null;
}

/**
 * Resolves a short Google Maps URL (e.g., maps.app.goo.gl or goo.gl/maps) to its final canonical URL.
 */
export async function followGoogleMapsRedirect(shortUrl: string): Promise<string> {
  let target = shortUrl.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://${target}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    const finalUrl = res.url || target;

    // If finalUrl already contains coordinates, return it
    if (extractCoordinatesFromUrl(finalUrl)) {
      return finalUrl;
    }

    // Sometimes Google returns an intermediate HTML page with meta refresh or window.location
    const html = await res.text();
    const metaRefresh = html.match(/content=["']\d+;\s*url=([^"']+)["']/i);
    if (metaRefresh && metaRefresh[1]) {
      return metaRefresh[1].replace(/&amp;/g, '&');
    }

    const ogUrl = html.match(/<meta property=["']og:url["'] content=["']([^"']+)["']/i);
    if (ogUrl && ogUrl[1]) {
      return ogUrl[1].replace(/&amp;/g, '&');
    }

    const ogImage = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
    if (ogImage && ogImage[1]) {
      const centerMatch = ogImage[1].match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i);
      if (centerMatch) {
        return `https://www.google.com/maps/search/?api=1&query=${centerMatch[1]},${centerMatch[2]}`;
      }
    }

    return finalUrl;
  } catch (err) {
    console.warn('Failed to follow Google Maps redirect:', err);
    return target;
  }
}

/**
 * Reverse geocodes coordinates to street address and city with high accuracy.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  displayName: string;
}> {
  // Strategy 1: BigDataCloud reverse geocoder (fast, unthrottled, high-accuracy)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivisionCode ||
        data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 6 || a.adminLevel === 5)?.name ||
        '';

      const streetParts: string[] = [];
      if (data.locality && data.locality !== city) streetParts.push(data.locality);
      if (data.principalSubdivision) streetParts.push(data.principalSubdivision);

      const state = data.principalSubdivision || '';
      const postalCode = data.postcode || '';
      const country = data.countryName || 'India';

      // Build readable street address
      const address = streetParts.length > 0 ? streetParts.join(', ') : `${city}, ${state}`.trim();
      const displayName = [address, city, state, postalCode, country].filter(Boolean).join(', ');

      if (city) {
        return {
          address: address || city,
          city,
          state,
          postalCode,
          country,
          displayName,
        };
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode error:', err);
  }

  // Strategy 2: OpenStreetMap Nominatim reverse geocode
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.city_district ||
        addr.county ||
        '';

      const streetParts = [
        addr.house_number,
        addr.road,
        addr.neighbourhood,
        addr.suburb !== city ? addr.suburb : null,
      ].filter(Boolean);

      const address = streetParts.length > 0 ? streetParts.join(', ') : data.display_name?.split(',').slice(0, 2).join(',').trim() || city;

      return {
        address: address || city,
        city: city || addr.state || '',
        state: addr.state || '',
        postalCode: addr.postcode || '',
        country: addr.country || 'India',
        displayName: data.display_name || address,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode fallback error:', err);
  }

  return {
    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    city: '',
    displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}

/**
 * Searches places/addresses by query text.
 */
export async function searchPlaces(query: string): Promise<LocationSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const results: LocationSearchResult[] = [];

  // Strategy 1: Nominatim search with addressdetails
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=5`;
    const res = await fetch(nomUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        for (const item of items) {
          const addr = item.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.city_district ||
            addr.county ||
            addr.state_district ||
            '';

          const streetParts = [
            addr.house_number,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
          ].filter(Boolean);

          const formattedAddress = streetParts.length > 0
            ? streetParts.join(', ')
            : item.name || item.display_name.split(',')[0];

          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          results.push({
            id: String(item.place_id || `${lat}-${lng}`),
            name: item.name || formattedAddress,
            formattedAddress: formattedAddress || item.display_name,
            city: city || addr.state || '',
            state: addr.state || '',
            postalCode: addr.postcode || '',
            country: addr.country || 'India',
            latitude: lat,
            longitude: lng,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim search error:', err);
  }

  // Strategy 2: Open-Meteo fallback if empty
  if (results.length === 0) {
    try {
      const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=5&language=en&format=json`;
      const res = await fetch(omUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          for (const item of data.results) {
            results.push({
              id: String(item.id),
              name: item.name,
              formattedAddress: [item.name, item.admin2, item.admin1].filter(Boolean).join(', '),
              city: item.name,
              state: item.admin1 || '',
              country: item.country || '',
              latitude: item.latitude,
              longitude: item.longitude,
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Open-Meteo search fallback error:', err);
    }
  }

  return results;
}

/**
 * Resolves any Google Maps input: whether a URL, text address, or coordinates.
 */
export async function resolveGoogleLocation(input: {
  url?: string;
  query?: string;
  latitude?: number;
  longitude?: number;
}): Promise<ResolvedLocation | null> {
  let lat: number | undefined = input.latitude;
  let lng: number | undefined = input.longitude;
  let canonicalMapsUrl = '';
  let placeName: string | undefined;

  // Case 1: URL provided
  if (input.url && input.url.trim()) {
    let rawUrl = input.url.trim();

    // Check if short URL
    if (rawUrl.includes('maps.app.goo.gl') || rawUrl.includes('goo.gl/maps')) {
      rawUrl = await followGoogleMapsRedirect(rawUrl);
    }

    const coords = extractCoordinatesFromUrl(rawUrl);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }

    // Extract place name if present in URL
    const placeMatch = rawUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    canonicalMapsUrl = lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : rawUrl;
  }

  // Case 2: Query text provided and no coordinates yet
  if ((!lat || !lng) && input.query && input.query.trim()) {
    const searchResults = await searchPlaces(input.query.trim());
    if (searchResults.length > 0) {
      const top = searchResults[0];
      return {
        address: top.formattedAddress,
        city: top.city,
        state: top.state,
        postalCode: top.postalCode,
        country: top.country,
        latitude: top.latitude,
        longitude: top.longitude,
        googleMapsUrl: top.googleMapsUrl,
        displayName: `${top.name}, ${top.formattedAddress}`,
        placeName: top.name,
      };
    }
  }

  // If coordinates resolved, reverse-geocode to extract address and city
  if (lat !== undefined && lng !== undefined) {
    const geo = await reverseGeocode(lat, lng);
    const finalMapsUrl = canonicalMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    let address = geo.address;
    if (placeName && !address.toLowerCase().includes(placeName.toLowerCase())) {
      address = `${placeName}, ${address}`;
    }

    return {
      address,
      city: geo.city,
      state: geo.state,
      postalCode: geo.postalCode,
      country: geo.country,
      latitude: lat,
      longitude: lng,
      googleMapsUrl: finalMapsUrl,
      displayName: geo.displayName,
      placeName,
    };
  }

  return null;
}
