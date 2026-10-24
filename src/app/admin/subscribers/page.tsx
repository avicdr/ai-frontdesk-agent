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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F3F0E8]/08 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
              Tenant Directory
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
            Subscribers &amp; Clinic Deployments
          </h1>
          <p className="text-sm text-[#9E9B93] mt-1">
            Manage dental clinics, monitor subscription states, and perform administrative tier overrides.
          </p>
        </div>
      </div>

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
              {(orgs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9E9B93]">
                    <div className="text-2xl mb-1">🏥</div>
                    <div className="text-sm font-medium text-[#F3F0E8]">No clinic tenants found</div>
                  </td>
                </tr>
              ) : (
                (orgs ?? []).map((org: any) => {
                  const sub = (subs ?? []).find((s: any) => s.organization_id === org.id);
                  const plan = sub?.subscription_plans as any;
                  return (
                    <tr key={org.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                      <td>
                        <div className="font-medium text-[#F3F0E8] text-sm">{org.name}</div>
                        <div className="text-[11px] font-mono text-[#9E9B93]">
                          slug: {org.slug} • {org.timezone || 'UTC'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          org.status === 'active'
                            ? 'badge-success'
                            : org.status === 'onboarding'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-[#D0CBC1]">
                        {plan?.name ?? '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          sub?.status === 'active'
                            ? 'badge-success'
                            : sub?.status === 'expired'
                            ? 'badge-danger'
                            : 'badge-neutral'
                        }`}>
                          {sub?.status ?? 'none'}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#9E9B93]">
                        {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="font-mono text-xs text-[#F3F0E8]">
                        {sub?.ai_requests_used ?? 0} requests
                      </td>
                      <td>
                        <Link
                          href={`/admin/subscribers/${org.id}`}
                          className="text-xs font-mono font-medium text-[#E87A38] hover:text-[#E84B2C] transition-colors"
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
