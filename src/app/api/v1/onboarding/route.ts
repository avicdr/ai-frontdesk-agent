// src/app/api/v1/onboarding/route.ts
// Create organization and initial user profile after registration

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const OnboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  organizationName: z.string().min(2).max(100),
  country: z.string().length(2).default('IN'),
  timezone: z.string().default('Asia/Kolkata'),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + nanoid(6);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const body = await request.json();
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { fullName, phone, organizationName, country, timezone } = parsed.data;
    const admin = createSupabaseAdminClient();

    // Check if user already has an organization
    const { data: existingMembership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMembership) {
      // Already onboarded — return existing org
      const { data: org } = await admin
        .from('organizations')
        .select('*')
        .eq('id', existingMembership.organization_id)
        .single();
      return successResponse({ organization: org });
    }

    // Create user profile
    await admin.from('user_profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone,
    });

    // Create organization
    const slug = generateSlug(organizationName);
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: organizationName,
        slug,
        country,
        timezone,
        status: 'onboarding',
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error('Org creation error:', orgError);
      return Errors.internalError();
    }

    // Create owner membership
    await admin.from('organization_memberships').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

    // Create initial clinic profile
    await admin.from('clinic_profiles').insert({
      organization_id: org.id,
      clinic_name: organizationName,
      country,
      timezone,
      onboarding_step: 1,
    });

    // Create default agent configuration (draft)
    await admin.from('agent_configurations').insert({
      organization_id: org.id,
      version: 1,
      status: 'draft',
      assistant_name: 'Aria',
      tone: 'friendly',
      greeting_message: `Hello! I'm Aria, the AI receptionist for ${organizationName}. How can I help you today?`,
      created_by: user.id,
    });

    // Create default working hours (Mon-Fri 9-6, closed weekends)
    const defaultHours = [0, 1, 2, 3, 4, 5, 6].map(day => ({
      organization_id: org.id,
      day_of_week: day,
      is_open: day >= 1 && day <= 5,
      open_time: day >= 1 && day <= 5 ? '09:00' : null,
      close_time: day >= 1 && day <= 5 ? '18:00' : null,
    }));
    await admin.from('working_hours').insert(defaultHours);

    // Create default booking policy
    await admin.from('booking_policies').insert({
      organization_id: org.id,
    });

    // Audit log
    await admin.from('audit_logs').insert({
      organization_id: org.id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'organization_created',
      entity_type: 'organization',
      entity_id: org.id,
    });

    return successResponse({ organization: org }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Onboarding error:', err);
    return Errors.internalError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return successResponse({ status: 'not_started', currentStep: 0 });
    }

    const [profileRes, agentRes, servicesRes, policyRes, orgRes] = await Promise.all([
      admin.from('clinic_profiles').select('*').eq('organization_id', membership.organization_id).maybeSingle(),
      admin.from('agent_configurations').select('*').eq('organization_id', membership.organization_id).order('version', { ascending: false }).limit(1).maybeSingle(),
      admin.from('services').select('*').eq('organization_id', membership.organization_id).order('sort_order', { ascending: true }),
      admin.from('booking_policies').select('*').eq('organization_id', membership.organization_id).maybeSingle(),
      admin.from('organizations').select('name').eq('id', membership.organization_id).maybeSingle(),
    ]);

    return successResponse({
      status: profileRes.data?.onboarding_completed_at ? 'completed' : 'in_progress',
      currentStep: profileRes.data?.onboarding_step ?? 1,
      organizationId: membership.organization_id,
      clinicProfile: profileRes.data,
      agentConfig: agentRes.data,
      services: servicesRes.data ?? [],
      bookingPolicy: policyRes.data,
      organizationName: orgRes.data?.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    let { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const body = await request.json();
    let orgId: string;

    if (!membership) {
      const orgName = body.clinicInfo?.clinicName || 'Apex Dental & Orthodontics';
      const { data: newOrg } = await admin
        .from('organizations')
        .insert({
          name: orgName,
          slug: `clinic-${user.id.slice(0, 8)}`,
          country: 'IN',
          timezone: body.clinicInfo?.timezone || 'Asia/Kolkata',
          status: 'active',
        })
        .select()
        .single();

      if (newOrg) {
        await admin.from('organization_memberships').insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          accepted_at: new Date().toISOString(),
        });

        await admin.from('clinic_profiles').insert({
          organization_id: newOrg.id,
          clinic_name: orgName,
          country: 'IN',
          timezone: body.clinicInfo?.timezone || 'Asia/Kolkata',
          onboarding_step: body.step || 8,
        });

        orgId = newOrg.id;
      } else {
        return Errors.internalError();
      }
    } else {
      orgId = membership.organization_id;
    }

    // 1. Update clinic profile
    if (body.clinicInfo) {
      await admin.from('clinic_profiles').update({
        clinic_name: body.clinicInfo.clinicName,
        phone: body.clinicInfo.phone,
        address_line1: body.clinicInfo.address,
        city: body.clinicInfo.city,
        timezone: body.clinicInfo.timezone || 'Asia/Kolkata',
        updated_at: new Date().toISOString(),
      }).eq('organization_id', orgId);

      if (body.clinicInfo.clinicName) {
        await admin.from('organizations').update({
          name: body.clinicInfo.clinicName,
          timezone: body.clinicInfo.timezone || 'Asia/Kolkata',
          updated_at: new Date().toISOString(),
        }).eq('id', orgId);
      }
    }

    // 2. Update agent configuration
    if (body.agentConfig) {
      await admin.from('agent_configurations').update({
        assistant_name: body.agentConfig.assistantName,
        tone: body.agentConfig.tone,
        greeting_message: body.agentConfig.greetingMessage,
        updated_at: new Date().toISOString(),
      }).eq('organization_id', orgId);
    }

    // 3. Update services
    if (Array.isArray(body.services) && body.services.length > 0) {
      // Clear previous and re-insert
      await admin.from('services').delete().eq('organization_id', orgId);
      const servicesToInsert = body.services.map((s: any, idx: number) => ({
        organization_id: orgId,
        name: s.name,
        price_display: s.price ? `₹${s.price}` : null,
        duration_minutes: s.duration || 30,
        is_bookable: s.isBookable !== false,
        sort_order: idx + 1,
        is_active: true,
      }));
      await admin.from('services').insert(servicesToInsert);
    }

    // 4. Update working hours
    if (Array.isArray(body.workingHours) && body.workingHours.length > 0) {
      await admin.from('working_hours').delete().eq('organization_id', orgId);
      const hoursToInsert = body.workingHours.map((h: any) => ({
        organization_id: orgId,
        day_of_week: h.dayOfWeek,
        is_open: !!h.isOpen,
        open_time: h.isOpen ? h.openTime : null,
        close_time: h.isOpen ? h.closeTime : null,
      }));
      await admin.from('working_hours').insert(hoursToInsert);
    }

    // 5. Update booking policy
    if (body.bookingPolicy) {
      await admin.from('booking_policies').upsert({
        organization_id: orgId,
        min_notice_hours: body.bookingPolicy.minAdvanceHours || 2,
        max_advance_days: body.bookingPolicy.maxAdvanceDays || 30,
        buffer_minutes: body.bookingPolicy.bufferMinutes || 10,
        cancellation_hours: body.bookingPolicy.cancellationHours || 24,
      }, { onConflict: 'organization_id' });
    }

    // 6. Update step and completion
    const step = body.step ?? 1;
    const isComplete = !!body.complete;

    await admin.from('clinic_profiles').update({
      onboarding_step: step,
      ...(isComplete ? { onboarding_completed_at: new Date().toISOString() } : {}),
    }).eq('organization_id', orgId);

    if (isComplete) {
      await admin.from('organizations').update({
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', orgId);
    }

    return successResponse({ success: true, step, completed: isComplete });
  } catch (err) {
    console.error('Onboarding update error:', err);
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
