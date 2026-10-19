// src/lib/types/database.ts
// Auto-generated type definitions matching our database schema

export type OrgRole = 'owner' | 'admin' | 'staff' | 'viewer';
export type ConfigStatus = 'draft' | 'pending_review' | 'active' | 'archived';
export type IntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'suspended';
export type ConversationStatus = 'active' | 'resolved' | 'handed_off' | 'expired';
export type ConversationOwner = 'ai' | 'human';
export type MessageRole = 'patient' | 'assistant' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type AppointmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled'
  | 'completed'
  | 'no_show';
export type AppointmentSource = 'whatsapp' | 'dashboard' | 'import';
export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'grace_period'
  | 'expired'
  | 'suspended'
  | 'cancelled';
export type PaymentOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'refunded';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type NotificationChannel = 'email' | 'whatsapp' | 'sms';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type DocType = 'faq' | 'policy' | 'service' | 'hours' | 'general' | 'imported_url' | 'uploaded_file';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  timezone: string;
  business_type: string;
  status: 'onboarding' | 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface ClinicProfile {
  id: string;
  organization_id: string;
  clinic_name: string;
  business_type: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  timezone: string;
  supported_languages: string[];
  emergency_instructions: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  organization_id: string;
  day_of_week: number; // 0-6
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  price_display: string | null;
  duration_minutes: number;
  is_bookable: boolean;
  preparation_instructions: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingPolicy {
  id: string;
  organization_id: string;
  min_advance_hours: number;
  max_advance_days: number;
  max_per_slot: number;
  buffer_minutes: number;
  cancellation_hours: number;
  reschedule_hours: number;
  requires_approval: boolean;
  allow_same_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfiguration {
  id: string;
  organization_id: string;
  version: number;
  status: ConfigStatus;
  assistant_name: string;
  tone: 'professional' | 'friendly' | 'formal';
  greeting_message: string | null;
  use_emoji: boolean;
  max_response_length: number;
  handoff_message: string | null;
  identifies_as_ai: boolean;
  supported_languages: string[];
  custom_instructions: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  doc_type: DocType;
  source_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  is_active: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppIntegration {
  id: string;
  organization_id: string;
  phone_number_id: string | null;
  display_phone_number: string | null;
  waba_id: string | null;
  // access_token_encrypted is never returned to client
  webhook_verified_at: string | null;
  status: IntegrationStatus;
  last_error: string | null;
  last_error_at: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarIntegration {
  id: string;
  organization_id: string;
  google_account_email: string | null;
  selected_calendar_id: string | null;
  selected_calendar_name: string | null;
  // tokens are never returned to client
  token_expires_at: string | null;
  scopes: string[] | null;
  status: IntegrationStatus;
  last_error: string | null;
  last_error_at: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  channel: string;
  patient_phone: string;
  patient_name: string | null;
  status: ConversationStatus;
  owner: ConversationOwner;
  assigned_to: string | null;
  handoff_reason: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  organization_id: string;
  external_id: string | null;
  role: MessageRole;
  content: string;
  status: MessageStatus | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  conversation_id: string | null;
  service_id: string | null;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  external_event_id: string | null;
  external_calendar_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_inr: number;
  billing_cycle: string;
  included_inbound_messages: number;
  included_outbound_messages: number;
  included_ai_requests: number;
  max_input_tokens_per_request: number;
  max_output_tokens_per_response: number;
  max_tool_calls_per_turn: number;
  max_knowledge_docs: number;
  max_services: number;
  max_ai_cost_inr: number | null;
  max_daily_spend_inr: number | null;
  max_monthly_spend_inr: number | null;
  max_concurrent_requests: number;
  over_limit_behavior: 'block' | 'warn' | 'charge';
  grace_period_days: number;
  enabled_features: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  grace_expires_at: string | null;
  cancelled_at: string | null;
  messages_used_inbound: number;
  messages_used_outbound: number;
  ai_requests_used: number;
  ai_cost_used_inr: number;
  last_renewed_at: string | null;
  renewal_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  organization_id: string;
  plan_id: string;
  provider: string;
  provider_order_id: string | null;
  amount_inr: number;
  currency: string;
  status: PaymentOrderStatus;
  utr_number: string | null;
  payment_screenshot_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  idempotency_key: string;
  expires_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AiUsageRecord {
  id: string;
  organization_id: string;
  conversation_id: string | null;
  request_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number | null;
  is_retry: boolean;
  is_fallback: boolean;
  latency_ms: number | null;
  success: boolean;
  error_code: string | null;
  pricing_version_id: string | null;
  estimated_cost_inr: number | null;
  provider_reported_cost: number | null;
  created_at: string;
}

// ============================================================
// API Response types
// ============================================================
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: unknown;
  };
  meta: {
    requestId: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// Onboarding types
// ============================================================
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  organization: Organization | null;
  clinicProfile: ClinicProfile | null;
  agentConfig: AgentConfiguration | null;
  whatsappIntegration: WhatsAppIntegration | null;
  calendarIntegration: CalendarIntegration | null;
  subscription: Subscription | null;
}

// ============================================================
// Dashboard types
// ============================================================
export interface DashboardOverview {
  organization: Organization;
  subscription: (Subscription & { plan: SubscriptionPlan }) | null;
  agentStatus: 'active' | 'inactive' | 'pending';
  whatsappStatus: IntegrationStatus;
  calendarStatus: IntegrationStatus;
  upcomingAppointments: Appointment[];
  recentConversations: Conversation[];
  usageSummary: {
    messagesInbound: { used: number; limit: number };
    messagesOutbound: { used: number; limit: number };
    aiRequests: { used: number; limit: number };
    aiCostInr: { used: number; limit: number | null };
  };
}

export interface AdminOverview {
  totalOrganizations: number;
  activeSubscribers: number;
  expiredSubscriptions: number;
  suspendedAccounts: number;
  newSubscriptionsThisMonth: number;
  mrrEstimateInr: number;
  paymentsReceivedThisMonth: number;
  pendingPayments: number;
  failedPayments: number;
  expiringInSevenDays: number;
  aiSpendThisMonthInr: number;
  estimatedGrossContributionInr: number;
  whatsappHealth: 'healthy' | 'degraded' | 'down';
  calendarHealth: 'healthy' | 'degraded' | 'down';
  aiProviderHealth: 'healthy' | 'degraded' | 'down';
}
