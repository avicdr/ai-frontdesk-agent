// src/app/api/v1/admin/init/route.ts
// Provision or check platform super-admin account

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if user already exists
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error('List users error:', listError);
      return Errors.internalError(listError.message);
    }

    let adminUser = users.find((u: any) => u.email === adminEmail);

    if (!adminUser) {
      // Create super-admin user in Supabase auth
      const { data: newUserData, error: createError } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Platform Super Admin',
          role: 'super_admin',
        },
      });

      if (createError || !newUserData.user) {
        console.error('Failed to create admin user:', createError);
        return Errors.internalError(createError?.message || 'Failed to create admin');
      }

      adminUser = newUserData.user;
    } else {
      // Make sure password is synchronized and email is confirmed
      await admin.auth.admin.updateUserById(adminUser.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Platform Super Admin',
          role: 'super_admin',
        },
      });
    }

    // Ensure complete proper admin profile in user_profiles
    const profilePayload = {
      id: adminUser.id,
      full_name: 'Platform Super Admin',
      phone: '+91 99999 99999',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      is_super_admin: true,
      updated_at: new Date().toISOString(),
    };

    const { data: upsertedProfile, error: profileError } = await admin
      .from('user_profiles')
      .upsert(profilePayload)
      .select('*')
      .maybeSingle();

    // Also check if admin has an organization for full clinic dashboard compatibility
    const { data: existingMembership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', adminUser.id)
      .maybeSingle();

    let orgId = existingMembership?.organization_id;
    if (!orgId) {
      // Check if there is an existing platform or dental organization
      const { data: firstOrg } = await admin
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (firstOrg?.id) {
        orgId = firstOrg.id;
      } else {
        const { data: createdOrg } = await admin
          .from('organizations')
          .insert({
            name: 'Apex Dental Care (Platform Admin Clinic)',
            slug: 'apex-platform-admin',
            business_type: 'dental_clinic',
            status: 'active',
          })
          .select('id')
          .maybeSingle();
        orgId = createdOrg?.id;
      }

      if (orgId) {
        await admin
          .from('organization_memberships')
          .upsert({
            organization_id: orgId,
            user_id: adminUser.id,
            role: 'owner',
          });
      }
    }

    // Read back final profile to verify
    const { data: verifiedProfile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .maybeSingle();

    return successResponse({
      message: 'Super-admin credentials and profile configured successfully',
      email: adminEmail,
      userId: adminUser.id,
      verifiedProfile,
      profileError: profileError ? profileError.message : null,
      loginUrl: '/login',
      adminConsoleUrl: '/admin',
      credentialsNotice: 'Default credentials set: admin@aifrontdesk.com / Admin@FrontDesk2025!',
    });
  } catch (err: any) {
    console.error('Admin init unexpected error:', err);
    return Errors.internalError(err?.message || 'Initialization failed');
  }
}
