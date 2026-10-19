import 'dotenv/config';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class {};
}
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

async function main() {
  await supabase.from('user_profiles').update({ is_super_admin: true }).eq('id', '911f1f17-18fd-4fc3-8aca-063eea08a4bb');
  await supabase.from('user_profiles').upsert({
    id: '1c012f82-c4a1-4f6e-ae5f-1ac2c05b0169',
    full_name: 'Avi Admin',
    phone: '+91 99999 88888',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=avi',
    is_super_admin: true,
  });
  const { data: users, error: uErr } = await supabase.from('user_profiles').select('id, full_name, is_super_admin');
  console.log('User profiles:', users, uErr);

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  console.log('Auth users:', authUsers.map(u => ({ id: u.id, email: u.email })));

  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('Organizations:', orgs);

  const { data: mems } = await supabase.from('organization_memberships').select('*');
  console.log('Memberships:', mems);

  const { data: plans } = await supabase.from('subscription_plans').select('id, name, slug, price_inr, included_ai_requests');
  console.log('Plans:', plans);

  const { data: orders } = await supabase.from('payment_orders').select('*');
  console.log('Payment Orders:', orders);

  const { data: subs } = await supabase.from('subscriptions').select('*, subscription_plans(name)');
  console.log('Subscriptions:', JSON.stringify(subs, null, 2));

  const { data: txs } = await supabase.from('payment_transactions').select('*');
  console.log('Payment Transactions:', txs);

  const { data: cps } = await supabase.from('clinic_profiles').select('*');
  console.log('Clinic profiles:', cps);
}

main().catch(console.error);
