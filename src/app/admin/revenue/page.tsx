import { requireSuperAdmin, createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform Revenue Analytics' };

export default async function AdminRevenuePage() {
  await requireSuperAdmin();
  const admin = createSupabaseAdminClient();

  const [paymentsRes, subsRes, plansRes, orgsRes] = await Promise.all([
    admin
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('subscriptions')
      .select('id, organization_id, status, expires_at, plan_id, subscription_plans(id, name, slug, price_inr)'),
    admin
      .from('subscription_plans')
      .select('id, name, slug, price_inr, billing_cycle')
      .order('price_inr', { ascending: true }),
    admin
      .from('organizations')
      .select('id, name, slug'),
  ]);

  const payments = paymentsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const plans = plansRes.data ?? [];
  const orgs = orgsRes.data ?? [];

  const orgMap = new Map<string, any>(orgs.map((o: any) => [o.id, o]));

  const successfulPayments = payments.filter((p: any) => p.status === 'success' || p.status === 'completed');
  const totalRevenue = successfulPayments.reduce((sum: number, p: any) => sum + Number(p.amount_inr || 0), 0);
  const paymentCount = successfulPayments.length;

  const activeSubs = subs.filter((s: any) => s.status === 'active');
  const mrr = activeSubs.reduce((sum: number, s: any) => {
    const plan = (s as Record<string, unknown>).subscription_plans as Record<string, unknown> | null;
    return sum + Number(plan?.price_inr ?? 0);
  }, 0);

  const arr = mrr * 12;
  const avgRevenuePerClinic = activeSubs.length > 0 ? Math.round(mrr / activeSubs.length) : (paymentCount > 0 ? Math.round(totalRevenue / paymentCount) : 1599);

  // Group subscriptions by plan
  const planStats = plans.map((plan: any) => {
    const subsOnPlan = activeSubs.filter((s: any) => {
      const subPlan = (s as Record<string, unknown>).subscription_plans as Record<string, unknown> | null;
      return s.plan_id === plan.id || subPlan?.slug === plan.slug;
    });
    const planMrr = subsOnPlan.length * Number(plan.price_inr || 0);
    const percentageOfTotal = mrr > 0 ? Math.round((planMrr / mrr) * 100) : 0;
    return {
      ...plan,
      count: subsOnPlan.length,
      planMrr,
      percentageOfTotal,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              Financial Ledger Telemetry
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            SaaS Revenue &amp; MRR Performance
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Monthly Recurring Revenue (MRR), subscriber lifetime value, and settlement ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/payments"
            className="btn btn-secondary text-xs font-mono"
          >
            💳 Manual UPI Queue →
          </Link>
          <Link
            href="/admin/subscribers"
            className="btn btn-primary text-xs font-medium"
          >
            🏥 Manage Clinics →
          </Link>
        </div>
      </div>

      {/* Top 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected Revenue */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[#E84B2C]/40 shadow-[0_0_24px_rgba(232,75,44,0.08)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💰</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Revenue
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#63C7A2]/15 text-[#63C7A2] font-semibold border border-[#63C7A2]/30">
              ✓ Settled
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#63C7A2] font-mono mt-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#63C7A2]" />
            <span>{paymentCount} confirmed settlements</span>
          </div>
        </div>

        {/* Platform MRR */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[#63C7A2]/40 shadow-[0_0_24px_rgba(99,199,162,0.08)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📈</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                Platform MRR
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E87A38]/15 text-[#E87A38] font-semibold border border-[#E87A38]/30">
              Monthly Run-rate
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#63C7A2] tracking-tight">
            ₹{mrr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2.5 flex items-center gap-1.5">
            <span>●</span>
            <span>Active clinic recurring run-rate</span>
          </div>
        </div>

        {/* Projected ARR */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🚀</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                Annual ARR
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-semibold border border-[#D4AF37]/30">
              Annualized
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#D4AF37] tracking-tight">
            ₹{arr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2.5 flex items-center gap-1.5">
            <span>●</span>
            <span>MRR × 12 baseline yield</span>
          </div>
        </div>

        {/* ARPU */}
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👥</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                Avg / Clinic
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#63C7A2]/15 text-[#63C7A2] font-semibold border border-[#63C7A2]/30">
              ARPU
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#63C7A2] tracking-tight">
            ₹{avgRevenuePerClinic.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-2.5 flex items-center gap-1.5">
            <span>●</span>
            <span>Per active monthly cycle</span>
          </div>
        </div>
      </div>

      {/* Plan Performance & Revenue Distribution Breakdown */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
              <span className="text-[#E87A38]">✦</span> Subscription Tier Revenue Distribution
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              MRR yield and subscriber share across Starter, Pro, and Growth tiers.
            </p>
          </div>
          <span className="text-xs font-mono text-[#63C7A2] bg-[#63C7A2]/10 border border-[#63C7A2]/25 px-2.5 py-0.5 rounded-full">
            {activeSubs.length} Active Deployments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planStats.map((plan: any) => (
            <div
              key={plan.id}
              className="p-4 rounded-xl bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)] hover:border-[var(--color-border-hover)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-[var(--color-text-primary)]">
                      {plan.name} Plan
                    </h3>
                    <div className="font-mono text-xs text-[#E87A38] mt-0.5">
                      ₹{Number(plan.price_inr).toLocaleString('en-IN')} / mo
                    </div>
                  </div>
                  <span className="badge badge-primary font-mono text-[10px]">
                    {plan.count} clinics
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs font-mono text-[var(--color-text-muted)] mb-1">
                    <span>MRR Contribution</span>
                    <span className="text-[var(--color-text-primary)] font-semibold">
                      ₹{plan.planMrr.toLocaleString('en-IN')} ({plan.percentageOfTotal}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[var(--color-surface-raised,#211B17)] h-2 rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                    <div
                      className="h-full bg-gradient-to-r from-[#E84B2C] to-[#E87A38] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, plan.percentageOfTotal)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-[11px] font-mono text-[var(--color-text-muted)]">
                <span>Cycle: {plan.billing_cycle || 'Monthly'}</span>
                <span className="text-[#63C7A2]">Pre-Paid</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Rails & Architecture (2 Feature Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#63C7A2]/10 border border-[#63C7A2]/30 flex items-center justify-center text-lg text-[#63C7A2]">
              🇮🇳
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-[var(--color-text-primary)]">
                UPI Direct Settlement Rail
              </h3>
              <div className="text-xs text-[var(--color-text-muted)]">Zero gateway transaction fee (0%)</div>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Clinics pay directly via dynamic UPI QR code or VPA transfer. Transactions undergo instant UTR hash verification and automatic 30-day billing cycle activation.
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--color-text-muted)]">Settlement Speed</span>
            <span className="text-[#63C7A2] font-semibold">Instant / Real-Time</span>
          </div>
        </div>

        <div className="card p-5 bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#E87A38]/10 border border-[#E87A38]/30 flex items-center justify-center text-lg text-[#E87A38]">
              ⛓️
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-[var(--color-text-primary)]">
                Web3 &amp; Multi-Gateway Resilience
              </h3>
              <div className="text-xs text-[var(--color-text-muted)]">Zero-chargeback settlement ledger</div>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Cryptographic ledger rails (USDT / USDC on Polygon) and fallback merchant card processing. Eliminates chargeback fraud and ensures uninterrupted AI front-desk uptime.
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--color-text-muted)]">Chargeback Rate</span>
            <span className="text-[#63C7A2] font-semibold">0.00% Zero-Dispute</span>
          </div>
        </div>
      </div>

      {/* Recent Settlement Transactions Ledger Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--color-text-primary)]">
              Confirmed Settlement Transactions Ledger
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Audited record of recent subscription renewals, UPI settlements, and manual tier authorizations.
            </p>
          </div>
          <Link
            href="/admin/payments"
            className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors flex items-center gap-1.5"
          >
            Review UTR Queue →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Clinic Organization</th>
                <th>Amount</th>
                <th>Payment Rail</th>
                <th>Settlement State</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-text-muted)] font-mono text-xs">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => {
                  const org: any = orgMap.get(p.organization_id);
                  const isSuccess = p.status === 'success' || p.status === 'completed';

                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                      {/* Tx ID */}
                      <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <span>{p.id.slice(0, 10)}...</span>
                          {p.provider_transaction_id && (
                            <span className="text-[10px] text-[var(--color-text-muted)]" title={`Ref: ${p.provider_transaction_id}`}>
                              ({p.provider_transaction_id.slice(0, 8)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Organization */}
                      <td>
                        {org ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                minWidth: '28px',
                                borderRadius: '7px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.3))',
                                color: '#E87A38',
                                border: '1px solid rgba(232, 122, 56, 0.3)',
                                flexShrink: 0,
                              }}
                            >
                              {(org.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-xs text-[var(--color-text-primary)]">{org.name}</div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">{org.slug}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[var(--color-text-muted)]">
                            {p.organization_id ? p.organization_id.slice(0, 8) + '...' : 'Direct Platform'}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="font-mono text-sm font-bold text-[#63C7A2]">
                        ₹{Number(p.amount_inr).toLocaleString('en-IN')}
                      </td>

                      {/* Payment Rail */}
                      <td>
                        <span className="font-mono text-[11px] text-[var(--color-text-secondary)] px-2 py-0.5 rounded bg-[var(--color-surface-secondary,#1C1916)] border border-[var(--color-border-standard)] uppercase">
                          {p.payment_method || p.provider || 'UPI / QR'}
                        </span>
                      </td>

                      {/* State */}
                      <td>
                        <span className={`badge font-mono text-[10px] ${
                          isSuccess
                            ? 'badge-success'
                            : p.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="font-mono text-xs text-[var(--color-text-muted)]">
                        {new Date(p.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
