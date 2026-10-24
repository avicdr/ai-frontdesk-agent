import { redirect } from 'next/navigation';
import { requireServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import Link from 'next/link';
import { PostOnboardingCryptoPrompt } from '@/components/dashboard/PostOnboardingCryptoPrompt';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string, userEmail?: string) {
  try {
    const admin = createSupabaseAdminClient();

    // 1. Fetch organization membership for this user only
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    let orgId = membership?.organization_id;

    // If user has no organization membership, check if super-admin
    if (!orgId) {
      const isSuperAdmin = isSuperAdminEmail(userEmail);
      if (!isSuperAdmin) {
        return null;
      }
    }

    if (!orgId) {
      return null;
    }

    const [orgRes, profileRes, subRes, waRes, calRes, apptRes, convRes] = await Promise.all([
      admin.from('organizations').select('*').eq('id', orgId).maybeSingle(),
      admin.from('clinic_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
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
      org: orgRes.data ?? { id: orgId, name: 'My Dental Clinic', slug: 'my-clinic', timezone: 'Asia/Kolkata', status: 'active' },
      profile: profileRes.data ?? { clinic_name: orgRes.data?.name || 'My Dental Clinic', onboarding_step: 8, onboarding_completed_at: new Date().toISOString() },
      subscription: subRes.data ?? null,
      whatsapp: waRes.data ?? { status: 'disconnected' },
      calendar: calRes.data ?? { status: 'disconnected' },
      appointments: apptRes.data ?? [],
      conversations: convRes.data ?? [],
      role: membership?.role ?? 'owner',
    };
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
}

function StatusDot({ status }: { status: string }) {
  const dotStyles: Record<string, { bg: string; border: string; glow?: string }> = {
    connected: { bg: '#63C7A2', border: 'rgba(99, 199, 162, 0.4)', glow: '0 0 8px rgba(99, 199, 162, 0.6)' },
    active: { bg: '#63C7A2', border: 'rgba(99, 199, 162, 0.4)', glow: '0 0 8px rgba(99, 199, 162, 0.6)' },
    error: { bg: '#E84B2C', border: 'rgba(232, 75, 44, 0.4)', glow: '0 0 8px rgba(232, 75, 44, 0.6)' },
    disconnected: { bg: '#9E9B93', border: 'rgba(243, 240, 232, 0.15)' },
    expired: { bg: '#E84B2C', border: 'rgba(232, 75, 44, 0.4)' },
    suspended: { bg: '#E87A38', border: 'rgba(232, 122, 56, 0.4)' },
  };

  const current = dotStyles[status] ?? { bg: '#9E9B93', border: 'rgba(243, 240, 232, 0.15)' };

  return (
    <span style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: current.bg,
      border: `1.5px solid ${current.border}`,
      boxShadow: current.glow ?? 'none',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

export default async function DashboardPage() {
  let user;
  try {
    user = await requireServerUser();
  } catch {
    redirect('/login?returnUrl=/dashboard');
  }

  const data = await getDashboardData(user.id, user.email);
  if (!data) {
    redirect('/onboarding');
  }

  const { org, profile, subscription, whatsapp, calendar, appointments, conversations } = data;
  const plan = (subscription as Record<string, unknown>)?.subscription_plans as Record<string, unknown> | null;
  const onboardingComplete = !!profile?.onboarding_completed_at;

  const planLimit = (plan?.included_ai_requests as number) || 500;
  const usagePercent = plan && subscription
    ? Math.min(100, Math.round(((subscription as Record<string, number>).ai_requests_used / planLimit) * 100))
    : 0;

  const expiresAt = (subscription as Record<string, string> | null)?.expires_at;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* International Crypto Payment Prompt */}
      <PostOnboardingCryptoPrompt
        subscriptionStatus={subscription?.status}
        orgCountry={(org as any)?.country}
        orgTimezone={(org as any)?.timezone}
        currentPlanSlug={(plan as any)?.slug}
      />

      {/* Onboarding banner */}
      {!onboardingComplete && (
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.12), rgba(200, 105, 56, 0.06))',
          border: '1px solid rgba(232, 75, 44, 0.3)',
          borderRadius: '14px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 0 24px rgba(232, 75, 44, 0.1)',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#F3F0E8', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: '#E87A38' }}>✦</span> Complete Your Receptionist Setup
            </div>
            <div style={{ fontSize: '0.85rem', color: '#D0CBC1' }}>
              Finish onboarding to activate WhatsApp automated booking. Step {profile?.onboarding_step ?? 1} of 8.
            </div>
            <div className="progress-bar" style={{ width: 220, marginTop: '0.75rem' }}>
              <div className="progress-fill" style={{ width: `${((profile?.onboarding_step ?? 1) / 8) * 100}%` }} />
            </div>
          </div>
          <Link href="/onboarding" className="btn btn-primary btn-sm">Continue Setup →</Link>
        </div>
      )}

      {/* Expiry warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div style={{
          padding: '1.15rem 1.5rem',
          background: 'rgba(232, 122, 56, 0.12)',
          border: '1px solid rgba(232, 122, 56, 0.3)',
          borderRadius: '14px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#E87A38' }}>
            ⚠️ Your subscription expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>.
            Renew to keep your AI front desk active.
          </div>
          <Link href="/dashboard/billing" className="btn btn-primary btn-sm">
            Renew Now
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 500,
            fontFamily: 'var(--font-display)',
            color: '#F3F0E8',
            letterSpacing: '-0.025em',
            marginBottom: '0.35rem',
          }}>
            Welcome back
          </h1>
          <p style={{ color: '#9E9B93', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{org?.name}</span>
            <span style={{ color: 'rgba(243, 240, 232, 0.2)' }}>&bull;</span>
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            ● AI Desk Active
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        width: '100%',
      }}>
        {/* Agent Status */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: '#9E9B93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Agent Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.35rem' }}>
            <StatusDot status={onboardingComplete && subscription?.status === 'active' ? 'active' : 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.35rem', color: '#F3F0E8' }}>
              {onboardingComplete && subscription?.status === 'active' ? 'Live' : 'Inactive'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#9E9B93', marginTop: '0.35rem' }}>
            {onboardingComplete ? 'Setup complete & operational' : 'Setup required'}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: '#9E9B93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            WhatsApp Channel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.35rem' }}>
            <StatusDot status={whatsapp?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.35rem', color: '#F3F0E8' }}>
              {whatsapp?.status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#9E9B93', marginTop: '0.35rem' }}>
            {whatsapp?.status === 'connected' ? 'Listening & booking' : 'Connect via Integrations'}
          </div>
        </div>

        {/* Calendar */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: '#9E9B93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Google Calendar
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.35rem' }}>
            <StatusDot status={calendar?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.35rem', color: '#F3F0E8' }}>
              {calendar?.status === 'connected' ? 'Synced' : 'Not synced'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#9E9B93', marginTop: '0.35rem' }}>
            Real-time schedule check
          </div>
        </div>

        {/* Subscription */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: '#9E9B93', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Subscription Tier
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.35rem' }}>
            <StatusDot status={subscription?.status ?? 'expired'} />
            <span style={{ fontWeight: 600, fontSize: '1.35rem', color: '#F3F0E8' }}>
              {(plan as Record<string, string> | null)?.name ?? 'No plan'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#9E9B93', marginTop: '0.35rem' }}>
            {expiresAt
              ? `Renews ${new Date(expiresAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : 'No active plan'}
          </div>
        </div>
      </div>

      {/* AI Usage Card */}
      {subscription && plan && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#F3F0E8', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ color: '#E87A38' }}>✦</span> AI Consumption This Cycle
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9E9B93', marginTop: '0.2rem' }}>
                {(subscription as Record<string, number>).ai_requests_used} of {planLimit.toLocaleString()} monthly AI requests utilized
              </div>
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: usagePercent >= 90 ? '#E84B2C' : '#E87A38',
            }}>
              {usagePercent}%
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${usagePercent}%`,
                background: usagePercent >= 95 ? '#E84B2C' : usagePercent >= 80 ? 'linear-gradient(90deg, #E87A38, #E84B2C)' : 'linear-gradient(90deg, #E84B2C, #E87A38)',
              }}
            />
          </div>
          {usagePercent >= 80 && (
            <div style={{ fontSize: '0.78rem', color: usagePercent >= 95 ? '#E84B2C' : '#E87A38', marginTop: '0.65rem' }}>
              {usagePercent >= 95 ? '⚠️ Quota nearly exhausted — upgrade your plan to maintain 24/7 coverage.' : '⚡ Quota at 80% capacity — consider tier upgrade.'}
            </div>
          )}
        </div>
      )}

      {/* Two-column: Appointments + Conversations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        width: '100%',
      }}>
        {/* Upcoming Appointments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F3F0E8', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>📅</span> Upcoming Appointments
            </h2>
            <Link href="/dashboard/appointments" style={{ fontSize: '0.8rem', color: '#E87A38', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9E9B93', fontSize: '0.875rem' }}>
              No upcoming appointments scheduled yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map((appt: Record<string, unknown>) => (
                <div key={appt.id as string} style={{
                  padding: '0.85rem 1rem',
                  background: '#1C1916',
                  border: '1px solid rgba(243, 240, 232, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s ease',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F3F0E8' }}>{appt.patient_name as string}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9E9B93', marginTop: '0.15rem' }}>
                      {(appt.services as Record<string, unknown> | null)?.name as string ?? 'Appointment'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#E87A38', fontWeight: 600 }}>
                      {new Date(appt.starts_at as string).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.15rem' }}>
                      {new Date(appt.starts_at as string).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F3F0E8', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>💬</span> Recent Conversations
            </h2>
            <Link href="/dashboard/conversations" style={{ fontSize: '0.8rem', color: '#E87A38', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9E9B93', fontSize: '0.875rem' }}>
              No patient conversations recorded yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conversations.map((conv: Record<string, unknown>) => (
                <div key={conv.id as string} style={{
                  padding: '0.85rem 1rem',
                  background: '#1C1916',
                  border: '1px solid rgba(243, 240, 232, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'rgba(232, 75, 44, 0.12)',
                      border: '1px solid rgba(232, 75, 44, 0.25)',
                      color: '#E87A38',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {(conv.patient_name as string)?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F3F0E8' }}>
                        {(conv.patient_name as string | null) ?? conv.patient_phone as string}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.15rem' }}>
                        {conv.owner === 'human' ? '👤 Staff Member' : '🤖 AI Receptionist'}
                        {conv.status === 'handed_off' && ' · Needs attention'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${conv.status === 'active' ? 'badge-success' : conv.status === 'handed_off' ? 'badge-warning' : 'badge-neutral'}`}>
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
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '1rem', fontFamily: 'var(--font-sans)' }}>Operations & Tools</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/onboarding" className="btn btn-secondary btn-sm">⚙️ Clinic Profile & Persona</Link>
          <Link href="/dashboard/conversations" className="btn btn-secondary btn-sm">💬 Patient Inbox</Link>
          <Link href="/dashboard/appointments" className="btn btn-secondary btn-sm">📅 Calendar Schedule</Link>
          <Link href="/dashboard/agent-test" className="btn btn-secondary btn-sm">🧪 Test Receptionist</Link>
          <Link href="/dashboard/integrations" className="btn btn-secondary btn-sm">🔗 WhatsApp & Calendar</Link>
          <Link href="/dashboard/billing" className="btn btn-secondary btn-sm">💳 Plan & Invoicing</Link>
        </div>
      </div>
    </div>
  );
}
