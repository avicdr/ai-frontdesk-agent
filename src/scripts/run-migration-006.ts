import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  try {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '006_website_traffic_analytics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing migration 006_website_traffic_analytics.sql...');
    await client.query(sql);
    console.log('Migration 006 executed successfully!');

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('analytics_visitors', 'analytics_sessions', 'analytics_events')
      ORDER BY table_name;
    `);
    console.log('Created analytics tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

