import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111110",
};

const rawUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://frontdesk.arenova.in");

const siteUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Arenova | AI WhatsApp Receptionist Software for Clinics",
    template: "%s | Arenova",
  },
  description:
    "Automate clinic enquiries, share practice information, and manage appointment requests with Arenova's AI-powered WhatsApp receptionist software for clinics.",
  applicationName: "Arenova",
  keywords: [
    "AI WhatsApp receptionist for clinics",
    "clinic communication automation",
    "patient enquiry management",
    "appointment request assistance",
    "clinic subscription plans",
    "AI receptionist software",
    "administrative workflow automation",
    "dental clinic receptionist software",
    "Arenova",
  ],
  authors: [{ name: "Arenova", url: siteUrl }],
  creator: "Arenova",
  publisher: "Arenova",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
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
    title: "Arenova | AI WhatsApp Receptionist Software for Clinics",
    description:
      "Automate clinic enquiries, share practice information, and manage appointment requests with Arenova's AI-powered WhatsApp receptionist software.",
    url: siteUrl,
    siteName: "Arenova",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/metadata.png",
        width: 2912,
        height: 1440,
        type: "image/png",
        alt: "Arenova — AI WhatsApp Receptionist Software for Clinics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arenova | AI WhatsApp Receptionist Software for Clinics",
    description:
      "Automate clinic enquiries, share practice information, and manage appointment requests with Arenova's AI-powered WhatsApp receptionist software.",
    creator: "@arenova_ai",
    images: [
      {
        url: "/metadata.png",
        width: 2912,
        height: 1440,
        alt: "Arenova AI Front Desk — Transform the way your business works",
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
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
