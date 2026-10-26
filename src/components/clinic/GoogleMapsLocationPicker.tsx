'use client';

// src/components/clinic/GoogleMapsLocationPicker.tsx
// Rich Google Maps location selector with link parser, live search, and auto-filling Address & City

import React, { useState, useEffect, useRef } from 'react';
import type { LocationSearchResult } from '@/lib/location/google-maps';

interface GoogleMapsLocationPickerProps {
  address: string;
  city: string;
  googleMapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelected: (data: {
    address: string;
    city: string;
    googleMapsUrl: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => void;
}

export function GoogleMapsLocationPicker({
  address,
  city,
  googleMapsUrl,
  latitude,
  longitude,
  onLocationSelected,
}: GoogleMapsLocationPickerProps) {
  const [mode, setMode] = useState<'search' | 'paste'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [pastedUrl, setPastedUrl] = useState(googleMapsUrl || '');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (mode !== 'search' || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/clinic/location/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setSearchResults(json.data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Location search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    onLocationSelected({
      address: result.formattedAddress,
      city: result.city,
      googleMapsUrl: result.googleMapsUrl,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchQuery(result.name || result.formattedAddress);
    setShowDropdown(false);
    setAutoFilledNotice(`Address and City auto-filled for "${result.name || result.city}"!`);
    setTimeout(() => setAutoFilledNotice(null), 4000);
  };

  const handleResolveUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pastedUrl.trim()) return;

    setIsResolving(true);
    setResolveError(null);

    try {
      const res = await fetch('/api/v1/clinic/location/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pastedUrl.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        setResolveError(json.error?.message || 'Unable to detect location from this link. Try searching your clinic above.');
        return;
      }

      const { address: detectedAddress, city: detectedCity, googleMapsUrl: finalUrl, latitude: lat, longitude: lng } = json.data;

      onLocationSelected({
        address: detectedAddress || address,
        city: detectedCity || city,
        googleMapsUrl: finalUrl || pastedUrl.trim(),
        latitude: lat,
        longitude: lng,
      });

      setAutoFilledNotice(`✓ Location verified! Address and City automatically populated.`);
      setTimeout(() => setAutoFilledNotice(null), 4500);
    } catch (err: any) {
      setResolveError(err.message || 'Network error while resolving Google Maps link');
    } finally {
      setIsResolving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setResolveError('Geolocation is not supported by your browser.');
      return;
    }

    setIsResolving(true);
    setResolveError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const res = await fetch('/api/v1/clinic/location/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          });

          const json = await res.json();
          if (json.data) {
            onLocationSelected({
              address: json.data.address || address,
              city: json.data.city || city,
              googleMapsUrl: json.data.googleMapsUrl,
              latitude: lat,
              longitude: lng,
            });
            setAutoFilledNotice(`✓ GPS detected: Address and City auto-filled from current location!`);
            setTimeout(() => setAutoFilledNotice(null), 4500);
          }
        } catch (err: any) {
          setResolveError('Failed to reverse geocode device location.');
        } finally {
          setIsResolving(false);
        }
      },
      err => {
        setIsResolving(false);
        setResolveError(`Location access denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const effectiveQueryForEmbed =
    latitude && longitude
      ? `${latitude},${longitude}`
      : [address, city].filter(Boolean).join(', ');

  const embedMapUrl = effectiveQueryForEmbed
    ? `https://maps.google.com/maps?q=${encodeURIComponent(effectiveQueryForEmbed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : null;

  const effectiveMapsLink =
    googleMapsUrl ||
    (latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : effectiveQueryForEmbed
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(effectiveQueryForEmbed)}`
      : null);

  return (
    <div
      style={{
        background: '#161412',
        border: '1px solid rgba(232, 122, 56, 0.25)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginTop: '0.5rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Header with Title and Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📍</span>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#F3F0E8' }}>
              Add Exact Location via Google Maps
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#63C7A2',
                background: 'rgba(99, 199, 162, 0.12)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 199, 162, 0.25)',
              }}
            >
              Auto-fills Address & City
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9E9B93', margin: '0.2rem 0 0 0' }}>
            Search your clinic or paste a Google Maps link. The address and city will be automatically detected.
          </p>
        </div>

        {/* Mode Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#11100F', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setMode('search')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'search' ? '#E87A38' : 'transparent',
              color: mode === 'search' ? '#FFFFFF' : '#9E9B93',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🔍 Search Place
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'paste' ? '#E87A38' : 'transparent',
              color: mode === 'paste' ? '#FFFFFF' : '#9E9B93',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🔗 Paste Link
          </button>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isResolving}
            title="Use current GPS device location"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(243, 240, 232, 0.1)',
              background: 'transparent',
              color: '#D0CBC1',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: isResolving ? 'wait' : 'pointer',
            }}
          >
            🎯 GPS
          </button>
        </div>
      </div>

      {/* Mode 1: Search Place with Live Autocomplete */}
      {mode === 'search' && (
        <div ref={searchContainerRef} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="input"
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  fontSize: '0.875rem',
                  background: '#1C1916',
                }}
                placeholder="Type clinic name, hospital, road, or area (e.g. Clove Dental Indiranagar)..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9E9B93',
                  fontSize: '0.9rem',
                }}
              >
                {isSearching ? '⏳' : '🔍'}
              </span>
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                zIndex: 50,
                background: '#1C1916',
                border: '1px solid rgba(232, 122, 56, 0.3)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(243, 240, 232, 0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(232, 75, 44, 0.12)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#F3F0E8', fontSize: '0.85rem' }}>{item.name}</span>
                    {item.city && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(232, 122, 56, 0.15)',
                          color: '#E87A38',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {item.city}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9E9B93', marginTop: '2px' }}>
                    {item.formattedAddress}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Paste Google Maps Link */}
      {mode === 'paste' && (
        <form onSubmit={handleResolveUrl} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: '240px', fontSize: '0.85rem', background: '#1C1916' }}
            placeholder="Paste Google Maps URL (e.g. https://maps.app.goo.gl/... or google.com/maps/place/...)"
            value={pastedUrl}
            onChange={e => setPastedUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={isResolving || !pastedUrl.trim()}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isResolving ? '⏳ Resolving...' : '⚡ Auto-Detect'}
          </button>
        </form>
      )}

      {/* Status Notice / Feedback */}
      {autoFilledNotice && (
        <div
          style={{
            marginTop: '0.65rem',
            padding: '0.5rem 0.85rem',
            background: 'rgba(99, 199, 162, 0.1)',
            border: '1px solid rgba(99, 199, 162, 0.3)',
            borderRadius: '8px',
            color: '#63C7A2',
            fontSize: '0.8rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>✓</span>
          <span>{autoFilledNotice}</span>
        </div>
      )}

      {resolveError && (
        <div
          style={{
            marginTop: '0.65rem',
            padding: '0.5rem 0.85rem',
            background: 'rgba(232, 75, 44, 0.1)',
            border: '1px solid rgba(232, 75, 44, 0.3)',
            borderRadius: '8px',
            color: '#E84B2C',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>✕</span>
          <span>{resolveError}</span>
        </div>
      )}

      {/* Embedded Live Google Map Preview Card */}
      {embedMapUrl && (
        <div
          style={{
            marginTop: '0.85rem',
            background: '#11100F',
            border: '1px solid rgba(243, 240, 232, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0.85rem',
              background: '#1A1715',
              borderBottom: '1px solid rgba(243, 240, 232, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#E87A38', fontSize: '0.8rem' }}>●</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F3F0E8' }}>
                Google Maps Pin Preview
              </span>
              {(latitude && longitude) && (
                <span style={{ fontSize: '0.7rem', color: '#9E9B93', fontFamily: 'monospace' }}>
                  ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                </span>
              )}
            </div>

            {effectiveMapsLink && (
              <a
                href={effectiveMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem',
                  color: '#E87A38',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                Open in Google Maps ↗
              </a>
            )}
          </div>

          <div style={{ height: '180px', width: '100%', position: 'relative' }}>
            <iframe
              title="Clinic Google Map Preview"
              src={embedMapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  );
}
