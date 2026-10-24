import type { Metadata, Viewport } from "next";
import { Syne, Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
});

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
      className={`${syne.variable} ${plusJakartaSans.variable} ${cinzel.variable} dark`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
