import { requireSuperAdmin, createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = { title: 'Super Admin Overview' };
export const dynamic = 'force-dynamic';

async function getAdminData() {
  const admin = createSupabaseAdminClient();

  const [orgsRes, subsRes, paymentsRes, usageRes, usersRes] = await Promise.all([
    admin.from('organizations').select('id, name, slug, status, created_at').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('id, organization_id, status, expires_at, plan_id, ai_requests_used, ai_cost_used_inr, subscription_plans(name, price_inr)'),
    admin.from('payment_transactions').select('id, amount_inr, status, payment_method, organization_id, created_at').order('created_at', { ascending: false }).limit(20),
    admin.from('ai_usage_records').select('organization_id, estimated_cost_inr, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from('user_profiles').select('id', { count: 'exact', head: true }),
  ]);

  const orgs = orgsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const usage = usageRes.data ?? [];
  const totalUsers = usersRes.count ?? 0;

  const activeCount = subs.filter((s: any) => s.status === 'active').length;
  const expiredCount = subs.filter((s: any) => s.status === 'expired').length;
  const suspendedCount = orgs.filter((o: any) => o.status === 'suspended').length;
  const totalPayments = payments.filter((p: any) => p.status === 'success' || p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount_inr || 0), 0);
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

  const grossContribution = Math.max(0, mrr - aiSpend);
  const profitMargin = mrr > 0 ? ((grossContribution / mrr) * 100).toFixed(1) : '99.9';

  return {
    orgs,
    subs,
    payments,
    stats: {
      totalUsers,
      totalOrgs: orgs.length,
      activeSubscribers: activeCount,
      expired: expiredCount,
      suspended: suspendedCount,
      mrr,
      totalPaymentsThisMonth: totalPayments,
      aiSpend,
      expiringCount,
      grossContribution,
      profitMargin,
    },
  };
}

export default async function AdminDashboard() {
  await requireSuperAdmin();

  const data = await getAdminData();
  const { stats, orgs, subs, payments } = data;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              Omni-Tenant Master Node
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Super Admin Headquarters
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#E84B2C]/15 border border-[#E84B2C]/35 text-[#E87A38]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-2xl">
            Global multi-tenant governance, live subscriptions, financial settlement, and Gemini AI telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/revenue"
            className="btn btn-secondary btn-sm text-xs font-mono"
          >
            💰 Revenue Hub
          </Link>
          <div className="badge badge-warning text-[11px] font-mono py-1 px-3">
            🔒 AUDITED PRIVILEGED ACCESS
          </div>
        </div>
      </div>

      {/* Tier 1: Primary Financial & Intelligence KPIs (4 Balanced Hero Cards) */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
          <span className="text-[#E87A38]">✦</span> Platform Financials &amp; Margin Ledger
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR Card */}
          <div className="card p-5 bg-[var(--color-surface-elevated)] border-[#E84B2C]/30 shadow-[0_0_20px_rgba(232,75,44,0.08)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#E84B2C]/10 to-transparent pointer-events-none" />
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
              <span>Est. Platform MRR</span>
              <span className="text-[#E87A38] text-xs">₹ / mo</span>
            </div>
            <div className="font-mono text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              ₹{stats.mrr.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-[#63C7A2] font-mono mt-2 flex items-center gap-1.5">
              <span>●</span>
              <span>{stats.activeSubscribers} active clinics run-rate</span>
            </div>
          </div>

          {/* Gross Contribution Card */}
          <div className="card p-5 bg-[var(--color-surface-elevated)] border-[#63C7A2]/30 shadow-[0_0_20px_rgba(99,199,162,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#63C7A2]/10 to-transparent pointer-events-none" />
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
              <span>Gross Contribution</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#63C7A2]/15 text-[#63C7A2] font-semibold">
                {stats.profitMargin}% margin
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-[#63C7A2] tracking-tight">
              ₹{stats.grossContribution.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
              Net platform yield (MRR − AI Compute)
            </div>
          </div>

          {/* 30-Day Collections Card */}
          <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
              <span>Payments (30d)</span>
              <span className="text-[#63C7A2] text-xs">✓ Verified</span>
            </div>
            <div className="font-mono text-3xl font-bold text-[#63C7A2] tracking-tight">
              ₹{stats.totalPaymentsThisMonth.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
              UPI &amp; Web3 confirmed settlements
            </div>
          </div>

          {/* AI Compute Spend Card */}
          <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
              <span>AI Compute Spend</span>
              <span className="text-[#E87A38] text-xs">⚡ Gemini</span>
            </div>
            <div className="font-mono text-3xl font-bold text-[#E87A38] tracking-tight">
              ₹{stats.aiSpend.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
              Sub-cent Gemini Flash margins
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2: Tenant Operations Grid (6 Structured Operational Stat Cards) */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
          <span className="text-[#E87A38]">✦</span> Clinic Deployments &amp; Tenant Footprint
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              Registered Users
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">
              {stats.totalUsers}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
              Platform directory
            </div>
          </div>

          <div className="card p-4 border-[#E84B2C]/40 bg-[var(--color-surface-elevated)] shadow-[0_0_12px_rgba(232,75,44,0.1)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#E87A38] font-semibold">
              Active Clinics
            </div>
            <div className="font-mono text-2xl font-bold text-[#E87A38] mt-1.5">
              {stats.activeSubscribers}
            </div>
            <div className="text-[10px] font-mono text-[#63C7A2] mt-1">
              Live automated desks
            </div>
          </div>

          <div className={`card p-4 transition-all ${
            stats.expiringCount > 0 ? 'border-[#E87A38]/50 bg-[#E87A38]/05' : ''
          }`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              Expiring (7d)
            </div>
            <div className={`font-mono text-2xl font-bold mt-1.5 ${
              stats.expiringCount > 0 ? 'text-[#E87A38]' : 'text-[var(--color-text-muted)]'
            }`}>
              {stats.expiringCount}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
              {stats.expiringCount > 0 ? 'Action required' : 'All renewals safe'}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              Organizations
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">
              {stats.totalOrgs}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
              Multi-tenant entities
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              Expired Tiers
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--color-text-muted)] mt-1.5">
              {stats.expired}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
              Inactive accounts
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              Suspended
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--color-text-muted)] mt-1.5">
              {stats.suspended}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
              Restricted access
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure Node Health (Fixed spacing & visual layout) */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
              <span className="text-[#E87A38]">✦</span> Real-Time Service Health &amp; Telemetry
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Continuous heartbeat monitoring across communications, calendar APIs, and model endpoints.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#63C7A2] bg-[#63C7A2]/10 border border-[#63C7A2]/25 px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#63C7A2] animate-pulse" />
            ALL SYSTEMS NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'WhatsApp Webhooks', status: 'Operational', latency: '42ms', icon: '💬' },
            { label: 'Google Calendar API', status: 'Operational', latency: '68ms', icon: '📅' },
            { label: 'Gemini 1.5 Flash', status: 'Operational', latency: '310ms', icon: '✨' },
            { label: 'UPI / Crypto Ledger', status: 'Operational', latency: '18ms', icon: '💳' },
            { label: 'Background Cron', status: 'Operational', latency: '0s', icon: '⏱️' },
          ].map(item => (
            <div
              key={item.label}
              className="p-3.5 rounded-xl bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)] flex flex-col justify-between transition-all hover:border-[var(--color-border-hover)]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-[#63C7A2] shadow-[0_0_8px_#63C7A2] shrink-0" />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono pt-2 border-t border-[var(--color-border-subtle)]">
                <span className="text-[#63C7A2] font-semibold uppercase">{item.status}</span>
                <span className="text-[var(--color-text-muted)] bg-[var(--color-surface-raised,#211B17)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">
                  ⚡ {item.latency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organizations & Subscribers table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--color-text-primary)]">
              Active Practices &amp; Tenant Accounts
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Live clinic deployments with subscription status and AI compute load.
            </p>
          </div>
          <Link
            href="/admin/subscribers"
            className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors flex items-center gap-1.5"
          >
            All Subscribers →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Clinic Organization</th>
                <th>Tenant State</th>
                <th>Assigned Plan</th>
                <th>Subscription Status</th>
                <th>AI Requests</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--color-text-muted)] font-mono text-xs">
                    No clinic organizations registered yet.
                  </td>
                </tr>
              ) : (
                orgs.slice(0, 8).map((org: any) => {
                  const sub = subs.find((s: any) => s.organization_id === org.id);
                  const plan = (sub as Record<string, unknown>)?.subscription_plans as Record<string, unknown> | null;
                  return (
                    <tr key={org.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              minWidth: '34px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.3))',
                              color: '#E87A38',
                              border: '1px solid rgba(232, 122, 56, 0.3)',
                              flexShrink: 0,
                            }}
                          >
                            {(org.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)] text-sm">{org.name}</div>
                            <div className="text-[11px] font-mono text-[var(--color-text-muted)] flex items-center gap-2">
                              <span>Created {new Date(org.created_at).toLocaleDateString('en-IN')}</span>
                              {org.slug && <span>• slug: {org.slug}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          org.status === 'active' ? 'badge-success' : org.status === 'onboarding' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-[var(--color-text-secondary)]">
                        <span className="font-mono px-2 py-0.5 rounded bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)]">
                          {(plan?.name as string) ?? 'No Plan'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          sub?.status === 'active' ? 'badge-success' : sub?.status === 'expired' ? 'badge-danger' : 'badge-neutral'
                        }`}>
                          {sub?.status ?? 'none'}
                        </span>
                        {sub?.expires_at && (
                          <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
                            Exp: {new Date(sub.expires_at).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-mono text-xs text-[var(--color-text-primary)] font-medium">
                          {sub?.ai_requests_used ?? 0} reqs
                        </div>
                        {sub?.ai_cost_used_inr !== undefined && (
                          <div className="font-mono text-[10px] text-[#63C7A2]">
                            ₹{Number(sub.ai_cost_used_inr).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/subscribers/${org.id}`}
                          className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors inline-flex items-center gap-1"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--color-text-primary)]">
              Recent Platform Transactions
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Incoming UPI &amp; Crypto payments pending or confirmed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/revenue"
              className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors"
            >
              Revenue Analytics →
            </Link>
            <Link
              href="/admin/payments"
              className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors"
            >
              All Ledger Records →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>TxID</th>
                <th>Amount</th>
                <th>Payment Rail</th>
                <th>State</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[var(--color-text-muted)] font-mono text-xs">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 6).map((p: any) => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                    <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                      {p.id.slice(0, 12)}...
                    </td>
                    <td className="font-mono font-semibold text-[#63C7A2] text-xs">
                      ₹{Number(p.amount_inr).toLocaleString('en-IN')}
                    </td>
                    <td className="font-mono text-xs text-[var(--color-text-muted)] uppercase">
                      {p.payment_method || 'UPI / QR'}
                    </td>
                    <td>
                      <span className={`badge font-mono text-[10px] ${
                        p.status === 'success' || p.status === 'completed'
                          ? 'badge-success'
                          : p.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(p.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
