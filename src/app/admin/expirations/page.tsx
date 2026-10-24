import { requireSuperAdmin, createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ExpirationRowActions from './expiration-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscription Expirations & Grace Periods' };

export default async function AdminExpirationsPage() {
  await requireSuperAdmin();
  const admin = createSupabaseAdminClient();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('*, organizations(id, name, slug), subscription_plans(name, price_inr)')
    .order('expires_at', { ascending: true });

  const subscriptions = subs ?? [];
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Categorize
  const expiringSoonCount = subscriptions.filter((s: any) => {
    if (!s.expires_at || s.status === 'expired') return false;
    const exp = new Date(s.expires_at);
    return exp > now && exp <= sevenDays;
  }).length;

  const inGracePeriodCount = subscriptions.filter((s: any) => s.status === 'grace_period').length;
  const activeHealthyCount = subscriptions.filter((s: any) => {
    if (s.status !== 'active' || !s.expires_at) return false;
    return new Date(s.expires_at) > sevenDays;
  }).length;
  const expiredCount = subscriptions.filter((s: any) => s.status === 'expired').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              Lifecycle &amp; Retention Sentinel
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Subscription Expirations &amp; Grace Periods
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Monitor clinic renewals, expiring grace periods, and automated retention extensions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscribers"
            className="btn btn-secondary text-xs font-mono"
          >
            ← Subscribers Directory
          </Link>
          <Link
            href="/admin/payments"
            className="btn btn-primary text-xs font-medium"
          >
            💳 Review Payments →
          </Link>
        </div>
      </div>

      {/* Sentinel Retention Metrics (4 Responsive Hero Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expiring Soon */}
        <div className={`card p-5 transition-all ${
          expiringSoonCount > 0
            ? 'border-[#E87A38]/50 bg-[#E87A38]/08 shadow-[0_0_16px_rgba(232,122,56,0.1)]'
            : 'border-[var(--color-border-standard)] bg-[var(--color-surface-elevated)]'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
            <span>Expiring Soon (≤ 7d)</span>
            <span className="text-xs">⚠️</span>
          </div>
          <div className={`font-mono text-3xl font-bold tracking-tight ${
            expiringSoonCount > 0 ? 'text-[#E87A38]' : 'text-[var(--color-text-primary)]'
          }`}>
            {expiringSoonCount}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
            {expiringSoonCount > 0 ? 'Urgent renewal reminder needed' : 'Zero immediate expirations'}
          </div>
        </div>

        {/* In Grace Period */}
        <div className={`card p-5 transition-all ${
          inGracePeriodCount > 0
            ? 'border-[#E84B2C]/50 bg-[#E84B2C]/08 shadow-[0_0_16px_rgba(232,75,44,0.1)]'
            : 'border-[var(--color-border-standard)] bg-[var(--color-surface-elevated)]'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
            <span>In Grace Period</span>
            <span className="text-xs">🚨</span>
          </div>
          <div className={`font-mono text-3xl font-bold tracking-tight ${
            inGracePeriodCount > 0 ? 'text-[#E84B2C]' : 'text-[var(--color-text-primary)]'
          }`}>
            {inGracePeriodCount}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
            {inGracePeriodCount > 0 ? 'Risk of automated clinic suspension' : 'No clinics in grace period'}
          </div>
        </div>

        {/* Healthy & Active */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
            <span>Healthy &amp; Active</span>
            <span className="text-[#63C7A2] text-xs">✓ Safe</span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#63C7A2] tracking-tight">
            {activeHealthyCount}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
            Renewals safely &gt; 7 days out
          </div>
        </div>

        {/* Expired Tiers */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center justify-between">
            <span>Total Managed Clinics</span>
            <span className="text-[#D4AF37] text-xs">🏥 Total</span>
          </div>
          <div className="font-mono text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {subscriptions.length}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
            {expiredCount} fully expired accounts
          </div>
        </div>
      </div>

      {/* Subscriptions Sentinel Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--color-text-primary)]">
              Subscription Renewal &amp; Lifecycle Ledger
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Real-time expiration countdowns and instant manual extensions.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {subscriptions.length} active deployments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Practice / Clinic</th>
                <th>Assigned Plan</th>
                <th>Status</th>
                <th>Renewal Countdown</th>
                <th>Expiration Date</th>
                <th>Grace Period End</th>
                <th>Quick Extension</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--color-text-muted)] font-mono text-xs">
                    No subscription records found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub: any) => {
                  const org = sub.organizations;
                  const plan = sub.subscription_plans;

                  // Calculate countdown
                  let countdownText = '—';
                  let countdownStyle = {
                    background: 'var(--color-surface-secondary, #1C1916)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)',
                  };

                  if (sub.expires_at) {
                    const exp = new Date(sub.expires_at);
                    const diffMs = exp.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                    if (sub.status === 'grace_period') {
                      countdownText = '🚨 Grace Period';
                      countdownStyle = {
                        background: 'rgba(232, 75, 44, 0.15)',
                        color: '#E84B2C',
                        border: '1px solid rgba(232, 75, 44, 0.4)',
                      };
                    } else if (sub.status === 'expired' || diffDays < 0) {
                      countdownText = '❌ Expired';
                      countdownStyle = {
                        background: 'rgba(232, 75, 44, 0.15)',
                        color: '#E84B2C',
                        border: '1px solid rgba(232, 75, 44, 0.3)',
                      };
                    } else if (diffDays <= 7) {
                      countdownText = `⚠️ ${diffDays} day${diffDays === 1 ? '' : 's'} left`;
                      countdownStyle = {
                        background: 'rgba(232, 122, 56, 0.15)',
                        color: '#E87A38',
                        border: '1px solid rgba(232, 122, 56, 0.4)',
                      };
                    } else {
                      countdownText = `✓ ${diffDays} days left`;
                      countdownStyle = {
                        background: 'rgba(99, 199, 162, 0.12)',
                        color: '#63C7A2',
                        border: '1px solid rgba(99, 199, 162, 0.25)',
                      };
                    }
                  }

                  return (
                    <tr key={sub.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                      {/* Clinic */}
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
                            {(org?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)] text-sm">
                              {org?.name ?? 'Clinic'}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                              slug: {org?.slug ?? '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="text-xs">
                        <span className="font-mono px-2 py-0.5 rounded bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)] text-[var(--color-text-secondary)]">
                          {plan?.name ?? 'Starter Plan'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          sub.status === 'active'
                            ? 'badge-success'
                            : sub.status === 'grace_period'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          {sub.status}
                        </span>
                      </td>

                      {/* Countdown */}
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.725rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                            ...countdownStyle,
                          }}
                        >
                          {countdownText}
                        </span>
                      </td>

                      {/* Expiration Date */}
                      <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Grace Period End */}
                      <td className="font-mono text-xs text-[var(--color-text-muted)]">
                        {sub.grace_expires_at ? new Date(sub.grace_expires_at).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Quick Actions */}
                      <td>
                        <ExpirationRowActions organizationId={sub.organization_id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
