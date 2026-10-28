// src/app/api/v1/admin/init/route.ts
// Provision platform super-admin account (Protected One-Time Setup Endpoint)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function verifyInitToken(request: NextRequest): boolean {
  const secret = process.env.ADMIN_INIT_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    // In production, refuse unauthenticated provisioning if no secret is configured
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
  }

  const authHeader = request.headers.get('authorization') || '';
  const customHeader = request.headers.get('x-admin-init-secret') || '';

  let providedToken = '';
  if (authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (customHeader) {
    providedToken = customHeader.trim();
  }

  if (!providedToken || !secret) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(secret, 'utf-8');
    const providedBuf = Buffer.from(providedToken, 'utf-8');
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

async function handleInit(request: NextRequest) {
  // Enforce secure administrative authorization token
  if (!verifyInitToken(request)) {
    return Errors.forbidden('Admin initialization endpoint is locked. Valid authorization secret is required.');
  }

  try {
    const admin = createSupabaseAdminClient();
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return Errors.badRequest('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be configured.');
    }

    // Check if user already exists
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error('List users error:', listError);
      return Errors.internalError('Failed to verify existing administrator accounts');
    }

    let adminUser = users.find((u: any) => u.email?.toLowerCase().trim() === adminEmail.toLowerCase().trim());

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
      // Synchronize confirmed status and metadata
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

    const { error: profileError } = await admin
      .from('user_profiles')
      .upsert(profilePayload)
      .select('id')
      .maybeSingle();

    if (profileError) {
      console.error('Admin profile error:', profileError);
    }

    // Ensure super-admin has an organization membership for clinic operations
    const { data: existingMembership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', adminUser.id)
      .limit(1)
      .maybeSingle();

    let orgId = existingMembership?.organization_id;
    if (!orgId) {
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

    return successResponse({
      message: 'Super-admin account provisioned and synchronized successfully',
      email: adminEmail,
      userId: adminUser.id,
      loginUrl: '/login',
      adminConsoleUrl: '/admin',
    });
  } catch (err: any) {
    console.error('Admin init unexpected error:', err);
    return Errors.internalError('Initialization failed');
  }
}

export async function POST(request: NextRequest) {
  return handleInit(request);
}

export async function GET(request: NextRequest) {
  return handleInit(request);
}
