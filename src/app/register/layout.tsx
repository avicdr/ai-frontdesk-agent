// src/app/register/layout.tsx
// Server-side layout providing noindex metadata for the register route

import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createPrivatePageMetadata('Register Clinic');

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

