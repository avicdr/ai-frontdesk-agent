import 'dotenv/config';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class {};
}
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

async function main() {
  const orgId = '5d150e37-f37a-4897-8753-f297609a1022';
  const proPlanId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  const { data: existing } = await supabase.from('subscriptions').select('*').eq('organization_id', orgId).maybeSingle();
  console.log('Existing subscription:', existing);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!existing) {
    const { data: newSub, error: insErr } = await supabase.from('subscriptions').insert({
      organization_id: orgId,
      plan_id: proPlanId,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      ai_requests_used: 0,
      ai_cost_used_inr: 0,
    }).select('*').single();
    console.log('Inserted subscription:', newSub, insErr);
  } else {
    const { data: updatedSub, error: upErr } = await supabase.from('subscriptions').update({
      plan_id: proPlanId,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    }).eq('id', existing.id).select('*').single();
    console.log('Updated subscription:', updatedSub, upErr);
  }

  // Update org and clinic profile
  await supabase.from('organizations').update({ status: 'active' }).eq('id', orgId);
  await supabase.from('clinic_profiles').update({ onboarding_step: 8, onboarding_completed_at: now.toISOString() }).eq('organization_id', orgId);

  // Check clinic profile
  const { data: cp } = await supabase.from('clinic_profiles').select('*').eq('organization_id', orgId).single();
  console.log('Clinic profile updated:', cp?.name, 'onboarding_step:', cp?.onboarding_step);
}

main().catch(console.error);
