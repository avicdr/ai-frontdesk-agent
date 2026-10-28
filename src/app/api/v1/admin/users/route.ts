// src/app/api/v1/admin/users/route.ts
// Platform Super-Admin User Management API (list, create, edit, reassign clinic, reset password, ban, delete)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/security/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function verifySuperAdmin(admin: any, user: any) {
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  return isSuperAdminUser(user, profile);
}

// ------------------------------------------------------------
// GET: List all users with profile, auth data, and clinic memberships
// ------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const isAuthorized = await verifySuperAdmin(admin, user);
    if (!isAuthorized) {
      return Errors.forbidden('Super-admin privileges required');
    }

    // 1. Fetch all auth users from Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError || !authData?.users) {
      console.error('Failed to list auth users:', authError);
      return Errors.internalError(authError?.message || 'Failed to list users');
    }

    // 2. Fetch profiles, memberships, and organizations in parallel
    const [profilesRes, membershipsRes, orgsRes] = await Promise.all([
      admin.from('user_profiles').select('*'),
      admin.from('organization_memberships').select(`
        id,
        user_id,
        organization_id,
        role,
        accepted_at,
        created_at,
        organizations (
          id,
          name,
          slug,
          status,
          business_type
        )
      `),
      admin.from('organizations').select('id, name, slug, status').order('name', { ascending: true }),
    ]);

    const profilesMap = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
    
    // Group memberships by user_id
    const membershipsMap = new Map<string, any[]>();
    for (const m of membershipsRes.data || []) {
      const list = membershipsMap.get(m.user_id) || [];
      list.push(m);
      membershipsMap.set(m.user_id, list);
    }

    // 3. Assemble combined user objects
    const combinedUsers = authData.users.map((authUser: any) => {
      const profile = profilesMap.get(authUser.id);
      const userMemberships = membershipsMap.get(authUser.id) || [];
      const isSuper = isSuperAdminUser(authUser, profile);
      const isBanned = authUser.banned_until ? new Date(authUser.banned_until) > new Date() : false;

      const memberships = userMemberships.map((m: any) => ({
        membershipId: m.id,
        organizationId: m.organization_id,
        organizationName: m.organizations?.name || 'Unknown Clinic',
        organizationSlug: m.organizations?.slug || '',
        organizationStatus: m.organizations?.status || 'active',
        businessType: m.organizations?.business_type || 'dental_clinic',
        role: m.role,
        acceptedAt: m.accepted_at,
        createdAt: m.created_at,
      }));

      // Determine primary role for display
      let displayRole = 'User (No Clinic)';
      if (isSuper) {
        displayRole = 'Super Admin';
      } else if (memberships.length > 0) {
        const primaryRole = memberships[0].role;
        displayRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1);
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        phone: profile?.phone || authUser.phone || authUser.user_metadata?.phone || '',
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        isSuperAdmin: isSuper,
        isBanned,
        bannedUntil: authUser.banned_until || null,
        emailConfirmed: !!authUser.email_confirmed_at,
        emailConfirmedAt: authUser.email_confirmed_at || null,
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at || null,
        displayRole,
        memberships,
      };
    });

    // Sort by created_at descending
    combinedUsers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return successResponse({
      users: combinedUsers,
      organizations: orgsRes.data || [],
      totalCount: combinedUsers.length,
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError(err?.message || 'Failed to fetch users');
  }
}

// ------------------------------------------------------------
// POST: Create a new user
// ------------------------------------------------------------
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().optional().default(''),
  isSuperAdmin: z.boolean().optional().default(false),
  organizationId: z.string().uuid().optional().nullable(),
  role: z.enum(['owner', 'admin', 'staff', 'viewer']).optional().default('staff'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const isAuthorized = await verifySuperAdmin(admin, user);
    if (!isAuthorized) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { email, password, fullName, phone, isSuperAdmin, organizationId, role } = parsed.data;

    // 1. Create user in Supabase Auth
    const { data: newAuthData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (createError || !newAuthData?.user) {
      return Errors.badRequest(createError?.message || 'Failed to create user account');
    }

    const newUserId = newAuthData.user.id;

    // 2. Create profile in user_profiles
    await admin.from('user_profiles').upsert({
      id: newUserId,
      full_name: fullName,
      phone,
      is_super_admin: isSuperAdmin,
      updated_at: new Date().toISOString(),
    });

    // 3. Assign organization membership if specified
    if (organizationId) {
      await admin.from('organization_memberships').insert({
        organization_id: organizationId,
        user_id: newUserId,
        role,
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
      });
    }

    // 4. Log audit event
    await admin.from('audit_logs').insert({
      organization_id: organizationId || null,
      actor_id: user.id,
      actor_type: 'super_admin',
      action: 'user_created',
      entity_type: 'user',
      entity_id: newUserId,
      new_state: { email, fullName, phone, isSuperAdmin, organizationId, role },
    });

    return successResponse({
      message: 'User created successfully',
      userId: newUserId,
    });
  } catch (err: any) {
    console.error('Error creating user:', err);
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError(err?.message || 'Failed to create user');
  }
}

// ------------------------------------------------------------
// PATCH: Update user profile, permissions, clinic membership, or password
// ------------------------------------------------------------
const UpdateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  isSuperAdmin: z.boolean().optional(),
  password: z.string().min(6).optional(),
  emailConfirm: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  // Clinic assignment
  organizationId: z.string().uuid().nullable().optional(),
  role: z.enum(['owner', 'admin', 'staff', 'viewer']).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const isAuthorized = await verifySuperAdmin(admin, user);
    if (!isAuthorized) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const {
      userId,
      fullName,
      phone,
      isSuperAdmin,
      password,
      emailConfirm,
      isBanned,
      organizationId,
      role,
    } = parsed.data;

    // 1. Update Auth attributes if password, emailConfirm, or ban status changed
    const authUpdates: Record<string, any> = {};
    if (password) authUpdates.password = password;
    if (emailConfirm !== undefined) authUpdates.email_confirm = emailConfirm;
    if (isBanned !== undefined) {
      authUpdates.ban_duration = isBanned ? '876000h' : 'none'; // 100 years or unban
    }
    if (fullName !== undefined || phone !== undefined) {
      authUpdates.user_metadata = {
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
      };
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, authUpdates);
      if (authUpdateError) {
        return Errors.badRequest(authUpdateError.message || 'Failed to update auth properties');
      }
    }

    // 2. Update user_profiles table
    const profileUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (isSuperAdmin !== undefined) {
      // Prevent super admin from accidentally removing their own super admin status
      if (userId === user.id && !isSuperAdmin) {
        return Errors.badRequest('You cannot remove your own super-admin status');
      }
      profileUpdates.is_super_admin = isSuperAdmin;
    }

    await admin.from('user_profiles').upsert({
      id: userId,
      ...profileUpdates,
    });

    // 3. Handle Organization Membership Assignment
    if (organizationId !== undefined) {
      if (organizationId === null) {
        // Remove membership
        await admin.from('organization_memberships').delete().eq('user_id', userId);
      } else {
        // Upsert or update membership
        const newRole = role || 'staff';
        const { data: existingMem } = await admin
          .from('organization_memberships')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingMem) {
          await admin
            .from('organization_memberships')
            .update({
              organization_id: organizationId,
              role: newRole,
            })
            .eq('id', existingMem.id);
        } else {
          await admin.from('organization_memberships').insert({
            organization_id: organizationId,
            user_id: userId,
            role: newRole,
            invited_by: user.id,
            accepted_at: new Date().toISOString(),
          });
        }
      }
    } else if (role !== undefined) {
      // Just update role within current organization
      await admin
        .from('organization_memberships')
        .update({ role })
        .eq('user_id', userId);
    }

    // 4. Audit log
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_type: 'super_admin',
      action: 'user_updated',
      entity_type: 'user',
      entity_id: userId,
      new_state: { fullName, phone, isSuperAdmin, isBanned, organizationId, role },
    });

    return successResponse({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('Error updating user:', err);
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError(err?.message || 'Failed to update user');
  }
}

// ------------------------------------------------------------
// DELETE: Delete a user completely
// ------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const isAuthorized = await verifySuperAdmin(admin, user);
    if (!isAuthorized) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Errors.badRequest('userId parameter is required');
    }

    if (userId === user.id) {
      return Errors.badRequest('You cannot delete your own account');
    }

    // 1. Delete memberships and profile
    await admin.from('organization_memberships').delete().eq('user_id', userId);
    await admin.from('user_profiles').delete().eq('id', userId);

    // 2. Delete user from Supabase Auth
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return Errors.internalError(deleteError.message || 'Failed to delete user');
    }

    // 3. Audit log
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_type: 'super_admin',
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: userId,
    });

    return successResponse({ message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError(err?.message || 'Failed to delete user');
  }
}
