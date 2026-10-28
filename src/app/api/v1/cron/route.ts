// src/app/api/v1/cron/route.ts
// Background cron task for subscription expiration checks, grace periods, and quota management

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/service';
import { processPendingAppointmentReviews } from '@/lib/reviews/review-service';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return Errors.forbidden('Cron endpoint is disabled in production without CRON_SECRET configured.');
    }
  } else {
    const authHeader = request.headers.get('authorization') || '';
    const expectedHeader = `Bearer ${cronSecret}`;

    let isAuthorized = false;
    try {
      const expectedBuf = Buffer.from(expectedHeader, 'utf-8');
      const actualBuf = Buffer.from(authHeader, 'utf-8');
      if (expectedBuf.length === actualBuf.length) {
        isAuthorized = crypto.timingSafeEqual(expectedBuf, actualBuf);
      }
    } catch {
      isAuthorized = false;
    }

    if (!isAuthorized) {
      return Errors.unauthorized('Invalid cron secret');
    }
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();

  const results = {
    expirationsProcessed: 0,
    suspended: 0,
    warningsSent: 0,
    reviewsProcessed: 0,
    reviewsSent: 0,
    reviewsFailed: 0,
  };

  try {
    // 1. Process pending automated Google review requests for finished/completed appointments
    try {
      const reviewResults = await processPendingAppointmentReviews();
      results.reviewsProcessed = reviewResults.processed;
      results.reviewsSent = reviewResults.sent;
      results.reviewsFailed = reviewResults.failed;
    } catch (revErr) {
      console.error('Error during automated review dispatch:', revErr);
    }

    // 2. Find subscriptions that expired
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
