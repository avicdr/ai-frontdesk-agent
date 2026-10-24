import { requireSuperAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Security & Audit Logs' };

export default async function AdminAuditLogsPage() {
  const { admin } = await requireSuperAdmin();

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[#F3F0E8]/08 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
          <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
            Compliance &amp; Tamper-Evident Ledger
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
          Security &amp; Audit Trail
        </h1>
        <p className="text-sm text-[#9E9B93] mt-1">
          Immutable audit record of all multi-tenant actions, tier overrides, payment verifications, and auth grants.
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Code</th>
                <th>Actor Privilege</th>
                <th>Actor ID</th>
                <th>Target Entity</th>
                <th>State Delta / Metadata</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9E9B93]">
                    No security events recorded in audit ledger.
                  </td>
                </tr>
              ) : (
                (logs ?? []).map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                    <td className="font-mono text-xs text-[#9E9B93] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="font-mono font-semibold text-xs text-[#E87A38]">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className={`badge font-mono text-[10px] uppercase ${
                        log.actor_type === 'super_admin' ? 'badge-primary' : 'badge-neutral'
                      }`}>
                        {log.actor_type}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#D0CBC1]">
                      {log.actor_id?.slice(0, 10)}...
                    </td>
                    <td className="font-mono text-xs text-[#F3F0E8]">
                      {log.entity_type} ({log.entity_id?.slice(0, 8)}...)
                    </td>
                    <td className="font-mono text-[11px] text-[#9E9B93] max-w-xs truncate">
                      {JSON.stringify(log.new_state || log.metadata || {})}
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
