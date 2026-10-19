// src/app/api/v1/cron/route.ts
// Background cron task for subscription expiration checks, grace periods, and quota management

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/service';

export async function GET(request: NextRequest) {
  // Verify cron secret if provided
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Errors.unauthorized('Invalid cron secret');
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();

  const results = {
    expirationsProcessed: 0,
    suspended: 0,
    warningsSent: 0,
  };

  try {
    // 1. Find subscriptions that expired
    const { data: expiredSubs } = await admin
      .from('subscriptions')
      .select('id, organization_id, status, expires_at, grace_period_end')
      .in('status', ['active', 'grace_period'])
      .lt('expires_at', now.toISOString());

    for (const sub of (expiredSubs ?? [])) {
      const graceEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : new Date(new Date(sub.expires_at).getTime() + 3 * 24 * 60 * 60 * 1000);

      if (now < graceEnd) {
        // In grace period
        if (sub.status !== 'grace_period') {
          await admin.from('subscriptions').update({ status: 'grace_period', updated_at: now.toISOString() }).eq('id', sub.id);
          await createNotification({
            organizationId: sub.organization_id,
            type: 'subscription_expiring',
            title: '⚠️ Subscription in Grace Period',
            message: 'Your monthly subscription has ended. You have 3 days of grace period remaining to renew before AI receptionist service is paused.',
          });
          results.warningsSent++;
        }
      } else {
        // Expiration finalized -> suspend clinic
        await admin.from('subscriptions').update({ status: 'expired', updated_at: now.toISOString() }).eq('id', sub.id);
        await admin.from('organizations').update({ status: 'suspended', updated_at: now.toISOString() }).eq('id', sub.organization_id);
        results.suspended++;
      }
      results.expirationsProcessed++;
    }

    return successResponse({
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (err) {
    console.error('Cron job error:', err);
    return Errors.internalError();
  }
}
