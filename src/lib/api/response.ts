// src/lib/api/response.ts
// Standardized API response helpers

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import type { ApiSuccess, ApiError } from '@/lib/types/database';

export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    requestId?: string;
    pagination?: ApiSuccess<T>['meta']['pagination'];
  }
): NextResponse {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    meta: {
      requestId: options?.requestId ?? nanoid(12),
      ...(options?.pagination ? { pagination: options.pagination } : {}),
    },
  };
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function errorResponse(
  code: string,
  message: string,
  options?: {
    status?: number;
    retryable?: boolean;
    details?: unknown;
    requestId?: string;
  }
): NextResponse {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message,
      retryable: options?.retryable ?? false,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
    meta: {
      requestId: options?.requestId ?? nanoid(12),
    },
  };
  return NextResponse.json(body, { status: options?.status ?? 400 });
}

// Common error responses
export const Errors = {
  unauthorized: (msg = 'Authentication required') =>
    errorResponse('UNAUTHORIZED', msg, { status: 401 }),

  forbidden: (msg = 'You do not have permission to perform this action') =>
    errorResponse('FORBIDDEN', msg, { status: 403 }),

  notFound: (entity = 'Resource') =>
    errorResponse('NOT_FOUND', `${entity} not found`, { status: 404 }),

  rateLimited: (msg = 'Too many requests. Please try again later.') =>
    errorResponse('RATE_LIMIT_EXCEEDED', msg, { status: 429, retryable: true }),

  subscriptionExpired: () =>
    errorResponse('SUBSCRIPTION_EXPIRED', 'Your subscription has expired. Please renew to continue.', { status: 402 }),

  quotaExceeded: (quota: string) =>
    errorResponse('QUOTA_EXCEEDED', `You have exceeded your ${quota} quota for this billing period.`, { status: 402 }),

  validationError: (details: unknown) =>
    errorResponse('VALIDATION_ERROR', 'Request validation failed', { status: 422, details }),

  badRequest: (msg = 'Bad request') =>
    errorResponse('BAD_REQUEST', msg, { status: 400 }),

  internalError: (requestId?: string) =>
    errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', { status: 500, retryable: true, requestId }),
};
