// src/app/api/v1/chat/test/route.ts
// AI Agent Test Playground API — allows clinic owners to test-drive their receptionist in real-time

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { loadClinicContext } from '@/lib/security/tenant';
import { buildSystemPrompt, parseAssistantResponse } from '@/lib/ai/prompts';
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
    let user = await getServerUser();
    const admin = createSupabaseAdminClient();

    // In local development or during sandbox playground testing, allow mock doctor user
    if (!user) {
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        user = { id: 'demo-doctor-user', email: 'doctor@apexdental.com' } as any;
      } else {
        return Errors.unauthorized();
      }
    }

    // Resolve organization membership or find existing organization
    let orgId = '';
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (membership?.organization_id) {
      orgId = membership.organization_id;
    } else {
      const { data: existingOrg } = await admin
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();

      orgId = existingOrg?.id || 'demo-org-1';
    }

    const body = await request.json();
    const parsed = TestChatSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { messages, simulatePhone } = parsed.data;

    // Load full clinic context or fallback to comprehensive default
    let clinicContext = await loadClinicContext(orgId);
    if (!clinicContext) {
      clinicContext = {
        clinicProfile: {
          id: 'clinic-profile-demo',
          organization_id: orgId,
          clinic_name: 'Apex Dental & Orthodontics',
          business_type: 'Dental Practice & Implant Centre',
          country: 'IN',
          address_line1: 'Suite 402, Lotus Trade Centre, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400053',
          phone: '+91 98765 43210',
          email: 'care@apexdental.com',
          website: 'https://apexdental.example.com',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          supported_languages: ['English', 'Hindi'],
          onboarding_step: 8,
          onboarding_completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        agentConfig: {
          id: 'agent-config-demo',
          organization_id: orgId,
          version: 1,
          status: 'active' as const,
          assistant_name: 'Aria',
          tone: 'friendly' as const,
          greeting_message: 'Namaste! Welcome to Apex Dental & Orthodontics. I am Aria, your AI receptionist. How can I help you today?',
          use_emoji: true,
          max_response_length: 500,
          handoff_message: 'Let me connect you directly with our clinic front desk team.',
          identifies_as_ai: true,
          supported_languages: ['English', 'Hindi'],
          custom_instructions: 'Be polite, warm, and helpful. Clearly communicate dental service fees and clinic timings.',
          created_by: null,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        services: [
          {
            id: 'srv-1',
            organization_id: orgId,
            name: 'Routine Dental Consultation & Checkup',
            description: 'Comprehensive oral examination, digital X-rays evaluation, and personalized treatment plan.',
            duration_minutes: 30,
            price_display: '₹500',
            price_amount: 500,
            is_active: true,
            is_bookable: true,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'srv-2',
            organization_id: orgId,
            name: 'Professional Teeth Cleaning (Scaling & Polishing)',
            description: 'Ultrasonic removal of dental plaque, tartar, and surface stains followed by polishing.',
            duration_minutes: 45,
            price_display: '₹1,200',
            price_amount: 1200,
            is_active: true,
            is_bookable: true,
            sort_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'srv-3',
            organization_id: orgId,
            name: 'Root Canal Treatment (RCT)',
            description: 'Painless single/multi-sitting rotary endodontic therapy for infected or painful tooth.',
            duration_minutes: 60,
            price_display: '₹4,500',
            price_amount: 4500,
            is_active: true,
            is_bookable: true,
            sort_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'srv-4',
            organization_id: orgId,
            name: 'Teeth Whitening (Laser Bleaching)',
            description: 'In-office advanced LED laser whitening delivering 4-8 shades brighter smile.',
            duration_minutes: 45,
            price_display: '₹3,000',
            price_amount: 3000,
            is_active: true,
            is_bookable: true,
            sort_order: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'srv-5',
            organization_id: orgId,
            name: 'Dental Extraction (Simple)',
            description: 'Gentle, pain-free tooth removal under local anesthesia with post-op care guidance.',
            duration_minutes: 30,
            price_display: '₹1,500',
            price_amount: 1500,
            is_active: true,
            is_bookable: true,
            sort_order: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'srv-6',
            organization_id: orgId,
            name: 'Emergency Dental Pain Relief',
            description: 'Immediate diagnostic relief for severe toothache, broken restoration, or swelling.',
            duration_minutes: 30,
            price_display: '₹800',
            price_amount: 800,
            is_active: true,
            is_bookable: true,
            sort_order: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        workingHours: [
          { id: 'wh-1', organization_id: orgId, day_of_week: 1, is_open: true, open_time: '09:00', close_time: '20:00', break_start: '13:30', break_end: '14:30', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-2', organization_id: orgId, day_of_week: 2, is_open: true, open_time: '09:00', close_time: '20:00', break_start: '13:30', break_end: '14:30', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-3', organization_id: orgId, day_of_week: 3, is_open: true, open_time: '09:00', close_time: '20:00', break_start: '13:30', break_end: '14:30', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-4', organization_id: orgId, day_of_week: 4, is_open: true, open_time: '09:00', close_time: '20:00', break_start: '13:30', break_end: '14:30', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-5', organization_id: orgId, day_of_week: 5, is_open: true, open_time: '09:00', close_time: '20:00', break_start: '13:30', break_end: '14:30', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-6', organization_id: orgId, day_of_week: 6, is_open: true, open_time: '09:00', close_time: '18:00', break_start: null, break_end: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'wh-0', organization_id: orgId, day_of_week: 0, is_open: false, open_time: '10:00', close_time: '14:00', break_start: null, break_end: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        bookingPolicy: {
          id: 'bp-demo',
          organization_id: orgId,
          buffer_minutes: 15,
          min_advance_hours: 2,
          max_advance_days: 30,
          cancellation_hours: 4,
          reschedule_hours: 4,
          requires_approval: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        knowledge: `## About Apex Dental & Orthodontics
Apex Dental & Orthodontics is a premier multispeciality dental clinic in Mumbai with over 12 years of clinical excellence. We offer painless dentistry, 3D intraoral scanning, digital radiography with 90% reduced radiation, and strict sterilization protocols adhering to OSHA standards.

## Location & Parking
Located at Suite 402, Lotus Trade Centre, Andheri West, Mumbai, 400053. 3 minutes walking distance from Andheri Metro Station. Free dedicated basement valet parking available for clinic patients.

## Payment Methods
We accept UPI (GPay, PhonePe, Paytm), Credit/Debit cards, Net Banking, and cash. Flexible 0% EMI available for root canals, implants, and orthodontic aligners.`,
        plan: {
          name: 'Pro Clinic',
          included_ai_requests: 2000,
          included_inbound_messages: 5000,
        } as any,
        timezone: 'Asia/Kolkata',
      } as any;
    }

    const systemPrompt = buildSystemPrompt(clinicContext as any);

    // Call AI Provider with fallback and graceful mock simulation
    const start = Date.now();
    let reply = '';
    let provider = 'gemini';
    let model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    let inputTokens = 150;
    let outputTokens = 75;
    let latencyMs = 0;
    let toolCalls: any[] = [];
    const executionLog: Array<{ tool: string; args: unknown; result: unknown }> = [];

    try {
      const aiResponse = await AIProviderFactory.generateWithFallback({
        organizationId: orgId,
        conversationId: 'test-sandbox',
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        systemPrompt,
        maxInputTokens: 8000,
        maxOutputTokens: 700,
      });

      const parsed = parseAssistantResponse(aiResponse.response.content);
      reply = parsed.user_message || aiResponse.response.content;
      provider = aiResponse.response.provider;
      model = aiResponse.response.model;
      inputTokens = aiResponse.response.inputTokens;
      outputTokens = aiResponse.response.outputTokens;
      toolCalls = (parsed.tool_calls && parsed.tool_calls.length > 0)
        ? parsed.tool_calls
        : (aiResponse.response.toolCalls ?? []);
      latencyMs = Date.now() - start;

      // Execute tools safely if called
      if (toolCalls.length > 0) {
        for (const call of toolCalls) {
          try {
            const result = await executeTool(
              {
                organizationId: orgId,
                conversationId: 'test-sandbox',
                patientPhone: simulatePhone,
                timezone: (clinicContext as any)?.timezone || 'Asia/Kolkata',
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
    } catch (aiErr) {
      console.warn('AI Provider fallback to simulated clinic receptionist:', aiErr);
      latencyMs = Date.now() - start;
      provider = 'simulated-aria';
      model = 'apex-receptionist-v1';

      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
      if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('service') || lastUserMsg.includes('treatment') || lastUserMsg.includes('offer')) {
        reply = "Namaste! At Apex Dental & Orthodontics, we provide complete oral care. Here are our standard service fees:\n• Routine Dental Consultation & Checkup: ₹500 (30 mins)\n• Teeth Cleaning & Polishing (Scaling): ₹1,200 (45 mins)\n• Root Canal Treatment (RCT): ₹4,500 (60 mins)\n• Teeth Whitening (Laser Bleaching): ₹3,000 (45 mins)\n• Simple Tooth Extraction: ₹1,500 (30 mins)\n• Emergency Dental Pain Relief: ₹800 (30 mins)\n\nWould you like me to reserve an appointment for any of these?";
      } else if (lastUserMsg.includes('time') || lastUserMsg.includes('hour') || lastUserMsg.includes('open') || lastUserMsg.includes('when')) {
        reply = "Our clinic is open Monday through Friday from 9:00 AM to 8:00 PM, and Saturdays from 9:00 AM to 6:00 PM. We are closed on Sundays for scheduled clinical sterilization. What time would suit you best?";
      } else if (lastUserMsg.includes('address') || lastUserMsg.includes('location') || lastUserMsg.includes('where')) {
        reply = "We are located at Suite 402, Lotus Trade Centre, Andheri West, Mumbai (just 3 minutes walk from Andheri Metro Station). Dedicated basement valet parking is available for clinic patients!";
      } else if (lastUserMsg.includes('book') || lastUserMsg.includes('appointment') || lastUserMsg.includes('slot')) {
        reply = "I would be happy to book your appointment! Could you please share your preferred day (e.g., tomorrow or this Saturday) and time (morning or evening), along with your full name?";
      } else {
        reply = `Hello! Thank you for reaching out to Apex Dental & Orthodontics. I am Aria, your AI front desk assistant. I can help you with scheduling appointments, checking service fees, clinic hours, or answering dental questions. How may I assist you today?`;
      }
    }

    return successResponse({
      reply,
      toolCalls,
      executionLog,
      provider,
      model,
      inputTokens,
      outputTokens,
      latencyMs,
    });
  } catch (err) {
    console.error('Test chat unexpected error:', err);
    return Errors.internalError('Failed to process chat test request');
  }
}
