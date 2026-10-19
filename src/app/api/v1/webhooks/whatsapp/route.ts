// src/app/api/v1/webhooks/whatsapp/route.ts
// WhatsApp webhook endpoint — handles verification and incoming messages
// This route must NOT require authentication cookies (Meta calls it directly)

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookChallenge,
  verifyWebhookSignature,
  parseIncomingMessage,
  sendWhatsAppMessage,
} from '@/lib/whatsapp/client';
import { resolveOrgFromWhatsAppNumber } from '@/lib/security/tenant';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { checkQuota, recordAiUsage } from '@/lib/ai/usage';
import { AIProviderFactory } from '@/lib/ai/provider';
import { buildSystemPrompt, parseAssistantResponse } from '@/lib/ai/prompts';
import { executeTool } from '@/lib/ai/tools';
import { nanoid } from 'nanoid';

const SAFE_FALLBACK_MESSAGE =
  "Thank you for your message. Our reception is temporarily unavailable. Please call us directly or try again shortly.";

// ============================================================
// GET — Webhook verification (Meta sends this to verify the endpoint)
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode') ?? '';
  const token = searchParams.get('hub.verify_token') ?? '';
  const challenge = searchParams.get('hub.challenge') ?? '';

  const result = verifyWebhookChallenge(mode, token, challenge);
  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// ============================================================
// POST — Incoming message processing
// ============================================================
export async function POST(request: NextRequest) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const appSecret = process.env.META_APP_SECRET ?? '';

  // 2. Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 3. Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 4. Acknowledge immediately — Meta expects < 5 seconds response
  // Process in background (via database job for production scale)
  processIncomingMessage(payload).catch(err => {
    console.error('WhatsApp message processing error:', err);
  });

  return new NextResponse('OK', { status: 200 });
}

// ============================================================
// Async message processing
// ============================================================
async function processIncomingMessage(payload: Record<string, unknown>): Promise<void> {
  const admin = createSupabaseAdminClient();
  const requestId = nanoid(12);

  // 5. Parse the message
  const incomingMessage = parseIncomingMessage(payload);
  if (!incomingMessage) {
    // Status update, read receipt, or unsupported message type
    return;
  }

  // 6. Deduplicate using message ID
  const { data: existing } = await admin
    .from('webhook_events')
    .select('id')
    .eq('provider', 'whatsapp')
    .eq('external_event_id', incomingMessage.messageId)
    .maybeSingle();

  if (existing) {
    return; // Already processed
  }

  // Record the event
  const { error: eventError } = await admin
    .from('webhook_events')
    .insert({
      provider: 'whatsapp',
      external_event_id: incomingMessage.messageId,
      payload,
    });

  if (eventError?.code === '23505') {
    return; // Race condition — already inserted
  }

  // 7. Resolve tenant from phone_number_id
  const tenant = await resolveOrgFromWhatsAppNumber(incomingMessage.phoneNumberId);
  if (!tenant) {
    // No connected clinic for this number
    return;
  }

  const { organizationId } = tenant;

  // Update webhook event with org
  await admin
    .from('webhook_events')
    .update({ organization_id: organizationId, status: 'processing' })
    .eq('external_event_id', incomingMessage.messageId)
    .eq('provider', 'whatsapp');

  // 8. Check subscription status and quota
  const quota = await checkQuota(organizationId);
  if (!quota.allowed) {
    // Send safe fallback if messaging window is open
    await sendWhatsAppMessage(
      organizationId,
      incomingMessage.fromPhone,
      SAFE_FALLBACK_MESSAGE
    );
    return;
  }

  // 9. Load clinic context
  const clinicContext = await loadClinicContext(organizationId);
  if (!clinicContext) {
    await sendWhatsAppMessage(organizationId, incomingMessage.fromPhone, SAFE_FALLBACK_MESSAGE);
    return;
  }

  // 10. Get or create conversation
  const conversation = await getOrCreateConversation(
    organizationId,
    incomingMessage.fromPhone
  );

  // 11. Save incoming message
  await admin.from('messages').insert({
    conversation_id: conversation.id,
    organization_id: organizationId,
    external_id: incomingMessage.messageId,
    role: 'patient',
    content: incomingMessage.text,
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  });

  // 11b. Guard: If conversation is managed by human or already handed off, do not call AI or send automated reply!
  if (conversation.owner === 'human' || conversation.status === 'handed_off') {
    console.log(`[Meta WhatsApp] Conversation ${conversation.id} (${incomingMessage.fromPhone}) is managed by a human / handed off. Silencing automated AI response.`);
    return;
  }

  // 12. Load conversation history (last 20 messages)
  const { data: history } = await admin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const messages = (history ?? [])
    .reverse()
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // 13. Build system prompt
  const systemPrompt = buildSystemPrompt(clinicContext);

  // 14. Call AI provider
  const aiStart = Date.now();
  let aiResponse: Awaited<ReturnType<typeof AIProviderFactory.generateWithFallback>>;
  try {
    aiResponse = await AIProviderFactory.generateWithFallback({
      organizationId,
      conversationId: conversation.id,
      messages: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      systemPrompt,
      maxInputTokens: clinicContext.plan?.max_input_tokens_per_request ?? 8000,
      maxOutputTokens: clinicContext.plan?.max_output_tokens_per_response ?? 700,
    });
  } catch (err) {
    // All providers failed — send safe fallback
    await sendWhatsAppMessage(organizationId, incomingMessage.fromPhone, SAFE_FALLBACK_MESSAGE);
    return;
  }

  // 15. Record usage
  await recordAiUsage(
    {
      organizationId,
      conversationId: conversation.id,
      requestId,
      provider: aiResponse.response.provider,
      model: aiResponse.response.model,
      inputTokens: aiResponse.response.inputTokens,
      outputTokens: aiResponse.response.outputTokens,
      cachedTokens: aiResponse.response.cachedTokens,
      isRetry: aiResponse.attempts.length > 1,
      isFallback: aiResponse.response.provider !== 'gemini',
      latencyMs: aiResponse.response.latencyMs,
      success: true,
    },
    aiResponse.response
  );

  // 16. Parse AI response
  const parsedResponse = parseAssistantResponse(aiResponse.response.content);

  // 17. Execute validated tool calls (if any)
  const toolContext = {
    organizationId,
    conversationId: conversation.id,
    patientPhone: incomingMessage.fromPhone,
    timezone: clinicContext.clinicProfile.timezone,
  };

  if (parsedResponse.tool_calls?.length) {
    for (const toolCall of parsedResponse.tool_calls.slice(0, clinicContext.plan?.max_tool_calls_per_turn ?? 5)) {
      try {
        await executeTool(toolContext, toolCall.name, toolCall.arguments);
      } catch (err) {
        console.error(`Tool execution error [${toolCall.name}]:`, err);
      }
    }
  }

  // 18. Handle human handoff or personal / out of scope conversation
  if (parsedResponse.intent === 'out_of_scope' || !parsedResponse.user_message?.trim()) {
    console.log(`[Meta WhatsApp] Message from ${incomingMessage.fromPhone} identified as personal/day-to-day conversation (out_of_scope). Silently handing off to human.`);
    await admin
      .from('conversations')
      .update({
        owner: 'human',
        status: 'handed_off',
        handoff_reason: 'personal_day_to_day_chat',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);
    return; // Strictly remain silent — do not send any message
  }

  if (parsedResponse.handoff_required) {
    await admin
      .from('conversations')
      .update({
        owner: 'human',
        status: 'handed_off',
        handoff_reason: 'ai_handoff_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);
  }

  // 19. Send reply
  const replyText = parsedResponse.user_message;
  if (!replyText) {
    return;
  }

  const sendResult = await sendWhatsAppMessage(
    organizationId,
    incomingMessage.fromPhone,
    replyText
  );

  // 20. Save outgoing message
  await admin.from('messages').insert({
    conversation_id: conversation.id,
    organization_id: organizationId,
    role: 'assistant',
    content: replyText,
    status: sendResult.success ? 'sent' : 'failed',
    external_id: sendResult.messageId,
    sent_at: sendResult.success ? new Date().toISOString() : null,
    failed_at: !sendResult.success ? new Date().toISOString() : null,
    failure_reason: sendResult.error,
  });

  // 21. Update webhook event status
  await admin
    .from('webhook_events')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('external_event_id', incomingMessage.messageId)
    .eq('provider', 'whatsapp');
}

// ============================================================
// Helpers
// ============================================================
async function loadClinicContext(organizationId: string) {
  const admin = createSupabaseAdminClient();

  const [profileRes, agentRes, servicesRes, hoursRes, policyRes, subRes, knowledgeRes] =
    await Promise.all([
      admin.from('clinic_profiles').select('*').eq('organization_id', organizationId).single(),
      admin
        .from('agent_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('version', { ascending: false })
        .limit(1)
        .single(),
      admin.from('services').select('*').eq('organization_id', organizationId).eq('is_active', true),
      admin.from('working_hours').select('*').eq('organization_id', organizationId),
      admin.from('booking_policies').select('*').eq('organization_id', organizationId).maybeSingle(),
      admin
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('organization_id', organizationId)
        .single(),
      admin
        .from('knowledge_documents')
        .select('title, content')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(10),
    ]);

  if (!profileRes.data || !agentRes.data) return null;

  const knowledge = (knowledgeRes.data ?? [])
    .map((d: { title: string; content: string }) => `## ${d.title}\n${d.content}`)
    .join('\n\n');

  return {
    clinicProfile: profileRes.data,
    agentConfig: agentRes.data,
    services: servicesRes.data ?? [],
    workingHours: hoursRes.data ?? [],
    bookingPolicy: policyRes.data ?? null,
    knowledge,
    plan: (subRes.data?.subscription_plans as Record<string, number>) ?? null,
  };
}

async function getOrCreateConversation(
  organizationId: string,
  patientPhone: string
): Promise<{ id: string; owner: string; status: string }> {
  const admin = createSupabaseAdminClient();

  // Try to find active or handed off conversation
  const { data: existing } = await admin
    .from('conversations')
    .select('id, owner, status')
    .eq('organization_id', organizationId)
    .eq('patient_phone', patientPhone)
    .in('status', ['active', 'handed_off'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing;
  }

  // Create new conversation
  const { data: created } = await admin
    .from('conversations')
    .insert({
      organization_id: organizationId,
      patient_phone: patientPhone,
      channel: 'whatsapp',
      status: 'active',
      owner: 'ai',
      last_message_at: new Date().toISOString(),
    })
    .select('id, owner, status')
    .single();

  return created!;
}
