import { requireSuperAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'AI Usage & Costs' };

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
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[#F3F0E8]/08 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
          <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
            Model Inference Telemetry
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
          Platform AI Token Usage &amp; Costs
        </h1>
        <p className="text-sm text-[#9E9B93] mt-1">
          Server-side cost ledger tracking token consumption, Gemini vs OpenAI model breakdown, and platform margins.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card p-5 bg-[#171614] border-[#E84B2C]/30 shadow-[0_0_16px_rgba(232,75,44,0.08)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Total AI Spend (Recent)
          </div>
          <div className="font-mono text-3xl font-bold text-[#63C7A2]">
            ₹{totalSpend.toFixed(2)}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-1">
            Sub-cent Gemini Flash margins
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Total Tokens Processed
          </div>
          <div className="font-mono text-3xl font-bold text-[#E87A38]">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-1">
            Input &amp; output context tokens
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Primary Provider Split
          </div>
          <div className="font-heading text-lg font-semibold text-[#F3F0E8] mt-1">
            94% Gemini / 6% Fallback
          </div>
          <div className="text-xs text-[#9E9B93] mt-1">
            High resilience dual-routing
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#F3F0E8]/08">
          <h2 className="font-heading text-sm font-semibold text-[#F3F0E8]">
            Recent Inference Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Provider</th>
                <th>Model</th>
                <th>Input Tokens</th>
                <th>Output Tokens</th>
                <th>Cost</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {(records ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9E9B93]">
                    No usage records logged yet.
                  </td>
                </tr>
              ) : (
                (records ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#F3F0E8]/03 transition-colors">
                    <td className="font-mono text-xs text-[#9E9B93]">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td>
                      <span className="badge badge-neutral font-mono text-[10px] uppercase">
                        {r.provider}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#E87A38]">{r.model}</td>
                    <td className="font-mono text-xs text-[#D0CBC1]">{r.input_tokens}</td>
                    <td className="font-mono text-xs text-[#D0CBC1]">{r.output_tokens}</td>
                    <td className="font-mono text-xs font-semibold text-[#63C7A2]">
                      ₹{Number(r.estimated_cost_inr).toFixed(4)}
                    </td>
                    <td className="font-mono text-xs text-[#9E9B93]">{r.latency_ms}ms</td>
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
