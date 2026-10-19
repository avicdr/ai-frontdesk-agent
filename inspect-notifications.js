const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function inspect() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications'
  `);
  console.log('Columns of notifications table:\n', res.rows);
  await client.end();
}
inspect().catch(console.error);
