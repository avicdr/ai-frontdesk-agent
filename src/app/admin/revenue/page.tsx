import { requireSuperAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminRevenuePage() {
  const { admin } = await requireSuperAdmin();

  const { data: payments } = await admin
    .from('payment_transactions')
    .select('*')
    .eq('status', 'success');

  const totalRevenue = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount_inr || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💰 SaaS Revenue & MRR Analytics</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Monthly Recurring Revenue (MRR), subscriber lifetime value, and collection summaries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Total Collected Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Average Revenue Per Clinic</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'hsl(142 71% 45%)' }}>
            ₹4,999
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Billing Cycle</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginTop: '0.35rem' }}>
            Monthly Pre-Paid
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Payment Gateway</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(221 83% 58%)', marginTop: '0.35rem' }}>
            Direct UPI & Cashfree
          </div>
        </div>
      </div>
    </div>
  );
}
