import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const user = await requireServerUser();
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/dashboard');
  }

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🏥 All Subscribers & Tenants</h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
            Manage dental clinics, monitor subscription states, and perform administrative overrides.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Clinic</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Subscription</th>
              <th>Expires At</th>
              <th>AI Usage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org: any) => {
              const sub = (subs ?? []).find((s: any) => s.organization_id === org.id);
              const plan = sub?.subscription_plans as any;
              return (
                <tr key={org.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{org.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                      Slug: {org.slug} • {org.timezone}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${org.status === 'active' ? 'success' : org.status === 'onboarding' ? 'info' : 'error'}`}>
                      {org.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{plan?.name ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${sub?.status === 'active' ? 'success' : sub?.status === 'expired' ? 'error' : 'muted'}`}>
                      {sub?.status ?? 'none'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                    {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {sub?.ai_requests_used ?? 0} requests
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: org.status === 'active' ? 'hsl(0 84% 60%)' : 'hsl(142 71% 45%)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {org.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
