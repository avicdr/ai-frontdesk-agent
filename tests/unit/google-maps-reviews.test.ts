// tests/unit/google-maps-reviews.test.ts
// Unit tests for Google Maps location parsing and automated review message formatting

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractCoordinatesFromUrl } from '../../src/lib/location/google-maps';
import { formatReviewMessage, DEFAULT_REVIEW_TEMPLATE } from '../../src/lib/reviews/review-service';

describe('Google Maps Location Extraction', () => {
  test('should extract coordinates from @lat,lng format in Google Maps URLs', () => {
    const url = 'https://www.google.com/maps/place/Amritsar,+Punjab/@31.6339793,74.8722642,12z/data=!3m1!4b1';
    const coords = extractCoordinatesFromUrl(url);
    assert.ok(coords);
    assert.strictEqual(coords.lat, 31.6339793);
    assert.strictEqual(coords.lng, 74.8722642);
  });

  test('should extract coordinates from !3d!4d protobuf format in Google Maps URLs', () => {
    const url = 'https://www.google.com/maps/place/Dr.+Sharma+Dental/data=!4m2!3m1!1s0x0:0x0!3d12.9716!4d77.5946';
    const coords = extractCoordinatesFromUrl(url);
    assert.ok(coords);
    assert.strictEqual(coords.lat, 12.9716);
    assert.strictEqual(coords.lng, 77.5946);
  });

  test('should extract coordinates from ?q=lat,lng query param format', () => {
    const url = 'https://maps.google.com/?q=28.6139,77.2090';
    const coords = extractCoordinatesFromUrl(url);
    assert.ok(coords);
    assert.strictEqual(coords.lat, 28.6139);
    assert.strictEqual(coords.lng, 77.209);
  });

  test('should extract coordinates from &ll=lat,lng format', () => {
    const url = 'https://www.google.com/maps?ll=19.0760,72.8777&z=14';
    const coords = extractCoordinatesFromUrl(url);
    assert.ok(coords);
    assert.strictEqual(coords.lat, 19.076);
    assert.strictEqual(coords.lng, 72.8777);
  });

  test('should return null for invalid or non-coordinate strings', () => {
    assert.strictEqual(extractCoordinatesFromUrl(''), null);
    assert.strictEqual(extractCoordinatesFromUrl('https://google.com'), null);
  });
});

describe('Automated Google Review Formatting', () => {
  test('should replace all dynamic template variables in review message', () => {
    const template = 'Hi {patient_name}! Thanks for visiting {clinic_name} for your {service_name}. Review us: {review_link}';
    const result = formatReviewMessage(template, {
      patientName: 'Priya Sharma',
      clinicName: 'Clove Dental Care',
      reviewLink: 'https://g.page/r/clove-dental/review',
      serviceName: 'Root Canal Treatment',
    });

    assert.ok(result.includes('Priya'));
    assert.ok(result.includes('Clove Dental Care'));
    assert.ok(result.includes('Root Canal Treatment'));
    assert.ok(result.includes('https://g.page/r/clove-dental/review'));
  });

  test('should fallback to default review template if custom template is empty', () => {
    const result = formatReviewMessage('', {
      patientName: 'Rahul',
      clinicName: 'Apex Health Clinic',
      reviewLink: 'https://g.page/r/apex/review',
    });

    assert.ok(result.includes('Rahul'));
    assert.ok(result.includes('Apex Health Clinic'));
    assert.ok(result.includes('https://g.page/r/apex/review'));
    assert.ok(result.includes('30 seconds to share your review'));
  });

  test('should use only first name of patient for friendly conversational tone', () => {
    const result = formatReviewMessage('Hey {patient_name}!', {
      patientName: 'Kavita Patel',
      clinicName: 'Patel Clinic',
      reviewLink: 'https://review.link',
    });

    assert.strictEqual(result, 'Hey Kavita!');
  });
});
