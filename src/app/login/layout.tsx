// src/app/login/layout.tsx
// Server-side layout providing noindex metadata for the login route

import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createPrivatePageMetadata('Clinic Sign In');

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

