import { requireSuperAdmin } from '@/lib/supabase/server';
import ExpirationRowActions from './expiration-actions';

export const dynamic = 'force-dynamic';

export default async function AdminExpirationsPage() {
  const { admin } = await requireSuperAdmin();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('*, organizations(name, slug), subscription_plans(name)')
    .order('expires_at', { ascending: true });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>⏰ Subscription Expirations & Grace Periods</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Monitor clinics with upcoming renewals, expiring grace periods, and automated reminders.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Clinic</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Expiration Date</th>
              <th>Grace Period End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              (subs ?? []).map((sub: any) => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 700 }}>{sub.organizations?.name ?? 'Clinic'}</td>
                  <td>{sub.subscription_plans?.name ?? 'Pro Plan'}</td>
                  <td>
                    <span className={`badge badge-${sub.status === 'active' ? 'success' : sub.status === 'grace_period' ? 'warning' : 'error'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
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
  );
}
