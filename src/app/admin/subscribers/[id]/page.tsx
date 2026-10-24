import React from 'react';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/supabase/server';
import SubscriberActions from './subscriber-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clinic Subscriber Details' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubscriberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { admin } = await requireSuperAdmin();

  // Fetch organization
  const { data: org } = await admin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!org) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto mt-12 animate-fade-in">
        <div className="text-4xl mb-3">🏥</div>
        <h1 className="font-heading text-xl font-bold text-[#F3F0E8] mb-2">Clinic Tenant Not Found</h1>
        <p className="text-xs text-[#9E9B93] mb-6 font-mono">
          No practice organization matches UUID {id}.
        </p>
        <Link href="/admin/subscribers" className="btn btn-primary text-xs">
          ← Back to Subscribers Directory
        </Link>
      </div>
    );
  }

  // Fetch subscription with plan
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('organization_id', id)
    .maybeSingle();

  // Fetch available subscription plans
  const { data: plans } = await admin
    .from('subscription_plans')
    .select('id, name, slug, price_inr, included_ai_requests')
    .eq('is_active', true)
    .order('price_inr', { ascending: true });

  // Fetch clinic profile
  const { data: clinicProfile } = await admin
    .from('clinic_profiles')
    .select('*')
    .eq('organization_id', id)
    .maybeSingle();

  // Fetch services
  const { data: services } = await admin
    .from('services')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: true });

  // Fetch memberships & profiles
  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('*')
    .eq('organization_id', id);

  const userIds = (memberships ?? []).map((m: any) => m.user_id);
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: userProfiles } = await admin
      .from('user_profiles')
      .select('*')
      .in('id', userIds);
    profiles = userProfiles ?? [];
  }

  // Fetch payment transactions
  const { data: payments } = await admin
    .from('payment_transactions')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent AI usage records
  const { data: aiUsage } = await admin
    .from('ai_usage_records')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const plan = sub?.subscription_plans as any;
  const isExpired = sub?.expires_at ? new Date(sub.expires_at) < new Date() : false;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#9E9B93]">
        <Link href="/admin/subscribers" className="text-[#E87A38] hover:underline">
          ← Subscribers
        </Link>
        <span>/</span>
        <span className="text-[#F3F0E8]">{org.name}</span>
      </div>

      {/* Hero Header Card */}
      <div className="card p-6 bg-[#171614] border border-[#F3F0E8]/12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(232,75,44,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E84B2C] to-[#C86938] flex items-center justify-center text-2xl text-[#F3F0E8] shadow-[0_0_20px_rgba(232,75,44,0.3)] shrink-0">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading text-2xl font-semibold text-[#F3F0E8]">{org.name}</h1>
                <span className={`badge ${
                  org.status === 'active'
                    ? 'badge-success'
                    : org.status === 'suspended'
                    ? 'badge-danger'
                    : 'badge-warning'
                }`}>
                  {org.status}
                </span>
                {sub?.status && (
                  <span className={`badge ${
                    sub.status === 'active' && !isExpired ? 'badge-success' : 'badge-danger'
                  }`}>
                    Subscription: {sub.status} {isExpired ? '(Expired)' : ''}
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-[#9E9B93] mt-1.5 flex items-center gap-2 flex-wrap">
                <span>slug: {org.slug}</span>
                <span>•</span>
                <span>tz: {org.timezone || 'UTC'}</span>
                <span>•</span>
                <span>created: {new Date(org.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>

          <SubscriberActions
            organizationId={org.id}
            status={org.status}
            hasSubscription={!!sub}
            plans={plans ?? []}
            currentPlanId={sub?.plan_id}
          />
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Subscription Tier
          </div>
          <div className="font-mono text-xl font-bold text-[#E87A38]">
            {plan?.name ?? 'No Plan'}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-0.5">
            {plan?.price_inr ? `₹${Number(plan.price_inr).toLocaleString('en-IN')}/mo` : 'Trial Tier'}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Expiration Date
          </div>
          <div className={`font-mono text-xl font-bold ${
            isExpired ? 'text-[#E84B2C]' : 'text-[#63C7A2]'
          }`}>
            {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-0.5">
            {sub?.expires_at
              ? isExpired
                ? 'Terminated / Expired'
                : `Renews in ${Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 3600 * 24))} days`
              : 'Continuous'}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            AI Load &amp; Cost
          </div>
          <div className="font-mono text-xl font-bold text-[#F3F0E8]">
            {sub?.ai_requests_used ?? 0}
            <span className="text-xs font-normal text-[#9E9B93] ml-1">/ {plan?.included_ai_requests ?? 500} req</span>
          </div>
          <div className="text-xs font-mono text-[#63C7A2] mt-0.5">
            Est. Cost: ₹{Number(sub?.ai_cost_used_inr ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Messages Handled
          </div>
          <div className="font-mono text-xl font-bold text-[#F3F0E8]">
            {Number(sub?.inbound_messages_used ?? 0) + Number(sub?.outbound_messages_used ?? 0)}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-0.5">
            {sub?.inbound_messages_used ?? 0} In • {sub?.outbound_messages_used ?? 0} Out
          </div>
        </div>
      </div>

      {/* Clinic Profile & Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Services */}
        <div className="card p-5">
          <h2 className="font-heading text-sm font-semibold text-[#F3F0E8] mb-3 flex items-center gap-2">
            <span className="text-[#E87A38]">🏢</span> Practice Profile &amp; Services
          </h2>

          <div className="space-y-2 text-xs mb-5 p-3 rounded-xl bg-[#111110] border border-[#F3F0E8]/08">
            <div className="flex justify-between py-1 border-b border-[#F3F0E8]/06">
              <span className="text-[#9E9B93]">Display Name</span>
              <span className="font-medium text-[#F3F0E8]">{clinicProfile?.clinic_name || org.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F0E8]/06">
              <span className="text-[#9E9B93]">Address</span>
              <span className="text-[#D0CBC1]">{clinicProfile?.address || 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F0E8]/06">
              <span className="text-[#9E9B93]">Phone</span>
              <span className="font-mono text-[#D0CBC1]">{clinicProfile?.phone_number || 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#9E9B93]">Email</span>
              <span className="font-mono text-[#D0CBC1]">{clinicProfile?.email || 'Not configured'}</span>
            </div>
          </div>

          <h3 className="font-heading text-xs font-semibold text-[#D0CBC1] mb-2 uppercase tracking-wider">
            Registered Services ({services?.length ?? 0})
          </h3>
          {(services ?? []).length === 0 ? (
            <p className="text-xs text-[#9E9B93] italic">No clinic services configured.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(services ?? []).map((srv: any) => (
                <div key={srv.id} className="flex justify-between items-center p-2.5 rounded-lg bg-[#111110] border border-[#F3F0E8]/06 text-xs">
                  <div>
                    <span className="font-medium text-[#F3F0E8]">{srv.name}</span>
                    <span className="text-[#9E9B93] font-mono text-[11px] ml-2">({srv.duration_minutes}m)</span>
                  </div>
                  <div className="font-mono font-semibold text-[#63C7A2]">
                    ₹{Number(srv.price_inr).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="card p-5">
          <h2 className="font-heading text-sm font-semibold text-[#F3F0E8] mb-3 flex items-center gap-2">
            <span className="text-[#E87A38]">👥</span> Clinic Staff &amp; Authorized Members ({memberships?.length ?? 0})
          </h2>

          {(memberships ?? []).length === 0 ? (
            <p className="text-xs text-[#9E9B93] italic">No members linked to this practice.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(memberships ?? []).map((mem: any) => {
                const userProf = profiles.find((p: any) => p.id === mem.user_id);
                return (
                  <div key={mem.id} className="flex items-center justify-between p-3 rounded-xl bg-[#111110] border border-[#F3F0E8]/08">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1C1916] border border-[#F3F0E8]/10 flex items-center justify-center font-bold text-xs text-[#E87A38]">
                        {userProf?.full_name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-[#F3F0E8]">
                          {userProf?.full_name || 'Staff User'}
                        </div>
                        <div className="text-[10px] font-mono text-[#9E9B93]">
                          {userProf?.phone || 'No phone'} • id: {mem.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-neutral font-mono text-[10px] uppercase">
                      {mem.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#F3F0E8]/08">
          <h2 className="font-heading text-sm font-semibold text-[#F3F0E8] flex items-center gap-2">
            <span className="text-[#E87A38]">💳</span> Billing &amp; Settlement History
          </h2>
        </div>
        {(payments ?? []).length === 0 ? (
          <p className="text-xs text-[#9E9B93] p-6 text-center italic">No payment transactions registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                    <td className="font-mono text-xs text-[#D0CBC1]">{p.id.slice(0, 16)}...</td>
                    <td className="font-mono font-semibold text-xs text-[#63C7A2]">
                      ₹{Number(p.amount_inr).toLocaleString('en-IN')}
                    </td>
                    <td className="font-mono text-xs uppercase">{p.payment_method || 'UPI'}</td>
                    <td>
                      <span className={`badge ${
                        p.status === 'success' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#9E9B93]">
                      {new Date(p.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Usage Records */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#F3F0E8]/08">
          <h2 className="font-heading text-sm font-semibold text-[#F3F0E8] flex items-center gap-2">
            <span className="text-[#E87A38]">🤖</span> Real-Time AI Model Execution Logs
          </h2>
        </div>
        {(aiUsage ?? []).length === 0 ? (
          <p className="text-xs text-[#9E9B93] p-6 text-center italic">No AI telemetry records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Model Endpoint</th>
                  <th>Input Tokens</th>
                  <th>Output Tokens</th>
                  <th>Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                {(aiUsage ?? []).map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                    <td className="font-mono text-xs text-[#9E9B93]">
                      {new Date(u.created_at).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="font-mono text-xs text-[#E87A38]">{u.model}</td>
                    <td className="font-mono text-xs text-[#D0CBC1]">{u.input_tokens}</td>
                    <td className="font-mono text-xs text-[#D0CBC1]">{u.output_tokens}</td>
                    <td className="font-mono text-xs font-semibold text-[#63C7A2]">
                      ₹{Number(u.estimated_cost_inr || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
