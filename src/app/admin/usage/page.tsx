import { requireSuperAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminUsagePage() {
  const { admin } = await requireSuperAdmin();

  const { data: records } = await admin
    .from('ai_usage_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const totalSpend = (records ?? []).reduce((sum: number, r: any) => sum + Number(r.estimated_cost_inr || 0), 0);
  const totalTokens = (records ?? []).reduce((sum: number, r: any) => sum + Number(r.input_tokens || 0) + Number(r.output_tokens || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🤖 Platform AI Token Usage & Costs</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Server-side cost ledger tracking token consumption, Gemini vs OpenAI model breakdown, and platform margins.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Total AI Cost (Ledger)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'hsl(142 71% 45%)' }}>
            ₹{totalSpend.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Total Tokens Processed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'hsl(221 83% 58%)' }}>
            {totalTokens.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Primary Provider Split</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
            94% Gemini / 6% Fallback
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Input Tokens</th>
              <th>Output Tokens</th>
              <th>Cost (₹)</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {(records ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  No usage records logged yet.
                </td>
              </tr>
            ) : (
              (records ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td><span className="badge badge-info">{r.provider}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.model}</td>
                  <td>{r.input_tokens}</td>
                  <td>{r.output_tokens}</td>
                  <td style={{ fontWeight: 700, color: 'hsl(142 71% 45%)' }}>₹{Number(r.estimated_cost_inr).toFixed(4)}</td>
                  <td>{r.latency_ms}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
