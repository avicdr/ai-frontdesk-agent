import { requireSuperAdmin } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clinic Subscribers' };

export default async function AdminSubscribersPage() {
  const { admin } = await requireSuperAdmin();

  // Load all organizations with their subscriptions
  const { data: orgs } = await admin
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      status,
      country,
      timezone,
      created_at
    `)
    .order('created_at', { ascending: false });

  const { data: subs } = await admin
    .from('subscriptions')
    .select('*, subscription_plans(name, price_inr)');

  const organizations = orgs ?? [];
  const subscriptions = subs ?? [];

  const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;
  const onboardingCount = organizations.filter((o: any) => o.status === 'onboarding').length;
  const expiredCount = subscriptions.filter((s: any) => s.status === 'expired').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              Tenant Directory
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Subscribers &amp; Clinic Deployments
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage dental clinics, monitor subscription states, and perform administrative tier overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="btn btn-secondary text-xs font-mono"
          >
            ← Overview
          </Link>
          <Link
            href="/admin/expirations"
            className="btn btn-primary text-xs font-medium"
          >
            ⏰ Expirations Sentinel →
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Total Clinics</span>
            <span className="text-sm">🏥</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">
            {organizations.length}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
            Registered practices
          </div>
        </div>

        <div className="card p-4 border-[#E84B2C]/40 bg-[var(--color-surface-elevated)] shadow-[0_0_14px_rgba(232,75,44,0.1)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#E87A38] font-semibold flex items-center justify-between">
            <span>Active Desks</span>
            <span className="text-sm">⚡</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[#E87A38] mt-1.5">
            {activeCount}
          </div>
          <div className="text-[10px] font-mono text-[#63C7A2] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#63C7A2] animate-pulse" />
            <span>Live automated desks</span>
          </div>
        </div>

        <div className="card p-4 border-[var(--color-border-standard)] bg-[var(--color-surface-elevated)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Onboarding</span>
            <span className="text-sm">⚙️</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">
            {onboardingCount}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
            Pending config setup
          </div>
        </div>

        <div className="card p-4 border-[var(--color-border-standard)] bg-[var(--color-surface-elevated)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Expired Tiers</span>
            <span className="text-sm">⏸️</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-muted)] mt-1.5">
            {expiredCount}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
            Needs renewal
          </div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Practice / Clinic</th>
                <th>Tenant State</th>
                <th>Assigned Plan</th>
                <th>Subscription Status</th>
                <th>Expiration Date</th>
                <th>AI Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--color-text-muted)]">
                    <div className="text-2xl mb-1">🏥</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">No clinic tenants found</div>
                  </td>
                </tr>
              ) : (
                organizations.map((org: any) => {
                  const sub = subscriptions.find((s: any) => s.organization_id === org.id);
                  const plan = sub?.subscription_plans as any;
                  return (
                    <tr key={org.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                      {/* Clinic */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              minWidth: '36px',
                              borderRadius: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
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
                            <div className="text-[11px] font-mono text-[var(--color-text-muted)] flex items-center gap-1.5">
                              <span>slug: {org.slug}</span>
                              <span>•</span>
                              <span>{org.timezone || 'UTC'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* State */}
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          org.status === 'active'
                            ? 'badge-success'
                            : org.status === 'onboarding'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          {org.status}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="text-xs">
                        <span className="font-mono px-2 py-0.5 rounded bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)] text-[var(--color-text-secondary)]">
                          {plan?.name ?? 'No Plan'}
                        </span>
                      </td>

                      {/* Subscription Status */}
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          sub?.status === 'active'
                            ? 'badge-success'
                            : sub?.status === 'expired'
                            ? 'badge-danger'
                            : 'badge-neutral'
                        }`}>
                          {sub?.status ?? 'none'}
                        </span>
                      </td>

                      {/* Expiration Date */}
                      <td className="font-mono text-xs text-[var(--color-text-muted)]">
                        {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* AI Requests */}
                      <td className="font-mono text-xs text-[var(--color-text-primary)] font-medium">
                        {sub?.ai_requests_used ?? 0} requests
                      </td>

                      {/* Actions */}
                      <td>
                        <Link
                          href={`/admin/subscribers/${org.id}`}
                          className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors inline-flex items-center gap-1"
                        >
                          View Details →
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
    </div>
  );
}
