// src/lib/campaigns/types.ts
// Data structures for WhatsApp outreach campaigns and lead qualification based on response time

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed';
export type LeadStatus = 'pending' | 'sending' | 'sent' | 'replied' | 'failed';
export type LeadQualification = 'pending' | 'has_ai' | 'no_ai_manual' | 'no_response';

export interface CampaignStats {
  totalLeads: number;
  sentCount: number;
  repliedCount: number;
  hasAiCount: number;
  noAiManualCount: number;
  pendingCount: number;
  avgResponseTimeSeconds: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  organizationId: string; // The clinic/org whose Baileys connection sends the messages
  senderPhone?: string;
  messageTemplate: string; // e.g. "Hi {{name}}, are you taking new patient appointments for {{clinic_name}} this week?"
  responseThresholdSeconds: number; // e.g. 60. <= 60s: AI/bot. > 60s: manual front desk human.
  delaySeconds: number; // throttle delay between outreach messages (default: 5-8s)
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignLead {
  id: string;
  campaignId: string;
  name: string;
  clinicName: string;
  phone: string; // formatted raw digits e.g. 919876543210
  status: LeadStatus;
  qualificationStatus: LeadQualification;
  sentAt: string | null;
  repliedAt: string | null;
  responseTimeSeconds: number | null;
  outreachMessage: string | null;
  replyText: string | null;
  aiNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedSenderOption {
  organizationId: string;
  clinicName: string;
  phoneNumber?: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
}
