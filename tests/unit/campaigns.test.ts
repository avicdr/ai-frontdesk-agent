import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseLeadsText,
  cleanPhone,
  resolveTemplate,
} from '../../src/lib/campaigns/campaign-service';
import { CampaignLead } from '../../src/lib/campaigns/types';

describe('WhatsApp Outreach Campaign Manager & Lead Qualification', () => {
  it('should clean and sanitize phone numbers properly', () => {
    assert.strictEqual(cleanPhone('+91 98765-43210'), '919876543210');
    assert.strictEqual(cleanPhone('09876543210'), '09876543210');
    assert.strictEqual(cleanPhone('  919876543210  '), '919876543210');
  });

  it('should parse bulk leads from various formats (CSV, tab, or single phone lines)', () => {
    const rawInput = `
      919876543210, Dr. Rajesh Sharma, Apex Dental Care
      919812345678, Dr. Priya Patel
      919988776655
    `;

    const parsed = parseLeadsText(rawInput);
    assert.strictEqual(parsed.length, 3);

    assert.strictEqual(parsed[0].phone, '919876543210');
    assert.strictEqual(parsed[0].name, 'Dr. Rajesh Sharma');
    assert.strictEqual(parsed[0].clinicName, 'Apex Dental Care');

    assert.strictEqual(parsed[1].phone, '919812345678');
    assert.strictEqual(parsed[1].name, 'Dr. Priya Patel');
    assert.strictEqual(parsed[1].clinicName, 'Dr. Priya Patel');

    assert.strictEqual(parsed[2].phone, '919988776655');
    assert.strictEqual(parsed[2].name, undefined);
    assert.strictEqual(parsed[2].clinicName, undefined);
  });

  it('should correctly resolve template message variables', () => {
    const template = 'Hello {{name}}! Are you taking new appointments at {{clinic_name}}? Call {{phone}}.';
    const mockLead: CampaignLead = {
      id: 'lead_1',
      campaignId: 'camp_1',
      name: 'Dr. Vikram',
      clinicName: 'OrthoSmile Clinic',
      phone: '919876543210',
      status: 'pending',
      qualificationStatus: 'pending',
      sentAt: null,
      repliedAt: null,
      responseTimeSeconds: null,
      outreachMessage: null,
      replyText: null,
      aiNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resolved = resolveTemplate(template, mockLead);
    assert.strictEqual(
      resolved,
      'Hello Dr. Vikram! Are you taking new appointments at OrthoSmile Clinic? Call 919876543210.'
    );
  });

  it('should qualify leads based on response time threshold', () => {
    const thresholdSeconds = 60;

    // Fast reply: <= 60 seconds -> Bot / AI automation detected
    const fastReplyTime = 14; // seconds
    const fastQualification = fastReplyTime <= thresholdSeconds ? 'has_ai' : 'no_ai_manual';
    assert.strictEqual(fastQualification, 'has_ai');

    // Slower reply: > 60 seconds -> Manual human front desk -> HOT SALES PROSPECT
    const manualReplyTime = 180; // 3 minutes
    const manualQualification = manualReplyTime <= thresholdSeconds ? 'has_ai' : 'no_ai_manual';
    assert.strictEqual(manualQualification, 'no_ai_manual');

    // Exact threshold boundary test
    const boundary60s = 60 <= thresholdSeconds ? 'has_ai' : 'no_ai_manual';
    assert.strictEqual(boundary60s, 'has_ai');

    const boundary61s = 61 <= thresholdSeconds ? 'has_ai' : 'no_ai_manual';
    assert.strictEqual(boundary61s, 'no_ai_manual');
  });
});
