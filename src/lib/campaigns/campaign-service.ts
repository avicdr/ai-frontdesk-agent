// src/lib/campaigns/campaign-service.ts
// Outbound WhatsApp Campaign Manager & Response-Time Lead Qualification Engine

import fs from 'fs';
import path from 'path';
import { Campaign, CampaignLead, CampaignStats, ConnectedSenderOption } from './types';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const STORAGE_DIR = path.join(process.cwd(), '.campaign-storage');
const CAMPAIGNS_FILE = path.join(STORAGE_DIR, 'campaigns.json');
const LEADS_FILE = path.join(STORAGE_DIR, 'leads.json');

// Ensure local storage directory exists
function ensureStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(CAMPAIGNS_FILE)) {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// In-memory campaign runner state
const activeCampaignRunners = new Map<string, boolean>();

// Raw phone number sanitization
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function computeStats(campaignId: string, leads: CampaignLead[]): CampaignStats {
  const cLeads = leads.filter(l => l.campaignId === campaignId);
  const totalLeads = cLeads.length;
  const sentCount = cLeads.filter(l => l.status === 'sent' || l.status === 'replied').length;
  const repliedCount = cLeads.filter(l => l.status === 'replied').length;
  const hasAiCount = cLeads.filter(l => l.qualificationStatus === 'has_ai').length;
  const noAiManualCount = cLeads.filter(l => l.qualificationStatus === 'no_ai_manual').length;
  const pendingCount = cLeads.filter(l => l.status === 'pending').length;

  const repliedWithTime = cLeads.filter(l => l.responseTimeSeconds != null && l.responseTimeSeconds > 0);
  const avgResponseTimeSeconds = repliedWithTime.length > 0
    ? Math.round(repliedWithTime.reduce((sum, l) => sum + (l.responseTimeSeconds || 0), 0) / repliedWithTime.length)
    : null;

  return {
    totalLeads,
    sentCount,
    repliedCount,
    hasAiCount,
    noAiManualCount,
    pendingCount,
    avgResponseTimeSeconds,
  };
}

// Storage helpers
export function readCampaigns(): Campaign[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
    const campaigns: Campaign[] = JSON.parse(raw);
    const leads = readLeads();
    return campaigns.map(c => ({
      ...c,
      stats: computeStats(c.id, leads),
    }));
  } catch (err) {
    console.error('[CampaignService] Error reading campaigns:', err);
    return [];
  }
}

export function writeCampaigns(campaigns: Campaign[]): void {
  ensureStorage();
  fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
}

export function readLeads(): CampaignLead[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[CampaignService] Error reading leads:', err);
    return [];
  }
}

export function writeLeads(leads: CampaignLead[]): void {
  ensureStorage();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

// Public API
export function listCampaigns(): Campaign[] {
  return readCampaigns().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCampaign(id: string): { campaign: Campaign | null; leads: CampaignLead[] } {
  const campaigns = readCampaigns();
  const campaign = campaigns.find(c => c.id === id) || null;
  const allLeads = readLeads();
  const leads = allLeads.filter(l => l.campaignId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (campaign) {
    campaign.stats = computeStats(campaign.id, leads);
  }

  return { campaign, leads };
}

export function createCampaign(input: {
  name: string;
  organizationId: string;
  senderPhone?: string;
  messageTemplate?: string;
  responseThresholdSeconds?: number;
  delaySeconds?: number;
}): Campaign {
  const campaigns = readCampaigns();
  const now = new Date().toISOString();

  const newCampaign: Campaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    status: 'draft',
    organizationId: input.organizationId,
    senderPhone: input.senderPhone || undefined,
    messageTemplate: input.messageTemplate?.trim() || 'Hello {{name}}! Are you currently taking new patient appointments for {{clinic_name}} this week?',
    responseThresholdSeconds: input.responseThresholdSeconds && input.responseThresholdSeconds > 0 ? input.responseThresholdSeconds : 60,
    delaySeconds: input.delaySeconds && input.delaySeconds >= 2 ? input.delaySeconds : 5,
    stats: {
      totalLeads: 0,
      sentCount: 0,
      repliedCount: 0,
      hasAiCount: 0,
      noAiManualCount: 0,
      pendingCount: 0,
      avgResponseTimeSeconds: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  campaigns.push(newCampaign);
  writeCampaigns(campaigns);
  return newCampaign;
}

export function updateCampaign(
  id: string,
  input: Partial<{
    name: string;
    organizationId: string;
    senderPhone: string;
    messageTemplate: string;
    responseThresholdSeconds: number;
    delaySeconds: number;
    status: Campaign['status'];
  }>
): Campaign | null {
  const campaigns = readCampaigns();
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx === -1) return null;

  campaigns[idx] = {
    ...campaigns[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  writeCampaigns(campaigns);
  return campaigns[idx];
}

export function deleteCampaign(id: string): boolean {
  const campaigns = readCampaigns().filter(c => c.id !== id);
  writeCampaigns(campaigns);
  const leads = readLeads().filter(l => l.campaignId !== id);
  writeLeads(leads);
  activeCampaignRunners.delete(id);
  return true;
}

// Leads Management
export function addLeadsToCampaign(
  campaignId: string,
  rawLeads: Array<{ phone: string; name?: string; clinicName?: string }>
): { added: number; skippedDuplicates: number } {
  const allLeads = readLeads();
  const existingPhonesInCampaign = new Set(
    allLeads.filter(l => l.campaignId === campaignId).map(l => cleanPhone(l.phone))
  );

  let added = 0;
  let skippedDuplicates = 0;
  const now = new Date().toISOString();

  for (const item of rawLeads) {
    const rawClean = cleanPhone(item.phone);
    if (!rawClean || rawClean.length < 8) continue;

    if (existingPhonesInCampaign.has(rawClean)) {
      skippedDuplicates++;
      continue;
    }

    const lead: CampaignLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      campaignId,
      name: item.name?.trim() || 'Doctor',
      clinicName: item.clinicName?.trim() || 'Dental Clinic',
      phone: rawClean,
      status: 'pending',
      qualificationStatus: 'pending',
      sentAt: null,
      repliedAt: null,
      responseTimeSeconds: null,
      outreachMessage: null,
      replyText: null,
      aiNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    allLeads.push(lead);
    existingPhonesInCampaign.add(rawClean);
    added++;
  }

  writeLeads(allLeads);
  return { added, skippedDuplicates };
}

export function parseLeadsText(rawText: string): Array<{ phone: string; name?: string; clinicName?: string }> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const results: Array<{ phone: string; name?: string; clinicName?: string }> = [];

  for (const line of lines) {
    // Check if line is CSV / comma-separated: phone, name, clinic
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      results.push({ phone: parts[0], name: parts[1], clinicName: parts[2] });
    } else if (parts.length === 2) {
      results.push({ phone: parts[0], name: parts[1], clinicName: parts[1] });
    } else {
      // Just phone number
      results.push({ phone: parts[0] });
    }
  }

  return results;
}

export function deleteLead(leadId: string): boolean {
  const allLeads = readLeads().filter(l => l.id !== leadId);
  writeLeads(allLeads);
  return true;
}

export function resetLeadStatus(campaignId: string): void {
  const allLeads = readLeads().map(l => {
    if (l.campaignId === campaignId) {
      return {
        ...l,
        status: 'pending' as const,
        qualificationStatus: 'pending' as const,
        sentAt: null,
        repliedAt: null,
        responseTimeSeconds: null,
        outreachMessage: null,
        replyText: null,
        aiNotes: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return l;
  });
  writeLeads(allLeads);
}

// Template resolver
export function resolveTemplate(template: string, lead: CampaignLead): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name)
    .replace(/\{\{\s*clinic_name\s*\}\}/gi, lead.clinicName)
    .replace(/\{\{\s*clinic\s*\}\}/gi, lead.clinicName)
    .replace(/\{\{\s*phone\s*\}\}/gi, lead.phone);
}

// Campaign Runner with WhatsApp Baileys Integration
export async function startCampaignRunner(
  campaignId: string,
  sendMessageFn: (orgId: string, toPhone: string, text: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: boolean; message: string }> {
  const { campaign } = getCampaign(campaignId);
  if (!campaign) {
    return { success: false, message: 'Campaign not found' };
  }

  if (activeCampaignRunners.get(campaignId)) {
    return { success: true, message: 'Campaign is already running' };
  }

  activeCampaignRunners.set(campaignId, true);
  updateCampaign(campaignId, { status: 'running' });

  // Execute queue in background
  (async () => {
    try {
      console.log(`[CampaignRunner] Starting campaign "${campaign.name}" (${campaignId}) via org ${campaign.organizationId}...`);

      while (activeCampaignRunners.get(campaignId)) {
        const allLeads = readLeads();
        const nextLead = allLeads.find(l => l.campaignId === campaignId && l.status === 'pending');

        if (!nextLead) {
          console.log(`[CampaignRunner] All leads processed for campaign "${campaign.name}".`);
          updateCampaign(campaignId, { status: 'completed' });
          activeCampaignRunners.delete(campaignId);
          break;
        }

        // Mark as sending
        nextLead.status = 'sending';
        writeLeads(allLeads);

        // Resolve text
        const messageText = resolveTemplate(campaign.messageTemplate, nextLead);

        // Send via Baileys WhatsApp connection
        const result = await sendMessageFn(campaign.organizationId, nextLead.phone, messageText);

        const updatedLeads = readLeads();
        const targetLead = updatedLeads.find(l => l.id === nextLead.id);

        if (targetLead) {
          if (result.success) {
            targetLead.status = 'sent';
            targetLead.sentAt = new Date().toISOString();
            targetLead.outreachMessage = messageText;
            targetLead.qualificationStatus = 'no_response';
            console.log(`[CampaignRunner] Sent outreach to ${targetLead.phone} (${targetLead.clinicName})`);
          } else {
            targetLead.status = 'failed';
            targetLead.aiNotes = `Send error: ${result.error || 'Failed to dispatch via WhatsApp'}`;
            console.error(`[CampaignRunner] Failed to send to ${targetLead.phone}: ${result.error}`);
          }
          targetLead.updatedAt = new Date().toISOString();
          writeLeads(updatedLeads);
        }

        // Pacing delay between outreach messages (default: 5-8s)
        const delayMs = (campaign.delaySeconds || 5) * 1000;
        await new Promise(r => setTimeout(r, delayMs));
      }
    } catch (err) {
      console.error(`[CampaignRunner] Error running campaign ${campaignId}:`, err);
      updateCampaign(campaignId, { status: 'paused' });
      activeCampaignRunners.delete(campaignId);
    }
  })();

  return { success: true, message: 'Campaign started successfully' };
}

export function pauseCampaignRunner(campaignId: string): { success: boolean; message: string } {
  activeCampaignRunners.delete(campaignId);
  updateCampaign(campaignId, { status: 'paused' });
  return { success: true, message: 'Campaign paused' };
}

// INCOMING QUALIFICATION ENGINE
// Called when a patient/lead replies on WhatsApp
export function handleIncomingLeadReply(
  fromPhoneRaw: string,
  replyText: string,
  receivedAt: Date = new Date()
): { matched: boolean; qualification?: string; leadName?: string } {
  const cleanFrom = cleanPhone(fromPhoneRaw);
  if (!cleanFrom) return { matched: false };

  const allLeads = readLeads();
  const campaigns = readCampaigns();

  // Find most recent sent lead matching this phone
  const matchingLead = allLeads
    .filter(l => cleanPhone(l.phone) === cleanFrom && (l.status === 'sent' || l.status === 'replied'))
    .sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())[0];

  if (!matchingLead || !matchingLead.sentAt) {
    return { matched: false };
  }

  const campaign = campaigns.find(c => c.id === matchingLead.campaignId);
  const thresholdSeconds = campaign?.responseThresholdSeconds || 60;

  const sentTimeMs = new Date(matchingLead.sentAt).getTime();
  const replyTimeMs = receivedAt.getTime();
  const responseTimeSeconds = Math.max(1, Math.round((replyTimeMs - sentTimeMs) / 1000));

  matchingLead.status = 'replied';
  matchingLead.repliedAt = receivedAt.toISOString();
  matchingLead.replyText = replyText;
  matchingLead.responseTimeSeconds = responseTimeSeconds;

  // QUALIFICATION LOGIC BASED ON RESPONSE TIME:
  // <= threshold: AI automation detected (Bot auto-responder replied in seconds)
  // > threshold: No AI automation (Manual receptionist typing after delay) -> HOT SALES LEAD!
  if (responseTimeSeconds <= thresholdSeconds) {
    matchingLead.qualificationStatus = 'has_ai';
    matchingLead.aiNotes = `⚡ Instant response (${responseTimeSeconds}s <= ${thresholdSeconds}s). Automated AI / Bot auto-responder detected.`;
  } else {
    matchingLead.qualificationStatus = 'no_ai_manual';
    matchingLead.aiNotes = `🎯 Human response (${responseTimeSeconds}s > ${thresholdSeconds}s). Manual front desk identified. HOT LEAD for AI Front Desk pitch!`;
  }

  matchingLead.updatedAt = new Date().toISOString();
  writeLeads(allLeads);

  console.log(
    `[Lead Qualification] Lead ${matchingLead.phone} (${matchingLead.clinicName}) replied in ${responseTimeSeconds}s -> ${matchingLead.qualificationStatus.toUpperCase()} (${matchingLead.aiNotes})`
  );

  return {
    matched: true,
    qualification: matchingLead.qualificationStatus,
    leadName: matchingLead.name,
  };
}
