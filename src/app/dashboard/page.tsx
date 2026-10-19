import { redirect } from 'next/navigation';
import { requireServerUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string) {
  const admin = createSupabaseAdminClient();

  // Get user's organization
  const { data: membership } = await admin
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (!membership) return null;

  const orgId = membership.organization_id;

  const [orgRes, profileRes, subRes, waRes, calRes, apptRes, convRes] = await Promise.all([
    admin.from('organizations').select('*').eq('id', orgId).single(),
    admin.from('clinic_profiles').select('onboarding_step, onboarding_completed_at').eq('organization_id', orgId).single(),
    admin.from('subscriptions').select('*, subscription_plans(name, included_ai_requests, included_inbound_messages)').eq('organization_id', orgId).maybeSingle(),
    admin.from('whatsapp_integrations').select('status').eq('organization_id', orgId).maybeSingle(),
    admin.from('calendar_integrations').select('status').eq('organization_id', orgId).maybeSingle(),
    admin.from('appointments')
      .select('id, patient_name, starts_at, status, services(name)')
      .eq('organization_id', orgId)
      .gte('starts_at', new Date().toISOString())
      .not('status', 'in', '("cancelled","rescheduled")')
      .order('starts_at')
      .limit(5),
    admin.from('conversations')
      .select('id, patient_phone, patient_name, last_message_at, status, owner')
      .eq('organization_id', orgId)
      .order('last_message_at', { ascending: false })
      .limit(5),
  ]);

  return {
    org: orgRes.data,
    profile: profileRes.data,
    subscription: subRes.data,
    whatsapp: waRes.data,
    calendar: calRes.data,
    appointments: apptRes.data ?? [],
    conversations: convRes.data ?? [],
    role: membership.role,
  };
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: 'hsl(142, 71%, 55%)',
    active: 'hsl(142, 71%, 55%)',
    error: 'hsl(0, 84%, 60%)',
    disconnected: 'hsl(var(--color-text-muted))',
    expired: 'hsl(0, 84%, 60%)',
    suspended: 'hsl(38, 92%, 50%)',
  };
  return (
    <span style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: colors[status] ?? 'hsl(var(--color-text-muted))',
      display: 'inline-block',
      marginRight: '0.375rem',
    }} />
  );
}

export default async function DashboardPage() {
  const user = await requireServerUser();
  const data = await getDashboardData(user.id);

  if (!data) {
    redirect('/onboarding');
  }

  const { org, profile, subscription, whatsapp, calendar, appointments, conversations } = data;
  const plan = (subscription as Record<string, unknown>)?.subscription_plans as Record<string, unknown> | null;
  const onboardingComplete = !!profile?.onboarding_completed_at;

  const usagePercent = plan && subscription
    ? Math.min(100, Math.round(((subscription as Record<string, number>).ai_requests_used / (plan.included_ai_requests as number)) * 100))
    : 0;

  const expiresAt = (subscription as Record<string, string> | null)?.expires_at;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      {/* Onboarding banner */}
      {!onboardingComplete && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'hsla(221, 83%, 58%, 0.1)',
          border: '1px solid hsla(221, 83%, 58%, 0.3)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Complete Your Setup</div>
            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
              Finish onboarding to activate your AI receptionist. Step {profile?.onboarding_step ?? 1} of 8.
            </div>
            <div className="progress-bar" style={{ width: 200, marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${((profile?.onboarding_step ?? 1) / 8) * 100}%` }} />
            </div>
          </div>
          <Link href="/onboarding" className="btn btn-primary btn-sm">Continue Setup →</Link>
        </div>
      )}

      {/* Expiry warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'hsla(38, 92%, 50%, 0.1)',
          border: '1px solid hsla(38, 92%, 50%, 0.3)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ fontSize: '0.9rem' }}>
            ⚠️ Your subscription expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>.
            Renew to avoid service interruption.
          </div>
          <Link href="/dashboard/billing" className="btn btn-sm" style={{ background: 'hsl(38, 92%, 50%)', color: 'white' }}>
            Renew Now
          </Link>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Welcome back 👋
        </h1>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem' }}>
          {org?.name} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Agent Status */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.25rem' }}>Agent Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusDot status={onboardingComplete && subscription?.status === 'active' ? 'active' : 'disconnected'} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {onboardingComplete && subscription?.status === 'active' ? 'Live' : 'Inactive'}
            </span>
          </div>
          <div className="stat-label">
            {onboardingComplete ? 'Setup complete' : 'Setup required'}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.25rem' }}>WhatsApp</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusDot status={whatsapp?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {whatsapp?.status === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <div className="stat-label">
            {whatsapp?.status === 'connected' ? 'Receiving messages' : 'Connect to go live'}
          </div>
        </div>

        {/* Calendar */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.25rem' }}>Calendar</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusDot status={calendar?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {calendar?.status === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <div className="stat-label">Google Calendar</div>
        </div>

        {/* Subscription */}
        <div className="stat-card">
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.25rem' }}>Subscription</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusDot status={subscription?.status ?? 'expired'} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {(plan as Record<string, string> | null)?.name ?? 'No plan'}
            </span>
          </div>
          <div className="stat-label">
            {expiresAt
              ? `Expires ${new Date(expiresAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : 'No active subscription'}
          </div>
        </div>
      </div>

      {/* AI Usage */}
      {subscription && plan && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>AI Usage This Month</div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                {(subscription as Record<string, number>).ai_requests_used} / {plan.included_ai_requests as number} AI requests
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }} className={usagePercent >= 80 ? '' : ''}>
              {usagePercent}%
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${usagePercent}%`,
                background: usagePercent >= 95 ? 'hsl(0, 84%, 60%)' : usagePercent >= 80 ? 'hsl(38, 92%, 50%)' : undefined,
              }}
            />
          </div>
          {usagePercent >= 80 && (
            <div style={{ fontSize: '0.75rem', color: usagePercent >= 95 ? 'hsl(0, 84%, 70%)' : 'hsl(38, 92%, 60%)', marginTop: '0.5rem' }}>
              {usagePercent >= 95 ? '⚠️ Quota nearly exhausted — upgrade to avoid disruption.' : '⚡ Usage at 80% — consider upgrading.'}
            </div>
          )}
        </div>
      )}

      {/* Two-column: Appointments + Conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Upcoming Appointments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Upcoming Appointments</h2>
            <Link href="/dashboard/appointments" style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
              📅 No upcoming appointments
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map((appt: Record<string, unknown>) => (
                <div key={appt.id as string} style={{
                  padding: '0.75rem',
                  background: 'hsl(var(--color-surface-2))',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{appt.patient_name as string}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      {(appt.services as Record<string, unknown> | null)?.name as string ?? 'Appointment'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', fontWeight: 600 }}>
                      {new Date(appt.starts_at as string).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                      {new Date(appt.starts_at as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Recent Conversations</h2>
            <Link href="/dashboard/conversations" style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
              💬 No conversations yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conversations.map((conv: Record<string, unknown>) => (
                <div key={conv.id as string} style={{
                  padding: '0.75rem',
                  background: 'hsl(var(--color-surface-2))',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'hsl(var(--color-surface-3))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}>
                      {(conv.patient_name as string)?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {(conv.patient_name as string | null) ?? conv.patient_phone as string}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                        {conv.owner === 'human' ? '👤 Human' : '🤖 AI'}
                        {conv.status === 'handed_off' && ' · Needs attention'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`badge badge-${conv.status === 'active' ? 'success' : conv.status === 'handed_off' ? 'warning' : 'muted'}`}>
                      {conv.status as string}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/onboarding" className="btn btn-secondary btn-sm">⚙️ Edit Configuration</Link>
          <Link href="/dashboard/conversations" className="btn btn-secondary btn-sm">💬 View Conversations</Link>
          <Link href="/dashboard/appointments" className="btn btn-secondary btn-sm">📅 Appointments</Link>
          <Link href="/dashboard/billing" className="btn btn-secondary btn-sm">💳 Billing</Link>
          <Link href="/dashboard/agent-test" className="btn btn-secondary btn-sm">🧪 Test Agent</Link>
        </div>
      </div>
    </div>
  );
}
