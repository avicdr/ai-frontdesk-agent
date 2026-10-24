import { requireSuperAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform Revenue Analytics' };

export default async function AdminRevenuePage() {
  const { admin } = await requireSuperAdmin();

  const { data: payments } = await admin
    .from('payment_transactions')
    .select('*')
    .eq('status', 'success');

  const totalRevenue = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount_inr || 0), 0);
  const paymentCount = payments?.length ?? 0;
  const avgRevenue = paymentCount > 0 ? Math.round(totalRevenue / paymentCount) : 4999;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[#F3F0E8]/08 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
          <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
            Financial Ledger Telemetry
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
          SaaS Revenue &amp; MRR Performance
        </h1>
        <p className="text-sm text-[#9E9B93] mt-1">
          Monthly Recurring Revenue (MRR), subscriber lifetime value, and collection summaries.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-[#171614] border-[#E84B2C]/30 shadow-[0_0_16px_rgba(232,75,44,0.08)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Total Collected Revenue
          </div>
          <div className="font-mono text-3xl font-bold text-[#F3F0E8]">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#63C7A2] font-mono mt-1">
            Confirmed settlements
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Avg Revenue Per Clinic
          </div>
          <div className="font-mono text-3xl font-bold text-[#63C7A2]">
            ₹{avgRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#9E9B93] font-mono mt-1">
            Active subscriptions
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Billing Architecture
          </div>
          <div className="font-heading text-lg font-semibold text-[#F3F0E8] mt-1">
            Monthly Pre-Paid
          </div>
          <div className="text-xs text-[#9E9B93] mt-1">
            Auto-expiring 30-day cycles
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E9B93] mb-1">
            Settlement Rails
          </div>
          <div className="font-heading text-lg font-semibold text-[#E87A38] mt-1">
            UPI &amp; Web3 Crypto
          </div>
          <div className="text-xs text-[#9E9B93] mt-1 font-mono">
            Zero-chargeback settlement
          </div>
        </div>
      </div>
    </div>
  );
}
