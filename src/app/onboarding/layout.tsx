// src/app/onboarding/layout.tsx
// Server-side layout providing noindex metadata for clinic onboarding wizard

import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createPrivatePageMetadata('Clinic Onboarding Wizard');

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

