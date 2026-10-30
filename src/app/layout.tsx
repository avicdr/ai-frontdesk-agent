import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SEO_CONFIG } from "@/lib/seo/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111110",
};

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.domain),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: SEO_CONFIG.titleTemplate,
  },
  description: SEO_CONFIG.defaultDescription,
  applicationName: SEO_CONFIG.siteName,
  keywords: SEO_CONFIG.keywords,
  authors: [{ name: SEO_CONFIG.brand, url: SEO_CONFIG.domain }],
  creator: SEO_CONFIG.brand,
  publisher: SEO_CONFIG.legalName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SEO_CONFIG.domain,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/arenova.ico" },
      { url: "/ARENOVA.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/arenova.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.domain,
    siteName: SEO_CONFIG.siteName,
    locale: SEO_CONFIG.locale,
    type: "website",
    images: [
      {
        url: SEO_CONFIG.ogImage.url,
        width: SEO_CONFIG.ogImage.width,
        height: SEO_CONFIG.ogImage.height,
        type: SEO_CONFIG.ogImage.type,
        alt: SEO_CONFIG.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    creator: SEO_CONFIG.twitterHandle,
    images: [
      {
        url: SEO_CONFIG.ogImage.url,
        width: SEO_CONFIG.ogImage.width,
        height: SEO_CONFIG.ogImage.height,
        alt: SEO_CONFIG.ogImage.alt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className="dark"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('aifd_theme');var t=(s==='light')?'light':'dark';document.documentElement.setAttribute('data-theme',t);if(t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <Suspense fallback={null}>
              <AnalyticsTracker />
              <GoogleAnalytics />
            </Suspense>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
