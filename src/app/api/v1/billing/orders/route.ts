// src/app/api/v1/billing/orders/route.ts
// Create a payment order for a subscription plan

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/security/tenant';
import { createPaymentOrder } from '@/lib/billing/service';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();

    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { organizationId, planId } = parsed.data;

    // Verify user belongs to this org
    const tenant = await resolveTenantContext(organizationId);

    const result = await createPaymentOrder(
      organizationId,
      planId,
      tenant.organization.name,
      user.email ?? '',
      ''
    );

    if (!result.success) {
      return Errors.internalError();
    }

    return successResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (message === 'FORBIDDEN') return Errors.forbidden();
    return Errors.internalError();
  }
}
