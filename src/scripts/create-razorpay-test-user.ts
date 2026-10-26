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
  const email = 'razorpay.test@arenova.in';
  const password = 'RazorpayTest@2025!';
  const fullName = 'Razorpay Test Reviewer';

  console.log(`[1/6] Checking user: ${email}...`);
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) throw listErr;

  const existingUser = userList?.users?.find(u => u.email === email);

  let userId: string;
  if (existingUser) {
    console.log(`User exists (ID: ${existingUser.id}), updating password and confirming email...`);
    userId = existingUser.id;
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, organization_name: 'Arenova Health & Dental Clinic' },
    });
    if (updErr) throw updErr;
  } else {
    console.log('Creating new user in auth.users...');
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, organization_name: 'Arenova Health & Dental Clinic' },
    });
    if (createErr) throw createErr;
    userId = newUser.user.id;
    console.log(`User created (ID: ${userId})`);
  }

  // 2. User Profile
  console.log('[2/6] Updating user_profiles...');
  await supabase.from('user_profiles').upsert({
    id: userId,
    full_name: fullName,
    phone: '+919876543210',
    is_super_admin: false,
    updated_at: new Date().toISOString(),
  });

  // 3. Organization
  console.log('[3/6] Setting up organization...');
  const orgSlug = 'arenova-health-demo';
  let { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).maybeSingle();

  if (!org) {
    const { data: newOrg, error: orgErr } = await supabase.from('organizations').insert({
      name: 'Arenova Health & Dental Clinic',
      slug: orgSlug,
      status: 'active',
      timezone: 'Asia/Kolkata',
      country: 'IN',
    }).select('id').single();
    if (orgErr) throw orgErr;
    org = newOrg;
  }
  const orgId = org!.id;

  // 4. Organization Membership
  console.log('[4/6] Assigning organization membership as owner...');
  await supabase.from('organization_memberships').upsert({
    organization_id: orgId,
    user_id: userId,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,user_id' });

  // 5. Clinic Profile
  console.log('[5/6] Populating clinic profile...');
  await supabase.from('clinic_profiles').upsert({
    organization_id: orgId,
    clinic_name: 'Arenova Health & Dental Clinic',
    business_type: 'dental_clinic',
    address_line1: 'Suite 402, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560038',
    country: 'IN',
    phone: '+91 98765 43210',
    email: email,
    website: 'https://frontdesk.arenova.in',
    timezone: 'Asia/Kolkata',
    onboarding_step: 8,
    onboarding_completed_at: new Date().toISOString(),
    google_maps_url: 'https://maps.google.com/?q=12.9783,77.6408',
    google_review_link: 'https://g.page/r/arenova-health/review',
    auto_review_request: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id' });

  // 6. Subscription
  console.log('[6/6] Ensuring active Pro subscription...');
  const proPlanId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('subscriptions').upsert({
    organization_id: orgId,
    plan_id: proPlanId,
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: expiresAt,
    messages_used_inbound: 14,
    messages_used_outbound: 18,
    ai_requests_used: 22,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id' });

  // 7. Ensure bookable services exist
  const { data: existingSvcs } = await supabase.from('services').select('id').eq('organization_id', orgId);
  if (!existingSvcs || existingSvcs.length === 0) {
    await supabase.from('services').insert([
      {
        organization_id: orgId,
        name: 'Comprehensive Dental Consultation',
        description: 'Complete oral cavity examination with digital intraoral X-ray',
        price_min: 500,
        price_max: 500,
        price_display: '₹500',
        duration_minutes: 30,
        is_bookable: true,
        is_active: true,
        sort_order: 1,
      },
      {
        organization_id: orgId,
        name: 'Advanced Teeth Cleaning & Ultrasonic Scaling',
        description: 'Full mouth deep plaque removal, polishing, and stain cleanup',
        price_min: 1500,
        price_max: 1500,
        price_display: '₹1,500',
        duration_minutes: 45,
        is_bookable: true,
        is_active: true,
        sort_order: 2,
      },
      {
        organization_id: orgId,
        name: 'Laser Teeth Whitening (Smile Care)',
        description: 'In-office clinical teeth bleaching for high aesthetic brightness',
        price_min: 4500,
        price_max: 4500,
        price_display: '₹4,500',
        duration_minutes: 60,
        is_bookable: true,
        is_active: true,
        sort_order: 3,
      },
    ]);
  }

  // 8. Test signIn
  console.log('Testing credentials verification...');
  const testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: authResult, error: signInError } = await testClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('SIGN IN VERIFICATION FAILED:', signInError);
    process.exit(1);
  }

  console.log('==============================================');
  console.log('RAZORPAY TEST ACCOUNT READY FOR COMPLIANCE:');
  console.log('Email / Username:', email);
  console.log('Password:        ', password);
  console.log('User ID:         ', userId);
  console.log('Organization:    ', 'Arenova Health & Dental Clinic');
  console.log('Login Status:     VERIFIED & ACTIVE');
  console.log('==============================================');
}

main().catch(err => {
  console.error('Script Error:', err);
  process.exit(1);
});
