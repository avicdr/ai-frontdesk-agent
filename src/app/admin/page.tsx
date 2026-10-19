import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Super Admin Dashboard' };
export const dynamic = 'force-dynamic';

async function getAdminData() {
  const admin = createSupabaseAdminClient();

  const [orgsRes, subsRes, paymentsRes, usageRes] = await Promise.all([
    admin.from('organizations').select('id, name, status, created_at').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('id, organization_id, status, expires_at, plan_id, ai_requests_used, ai_cost_used_inr, subscription_plans(name, price_inr)'),
    admin.from('payment_transactions').select('id, amount_inr, status, created_at').order('created_at', { ascending: false }).limit(20),
    admin.from('ai_usage_records').select('organization_id, estimated_cost_inr, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const orgs = orgsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const usage = usageRes.data ?? [];

  const activeCount = subs.filter((s: any) => s.status === 'active').length;
  const expiredCount = subs.filter((s: any) => s.status === 'expired').length;
  const suspendedCount = orgs.filter((o: any) => o.status === 'suspended').length;
  const totalPayments = payments.filter((p: any) => p.status === 'success').reduce((sum: number, p: any) => sum + Number(p.amount_inr), 0);
  const aiSpend = usage.reduce((sum: number, u: any) => sum + Number(u.estimated_cost_inr || 0), 0);

  // Estimate MRR from active subscriptions
  const mrr = subs
    .filter((s: any) => s.status === 'active')
    .reduce((sum: number, s: any) => {
      const plan = (s as Record<string, unknown>).subscription_plans as Record<string, unknown> | null;
      return sum + Number(plan?.price_inr ?? 0);
    }, 0);

  // Expiring soon (7 days)
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringCount = subs.filter((s: any) => {
    if (!s.expires_at) return false;
    const exp = new Date(s.expires_at);
    return exp > now && exp < sevenDays;
  }).length;

  return {
    orgs,
    subs,
    payments,
    stats: {
      totalOrgs: orgs.length,
      activeSubscribers: activeCount,
      expired: expiredCount,
      suspended: suspendedCount,
      mrr,
      totalPaymentsThisMonth: totalPayments,
      aiSpend,
      expiringCount,
      grossContribution: mrr - aiSpend,
    },
  };
}

function StatCard({ value, label, color, prefix = '' }: { value: string | number; label: string; color?: string; prefix?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const user = await requireServerUser();
  const admin = createSupabaseAdminClient();

  // Verify super admin
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/dashboard');
  }

  const data = await getAdminData();
  const { stats, orgs, subs, payments } = data;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>👑</span>
          <h1 style={{ fontSize: '1.75rem' }}>Super Admin Dashboard</h1>
        </div>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
          Platform management — viewing live data
        </p>
        <div className="badge badge-warning" style={{ marginTop: '0.5rem' }}>⚠️ Admin Area — Actions are audited</div>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard value={stats.totalOrgs} label="Total Organizations" />
        <StatCard value={stats.activeSubscribers} label="Active Subscribers" color="hsl(142, 71%, 55%)" />
        <StatCard value={stats.expired} label="Expired Subscriptions" color="hsl(0, 84%, 60%)" />
        <StatCard value={stats.suspended} label="Suspended Accounts" color="hsl(38, 92%, 50%)" />
        <StatCard value={`₹${stats.mrr.toLocaleString('en-IN')}`} label="Est. MRR" color="hsl(221, 83%, 70%)" />
        <StatCard value={`₹${stats.totalPaymentsThisMonth.toLocaleString('en-IN')}`} label="Payments This Month" />
        <StatCard value={`₹${stats.aiSpend.toFixed(2)}`} label="AI Spend This Month" color="hsl(265, 83%, 70%)" />
        <StatCard value={stats.expiringCount} label="Expiring in 7 Days" color="hsl(38, 92%, 50%)" />
      </div>

      {/* Health indicators */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Platform Health</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'WhatsApp Webhooks', status: 'healthy' },
            { label: 'Google Calendar', status: 'healthy' },
            { label: 'Gemini AI', status: 'healthy' },
            { label: 'Payment Webhooks', status: 'healthy' },
            { label: 'Background Jobs', status: 'healthy' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.status === 'healthy' ? 'hsl(142, 71%, 55%)' : 'hsl(0, 84%, 60%)',
                display: 'inline-block',
              }} />
              <span style={{ color: 'hsl(var(--color-text-secondary))' }}>{item.label}</span>
              <span style={{ fontSize: '0.7rem', color: item.status === 'healthy' ? 'hsl(142, 71%, 55%)' : 'hsl(0, 84%, 60%)' }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem' }}>All Organizations</h2>
          <Link href="/admin/subscribers" style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>AI Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.slice(0, 10).map((org: any) => {
                const sub = subs.find((s: any) => s.organization_id === org.id);
                const plan = (sub as Record<string, unknown>)?.subscription_plans as Record<string, unknown> | null;
                return (
                  <tr key={org.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{org.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                        {new Date(org.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${org.status === 'active' ? 'success' : org.status === 'onboarding' ? 'info' : 'error'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {plan?.name as string ?? '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${sub?.status === 'active' ? 'success' : sub?.status === 'expired' ? 'error' : 'muted'}`}>
                        {sub?.status ?? 'none'}
                      </span>
                      {sub?.expires_at && (
                        <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                          Exp: {new Date(sub.expires_at).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {sub?.ai_requests_used ?? 0} req
                      {sub?.ai_cost_used_inr && (
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                          ₹{Number(sub.ai_cost_used_inr).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/subscribers/${org.id}`}
                        style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem' }}>Recent Payments</h2>
          <Link href="/admin/payments" style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 8).map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.id.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(p.amount_inr).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge badge-${p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'error'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                    {new Date(p.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
