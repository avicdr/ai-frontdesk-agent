import { requireSuperAdmin } from '@/lib/supabase/server';
import ExpirationRowActions from './expiration-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscription Expirations & Grace Periods' };

export default async function AdminExpirationsPage() {
  const { admin } = await requireSuperAdmin();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('*, organizations(name, slug), subscription_plans(name)')
    .order('expires_at', { ascending: true });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[#F3F0E8]/08 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
          <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
            Lifecycle &amp; Retention Sentinel
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
          Subscription Expirations &amp; Grace Periods
        </h1>
        <p className="text-sm text-[#9E9B93] mt-1">
          Monitor clinics with upcoming renewals, expiring grace periods, and automated reminders.
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Practice / Clinic</th>
                <th>Assigned Plan</th>
                <th>Status</th>
                <th>Expiration Date</th>
                <th>Grace Period End</th>
                <th>Quick Extension</th>
              </tr>
            </thead>
            <tbody>
              {(subs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9E9B93]">
                    No subscription records found.
                  </td>
                </tr>
              ) : (
                (subs ?? []).map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                    <td>
                      <div className="font-medium text-[#F3F0E8] text-sm">
                        {sub.organizations?.name ?? 'Clinic'}
                      </div>
                      <div className="text-[10px] font-mono text-[#9E9B93]">
                        {sub.organizations?.slug}
                      </div>
                    </td>
                    <td className="text-xs text-[#D0CBC1]">
                      {sub.subscription_plans?.name ?? 'Pro Plan'}
                    </td>
                    <td>
                      <span className={`badge ${
                        sub.status === 'active'
                          ? 'badge-success'
                          : sub.status === 'grace_period'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#D0CBC1]">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="font-mono text-xs text-[#9E9B93]">
                      {sub.grace_expires_at ? new Date(sub.grace_expires_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <ExpirationRowActions organizationId={sub.organization_id} />
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
