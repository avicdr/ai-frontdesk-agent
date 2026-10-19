import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const user = await requireServerUser();
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) redirect('/dashboard');

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📋 Platform Security & Audit Trail</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Immutable audit record of all tenant events, manual overrides, payment approvals, and permission checks.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor Type</th>
              <th>Actor ID</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              (logs ?? []).map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'hsl(var(--color-primary))' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${log.actor_type === 'super_admin' ? 'info' : 'muted'}`}>
                      {log.actor_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {log.actor_id?.slice(0, 8)}...
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {log.entity_type} ({log.entity_id?.slice(0, 8)}...)
                  </td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'hsl(var(--color-text-muted))' }}>
                    {JSON.stringify(log.new_state || log.metadata || {})}
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
