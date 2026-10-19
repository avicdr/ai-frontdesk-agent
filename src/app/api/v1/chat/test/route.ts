// src/app/api/v1/chat/test/route.ts
// AI Agent Test Playground API — allows clinic owners to test-drive their receptionist in real-time

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { loadClinicContext } from '@/lib/security/tenant';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { AIProviderFactory } from '@/lib/ai/provider';
import { executeTool } from '@/lib/ai/tools';
import { z } from 'zod';

const TestChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  simulatePhone: z.string().default('+919876543210'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const body = await request.json();
    const parsed = TestChatSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { messages, simulatePhone } = parsed.data;

    // Load full clinic context
    const clinicContext = await loadClinicContext(membership.organization_id);
    if (!clinicContext) return Errors.notFound('Clinic context not found');

    const systemPrompt = buildSystemPrompt(clinicContext);

    // Call AI Provider with fallback
    const start = Date.now();
    const aiResponse = await AIProviderFactory.generateWithFallback({
      organizationId: membership.organization_id,
      conversationId: 'test-sandbox',
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      systemPrompt,
      maxInputTokens: 8000,
      maxOutputTokens: 700,
    });

    const executionLog: Array<{ tool: string; args: unknown; result: unknown }> = [];

    // If model triggered any tools, execute them safely in sandbox mode
    let finalContent = aiResponse.response.content;
    const toolCalls = aiResponse.response.toolCalls ?? [];

    if (toolCalls.length > 0) {
      for (const call of toolCalls) {
        try {
          const result = await executeTool(
            {
              organizationId: membership.organization_id,
              conversationId: 'test-sandbox',
              patientPhone: simulatePhone,
              timezone: clinicContext.timezone || 'Asia/Kolkata',
            },
            call.name,
            call.arguments
          );
          executionLog.push({ tool: call.name, args: call.arguments, result });
        } catch (toolErr) {
          executionLog.push({ tool: call.name, args: call.arguments, result: { error: String(toolErr) } });
        }
      }
    }

    return successResponse({
      reply: finalContent,
      toolCalls,
      executionLog,
      provider: aiResponse.response.provider,
      model: aiResponse.response.model,
      inputTokens: aiResponse.response.inputTokens,
      outputTokens: aiResponse.response.outputTokens,
      latencyMs: Date.now() - start,
    });
  } catch (err) {
    console.error('Test chat error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
