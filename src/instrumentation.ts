// src/instrumentation.ts
// Next.js Instrumentation hook executed once on server startup

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { autoResumeAllActiveBaileysSessions } = await import('@/lib/whatsapp/baileys-service');
    autoResumeAllActiveBaileysSessions().catch((err) => {
      console.error('[Baileys] Error during auto-resume on server startup:', err);
    });
  }
}
