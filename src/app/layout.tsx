import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111110",
};

export const metadata: Metadata = {
  title: {
    default: "AI Front Desk — Premium AI Receptionist for Clinics",
    template: "%s | AI Front Desk",
  },
  description:
    "Intelligent 24/7 AI receptionist for clinics and appointment practices. Seamless WhatsApp patient dialogue, real-time schedule orchestration, and automated care workflows.",
  keywords: [
    "AI receptionist",
    "clinic AI front desk",
    "WhatsApp assistant",
    "appointment booking automation",
    "patient concierge",
    "Arenova",
  ],
  authors: [{ name: "AI Front Desk" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/ARENOVA.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/arenova.png",
  },
  openGraph: {
    title: "AI Front Desk — Intelligent Clinic Receptionist",
    description: "Sophisticated AI front-desk platform for modern clinics and appointment practices.",
    type: "website",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
