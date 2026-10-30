// src/lib/analytics/date-utils.ts
// Date range utilities and previous-period arithmetic for analytics

import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInCalendarDays,
  differenceInHours,
  addHours,
  addDays,
  format,
} from 'date-fns';
import { DateRangeKey } from './types';

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  bucketType: 'hour' | 'day' | 'month';
}

export function resolveDateRange(
  rangeKey: DateRangeKey,
  customFrom?: string,
  customTo?: string
): ResolvedDateRange {
  const now = new Date();

  switch (rangeKey) {
    case 'today': {
      const startDate = startOfDay(now);
      const endDate = now;
      const prevStartDate = startOfDay(subDays(now, 1));
      const hoursPassed = differenceInHours(now, startDate);
      const prevEndDate = addHours(prevStartDate, Math.max(1, hoursPassed));
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'hour',
      };
    }

    case 'yesterday': {
      const yesterday = subDays(now, 1);
      const startDate = startOfDay(yesterday);
      const endDate = endOfDay(yesterday);
      const dayBefore = subDays(yesterday, 1);
      const prevStartDate = startOfDay(dayBefore);
      const prevEndDate = endOfDay(dayBefore);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'hour',
      };
    }

    case 'last7d': {
      const startDate = startOfDay(subDays(now, 6));
      const endDate = now;
      const prevStartDate = startOfDay(subDays(startDate, 7));
      const prevEndDate = subDays(endDate, 7);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'day',
      };
    }

    case 'last30d': {
      const startDate = startOfDay(subDays(now, 29));
      const endDate = now;
      const prevStartDate = startOfDay(subDays(startDate, 30));
      const prevEndDate = subDays(endDate, 30);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'day',
      };
    }

    case 'last90d': {
      const startDate = startOfDay(subDays(now, 89));
      const endDate = now;
      const prevStartDate = startOfDay(subDays(startDate, 90));
      const prevEndDate = subDays(endDate, 90);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'day',
      };
    }

    case 'this_month': {
      const startDate = startOfMonth(now);
      const endDate = now;
      const prevMonth = subMonths(now, 1);
      const prevStartDate = startOfMonth(prevMonth);
      const daysPassed = differenceInCalendarDays(now, startDate);
      const prevEndDate = addDays(prevStartDate, daysPassed);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'day',
      };
    }

    case 'last_month': {
      const prevMonth = subMonths(now, 1);
      const startDate = startOfMonth(prevMonth);
      const endDate = endOfMonth(prevMonth);
      const twoMonthsAgo = subMonths(now, 2);
      const prevStartDate = startOfMonth(twoMonthsAgo);
      const prevEndDate = endOfMonth(twoMonthsAgo);
      return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        bucketType: 'day',
      };
    }

    case 'custom': {
      const start = customFrom ? new Date(customFrom) : startOfDay(subDays(now, 6));
      const end = customTo ? new Date(customTo) : now;
      const durationMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime());
      const prevStart = new Date(start.getTime() - durationMs);

      const daysDiff = Math.max(1, differenceInCalendarDays(end, start));
      const bucketType = daysDiff <= 2 ? 'hour' : daysDiff <= 90 ? 'day' : 'month';

      return {
        startDate: start,
        endDate: end,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        bucketType,
      };
    }

    default:
      return resolveDateRange('last7d');
  }
}

/**
 * Calculates percentage change between current and previous period.
 */
export function calculateComparison(
  current: number,
  previous: number | null | undefined
): { changePercent: number | null; trend: 'up' | 'down' | 'neutral' | 'no_data' } {
  if (previous === null || previous === undefined || isNaN(previous)) {
    return { changePercent: null, trend: 'no_data' };
  }

  if (previous === 0) {
    if (current > 0) return { changePercent: 100, trend: 'up' };
    if (current === 0) return { changePercent: 0, trend: 'neutral' };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (rounded > 0.05) trend = 'up';
  else if (rounded < -0.05) trend = 'down';

  return {
    changePercent: rounded,
    trend,
  };
}

/**
 * Formats a duration in seconds into human-readable format (e.g. 2m 14s).
 */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return `${m}m ${remainingSecs}s`;
}

