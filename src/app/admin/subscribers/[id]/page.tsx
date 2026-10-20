import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/supabase/server';
import SubscriberActions from './subscriber-actions';

export const dynamic = 'force-dynamic';

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
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Subscriber Clinic Not Found</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '1.5rem' }}>
          No clinic organization found with ID <code>{id}</code>.
        </p>
        <Link href="/admin/subscribers" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          ← Back to All Subscribers
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        <Link href="/admin/subscribers" style={{ color: 'hsl(var(--color-brand))', textDecoration: 'none' }}>
          ← Back to Subscribers
        </Link>
        <span style={{ color: 'hsl(var(--color-text-muted))' }}>/</span>
        <span style={{ color: 'hsl(var(--color-text-secondary))' }}>{org.name}</span>
      </div>

      {/* Hero Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              flexShrink: 0,
            }}>
              🏥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{org.name}</h1>
                <span className={`badge badge-${org.status === 'active' ? 'success' : org.status === 'suspended' ? 'error' : 'info'}`}>
                  {org.status}
                </span>
                {sub?.status && (
                  <span className={`badge badge-${sub.status === 'active' && !isExpired ? 'success' : 'error'}`}>
                    Subscription: {sub.status} {isExpired ? '(Expired)' : ''}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                Slug: <code>{org.slug}</code> • ID: <code>{org.id}</code> • Timezone: {org.timezone} • Created: {new Date(org.created_at).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <SubscriberActions
            organizationId={org.id}
            status={org.status}
            hasSubscription={!!sub}
            plans={plans ?? []}
            currentPlanId={sub?.plan_id}
          />
        </div>
      </div>

      {/* Grid of Key Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Plan & Pricing */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Subscription Plan
          </div>
          <div className="stat-value" style={{ color: 'hsl(221, 83%, 70%)' }}>
            {plan?.name ?? 'No Plan'}
          </div>
          <div className="stat-label">
            {plan?.price_inr ? `₹${Number(plan.price_inr).toLocaleString('en-IN')} / month` : 'Self-serve / Trial'}
          </div>
        </div>

        {/* Expiration status */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Expires On
          </div>
          <div className="stat-value" style={{ color: isExpired ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 55%)' }}>
            {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
          </div>
          <div className="stat-label">
            {sub?.expires_at
              ? isExpired
                ? 'Subscription currently expired'
                : `Renews in ${Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 3600 * 24))} days`
              : 'No expiration date'}
          </div>
        </div>

        {/* AI Usage */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            AI Consumption
          </div>
          <div className="stat-value" style={{ color: 'hsl(265, 83%, 70%)' }}>
            {sub?.ai_requests_used ?? 0}
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-muted))' }}> / {plan?.included_ai_requests ?? 500} req</span>
          </div>
          <div className="stat-label">
            Est. Cost: ₹{Number(sub?.ai_cost_used_inr ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Messaging */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Messages Processed
          </div>
          <div className="stat-value">
            {Number(sub?.inbound_messages_used ?? 0) + Number(sub?.outbound_messages_used ?? 0)}
          </div>
          <div className="stat-label">
            {sub?.inbound_messages_used ?? 0} Inbound • {sub?.outbound_messages_used ?? 0} Outbound
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Clinic Profile & Services */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏢</span> Clinic Profile & Services
          </h2>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Display Name: </span>
              <strong>{clinicProfile?.clinic_name || org.name}</strong>
            </div>
            <div>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Address: </span>
              <span>{clinicProfile?.address || 'Not configured'}</span>
            </div>
            <div>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Phone: </span>
              <span>{clinicProfile?.phone_number || 'Not configured'}</span>
            </div>
            <div>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Email: </span>
              <span>{clinicProfile?.email || 'Not configured'}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
            Registered Services ({services?.length ?? 0})
          </h3>
          {(services ?? []).length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>No services added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(services ?? []).map((srv: any) => (
                <div key={srv.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'hsl(var(--color-bg-secondary))',
                  fontSize: '0.8rem',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{srv.name}</span>
                    <span style={{ color: 'hsl(var(--color-text-muted))', marginLeft: '0.5rem' }}>({srv.duration_minutes} mins)</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'hsl(142 71% 55%)' }}>
                    ₹{Number(srv.price_inr).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members & Staff */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👥</span> Clinic Members & Staff ({memberships?.length ?? 0})
          </h2>

          {(memberships ?? []).length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>No members registered.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(memberships ?? []).map((mem: any) => {
                const userProf = profiles.find((p: any) => p.id === mem.user_id);
                return (
                  <div key={mem.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'hsl(var(--color-bg-secondary))',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}>
                        {userProf?.full_name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {userProf?.full_name || 'Staff User'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                          {userProf?.phone || 'No phone'} • User ID: {mem.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
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
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💳</span> Payment History
        </h2>
        {(payments ?? []).length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>No payment transactions recorded for this clinic.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.amount_inr).toLocaleString('en-IN')}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{p.payment_method || 'UPI'}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'error'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
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
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🤖</span> Recent AI Requests & Token Logs
        </h2>
        {(aiUsage ?? []).length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>No AI requests logged yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Model</th>
                  <th>Input Tokens</th>
                  <th>Output Tokens</th>
                  <th>Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                {(aiUsage ?? []).map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                      {new Date(u.created_at).toLocaleTimeString('en-IN')}
                    </td>
                    <td><code>{u.model}</code></td>
                    <td>{u.input_tokens}</td>
                    <td>{u.output_tokens}</td>
                    <td style={{ fontWeight: 600, color: 'hsl(265, 83%, 70%)' }}>
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
