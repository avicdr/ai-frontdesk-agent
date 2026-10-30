// src/lib/analytics/db.ts
// Dedicated PostgreSQL query client for analytics aggregations and timeseries

import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getAnalyticsPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or DATABASE_URL_POOLED environment variable is required');
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase.co')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle analytics pg client', err);
    });
  }

  return pool;
}

/**
 * Executes a parameterized SQL query with type-safety and automated release.
 */
export async function queryAnalytics<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const p = getAnalyticsPool();
  return p.query<T>(text, params);
}

