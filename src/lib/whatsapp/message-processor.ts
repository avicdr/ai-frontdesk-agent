// src/lib/whatsapp/message-processor.ts
// Shared AI Receptionist message processing pipeline for WhatsApp (Baileys & Cloud API)

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { checkQuota, recordAiUsage } from '@/lib/ai/usage';
import { AIProviderFactory } from '@/lib/ai/provider';
import { buildSystemPrompt, parseAssistantResponse } from '@/lib/ai/prompts';
import { executeTool } from '@/lib/ai/tools';
import { nanoid } from 'nanoid';

const SAFE_FALLBACK_MESSAGE =
  "Thank you for reaching out. Our reception is temporarily unavailable. Please call us directly or try again shortly.";

export interface ProcessIncomingOptions {
  organizationId: string;
  fromPhone: string;
  senderName?: string;
  text: string;
  messageId: string;
  sendReply: (text: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export async function processTenantIncomingMessage(options: ProcessIncomingOptions): Promise<void> {
  const { organizationId, fromPhone, senderName, text, messageId, sendReply } = options;
  const admin = createSupabaseAdminClient();
  const requestId = nanoid(12);

  // 1. Deduplicate using message ID
  const { data: existing } = await admin
    .from('webhook_events')
    .select('id')
    .eq('provider', 'whatsapp')
    .eq('external_event_id', messageId)
    .maybeSingle();

  if (existing) {
    return; // Already processed
  }

  // 2. Record incoming event
  const { error: eventError } = await admin.from('webhook_events').insert({
    organization_id: organizationId,
    provider: 'whatsapp',
    external_event_id: messageId,
    payload: { from: fromPhone, text, messageId },
    status: 'processing',
  });

  if (eventError?.code === '23505') {
    return; // Race condition
  }

  // 3. Check subscription quota
  const quota = await checkQuota(organizationId);
  if (!quota.allowed) {
    await sendReply(SAFE_FALLBACK_MESSAGE);
    return;
  }

  // 4. Load clinic context
  const clinicContext = await loadClinicContext(organizationId);
  if (!clinicContext) {
    await sendReply(SAFE_FALLBACK_MESSAGE);
    return;
  }

  // 5. Get or create conversation with patient contact name
  const conversation = await getOrCreateConversation(organizationId, fromPhone, senderName);

  // 6. Save incoming message
  await admin.from('messages').insert({
    conversation_id: conversation.id,
    organization_id: organizationId,
    external_id: messageId,
    role: 'patient',
    content: text,
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  });

  // 7. Load conversation history
  const { data: history } = await admin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const messages = (history ?? [])
    .reverse()
    .map((m: any) => ({
      role: (m.role === 'patient' || m.role === 'user') ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

  // 8. Build system prompt
  const systemPrompt = buildSystemPrompt(clinicContext);

  // 9. Call AI provider
  let aiResponse: Awaited<ReturnType<typeof AIProviderFactory.generateWithFallback>>;
  try {
    aiResponse = await AIProviderFactory.generateWithFallback({
      organizationId,
      conversationId: conversation.id,
      messages,
      systemPrompt,
      maxInputTokens: clinicContext.plan?.max_input_tokens_per_request ?? 8000,
      maxOutputTokens: clinicContext.plan?.max_output_tokens_per_response ?? 700,
    });
  } catch (err) {
    console.error('AI provider error:', err);
    await sendReply(SAFE_FALLBACK_MESSAGE);
    return;
  }

  // 10. Record AI usage
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

  // 11. Parse response & execute tools safely
  const parsedResponse = parseAssistantResponse(aiResponse.response.content);

  const toolContext = {
    organizationId,
    conversationId: conversation.id,
    patientPhone: fromPhone,
    timezone: clinicContext.clinicProfile.timezone,
  };

  const toolResultsSummary: string[] = [];
  if (parsedResponse.tool_calls?.length) {
    for (const toolCall of parsedResponse.tool_calls.slice(0, clinicContext.plan?.max_tool_calls_per_turn ?? 5)) {
      try {
        const result: any = await executeTool(toolContext, toolCall.name, toolCall.arguments);
        if (result?.message) {
          toolResultsSummary.push(result.message);
        }
      } catch (err) {
        console.error(`Tool execution error [${toolCall.name}]:`, err);
      }
    }
  }

  // 12. Human handoff if requested
  if (parsedResponse.handoff_required) {
    await admin
      .from('conversations')
      .update({ owner: 'human', status: 'handed_off' })
      .eq('id', conversation.id);
  }

  // 13. Send reply
  let replyText = parsedResponse.user_message;
  if (!replyText || replyText.trim().length === 0) {
    if (toolResultsSummary.length > 0) {
      replyText = toolResultsSummary.join('\n\n') + '\n\nWould you like me to book one of these slots for you?';
    }
  } else if (toolResultsSummary.length > 0) {
    const hasSummaryAlready = toolResultsSummary.some(s => replyText.includes(s.slice(0, 15)));
    if (!hasSummaryAlready) {
      replyText = `${replyText}\n\n${toolResultsSummary.join('\n\n')}`;
    }
  }

  if (!replyText) return;

  const sendResult = await sendReply(replyText);

  // 14. Save outgoing message
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

  // 15. Complete event
  await admin
    .from('webhook_events')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('external_event_id', messageId)
    .eq('provider', 'whatsapp');
}

async function loadClinicContext(organizationId: string) {
  const admin = createSupabaseAdminClient();

  const [profileRes, agentRes, servicesRes, hoursRes, policyRes, subRes, knowledgeRes] =
    await Promise.all([
      admin.from('clinic_profiles').select('*').eq('organization_id', organizationId).single(),
      admin.from('agent_configurations').select('*').eq('organization_id', organizationId).order('version', { ascending: false }).limit(1).maybeSingle(),
      admin.from('services').select('*').eq('organization_id', organizationId).eq('is_active', true),
      admin.from('working_hours').select('*').eq('organization_id', organizationId),
      admin.from('booking_policies').select('*').eq('organization_id', organizationId).single(),
      admin.from('subscriptions').select('*, subscription_plans(*)').eq('organization_id', organizationId).single(),
      admin.from('knowledge_documents').select('title, content').eq('organization_id', organizationId).eq('status', 'indexed'),
    ]);

  if (!profileRes.data) return null;

  return {
    clinicProfile: profileRes.data,
    agentConfig: agentRes.data,
    services: servicesRes.data ?? [],
    workingHours: hoursRes.data ?? [],
    bookingPolicy: policyRes.data,
    plan: subRes.data?.subscription_plans as any,
    knowledge: (knowledgeRes.data ?? []).map((k: any) => `${k.title}:\n${k.content}`).join('\n\n'),
  };
}

async function getOrCreateConversation(organizationId: string, patientPhone: string, senderName?: string) {
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from('conversations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('patient_phone', patientPhone)
    .in('status', ['active', 'handed_off'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const updateData: Record<string, unknown> = { last_message_at: new Date().toISOString() };
    if (senderName && (!existing.patient_name || existing.patient_name !== senderName)) {
      updateData.patient_name = senderName;
    }
    await admin
      .from('conversations')
      .update(updateData)
      .eq('id', existing.id);
    return { ...existing, ...updateData };
  }

  const { data: newConv } = await admin
    .from('conversations')
    .insert({
      organization_id: organizationId,
      patient_phone: patientPhone,
      patient_name: senderName || null,
      channel: 'whatsapp',
      status: 'active',
      owner: 'ai',
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  return newConv!;
}
