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
  const dotStyles: Record<string, { bg: string; border: string }> = {
    connected: { bg: '#235A34', border: '#CEE8D8' },
    active: { bg: '#235A34', border: '#CEE8D8' },
    error: { bg: '#9E3D23', border: '#F8D7D5' },
    disconnected: { bg: '#988F86', border: '#E9DED3' },
    expired: { bg: '#9E3D23', border: '#F8D7D5' },
    suspended: { bg: '#8C5611', border: '#F8E4C4' },
  };

  const current = dotStyles[status] ?? { bg: '#988F86', border: '#E9DED3' };

  return (
    <span style={{
      width: 7,
      height: 7,
      borderRadius: '50%',
      backgroundColor: current.bg,
      border: `1.5px solid ${current.border}`,
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
          background: 'rgba(196, 81, 42, 0.08)',
          border: '1px solid rgba(196, 81, 42, 0.2)',
          borderRadius: '14px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#201A17', marginBottom: '0.2rem' }}>Complete Your Setup</div>
            <div style={{ fontSize: '0.85rem', color: '#756A62' }}>
              Finish onboarding to activate your AI receptionist. Step {profile?.onboarding_step ?? 1} of 8.
            </div>
            <div className="progress-bar" style={{ width: 220, marginTop: '0.6rem' }}>
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
          background: '#FEF7EC',
          border: '1px solid #F8E4C4',
          borderRadius: '14px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#8C5611' }}>
            ⚠️ Your subscription expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>.
            Renew to avoid service interruption.
          </div>
          <Link href="/dashboard/billing" className="btn btn-primary btn-sm">
            Renew Now
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 400,
          fontFamily: 'var(--font-display)',
          color: '#201A17',
          letterSpacing: '-0.02em',
          marginBottom: '0.35rem',
        }}>
          Welcome back
        </h1>
        <p style={{ color: '#756A62', fontSize: '0.9rem' }}>
          {org?.name} &mdash; {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
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
          <div style={{ fontSize: '0.75rem', color: '#756A62', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Agent Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <StatusDot status={onboardingComplete && subscription?.status === 'active' ? 'active' : 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#201A17' }}>
              {onboardingComplete && subscription?.status === 'active' ? 'Live' : 'Inactive'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#756A62', marginTop: '0.25rem' }}>
            {onboardingComplete ? 'Setup complete' : 'Setup required'}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.75rem', color: '#756A62', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            WhatsApp
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <StatusDot status={whatsapp?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#201A17' }}>
              {whatsapp?.status === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#756A62', marginTop: '0.25rem' }}>
            {whatsapp?.status === 'connected' ? 'Receiving messages' : 'Connect to go live'}
          </div>
        </div>

        {/* Calendar */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.75rem', color: '#756A62', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Calendar
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <StatusDot status={calendar?.status ?? 'disconnected'} />
            <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#201A17' }}>
              {calendar?.status === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#756A62', marginTop: '0.25rem' }}>
            Google Calendar
          </div>
        </div>

        {/* Subscription */}
        <div className="stat-card" style={{ width: '100%' }}>
          <div style={{ fontSize: '0.75rem', color: '#756A62', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Subscription
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <StatusDot status={subscription?.status ?? 'expired'} />
            <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#201A17' }}>
              {(plan as Record<string, string> | null)?.name ?? 'No plan'}
            </span>
          </div>
          <div className="stat-label" style={{ fontSize: '0.8rem', color: '#756A62', marginTop: '0.25rem' }}>
            {expiresAt
              ? `Expires ${new Date(expiresAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : 'No active subscription'}
          </div>
        </div>
      </div>

      {/* AI Usage Card */}
      {subscription && plan && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#201A17' }}>AI Usage This Month</div>
              <div style={{ fontSize: '0.8rem', color: '#756A62', marginTop: '0.15rem' }}>
                {(subscription as Record<string, number>).ai_requests_used} / {planLimit.toLocaleString()} AI requests used
              </div>
            </div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: usagePercent >= 90 ? '#9E3D23' : '#201A17',
            }}>
              {usagePercent}%
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${usagePercent}%`,
                background: usagePercent >= 95 ? '#9E3D23' : usagePercent >= 80 ? '#F4A261' : '#C4512A',
              }}
            />
          </div>
          {usagePercent >= 80 && (
            <div style={{ fontSize: '0.78rem', color: usagePercent >= 95 ? '#9E3D23' : '#8C5611', marginTop: '0.6rem' }}>
              {usagePercent >= 95 ? '⚠️ Quota nearly exhausted — upgrade your plan to avoid interruption.' : '⚡ Usage is at 80% — consider upgrading.'}
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
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#201A17', fontFamily: 'var(--font-sans)' }}>Upcoming Appointments</h2>
            <Link href="/dashboard/appointments" style={{ fontSize: '0.8rem', color: '#C4512A', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#756A62', fontSize: '0.875rem' }}>
              No upcoming appointments scheduled
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {appointments.map((appt: Record<string, unknown>) => (
                <div key={appt.id as string} style={{
                  padding: '0.85rem 1rem',
                  background: '#FAF5EE',
                  border: '1px solid #E9DED3',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#201A17' }}>{appt.patient_name as string}</div>
                    <div style={{ fontSize: '0.75rem', color: '#756A62', marginTop: '0.15rem' }}>
                      {(appt.services as Record<string, unknown> | null)?.name as string ?? 'Appointment'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#201A17', fontWeight: 600 }}>
                      {new Date(appt.starts_at as string).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#756A62', marginTop: '0.15rem' }}>
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
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#201A17', fontFamily: 'var(--font-sans)' }}>Recent Conversations</h2>
            <Link href="/dashboard/conversations" style={{ fontSize: '0.8rem', color: '#C4512A', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#756A62', fontSize: '0.875rem' }}>
              No conversations yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {conversations.map((conv: Record<string, unknown>) => (
                <div key={conv.id as string} style={{
                  padding: '0.85rem 1rem',
                  background: '#FAF5EE',
                  border: '1px solid #E9DED3',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#ECE3D7',
                      border: '1px solid #DDD0C2',
                      color: '#201A17',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {(conv.patient_name as string)?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#201A17' }}>
                        {(conv.patient_name as string | null) ?? conv.patient_phone as string}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#756A62', marginTop: '0.15rem' }}>
                        {conv.owner === 'human' ? '👤 Human' : '🤖 AI Receptionist'}
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
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#201A17', marginBottom: '1rem', fontFamily: 'var(--font-sans)' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link href="/onboarding" className="btn btn-secondary btn-sm">⚙️ Configuration</Link>
          <Link href="/dashboard/conversations" className="btn btn-secondary btn-sm">💬 Conversations</Link>
          <Link href="/dashboard/appointments" className="btn btn-secondary btn-sm">📅 Appointments</Link>
          <Link href="/dashboard/billing" className="btn btn-secondary btn-sm">💳 Billing</Link>
          <Link href="/dashboard/agent-test" className="btn btn-secondary btn-sm">🧪 Test Agent</Link>
        </div>
      </div>
    </div>
  );
}
