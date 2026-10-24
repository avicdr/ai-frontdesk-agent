import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF5EE",
};

export const metadata: Metadata = {
  title: {
    default: "AI Front Desk — AI Receptionist for Clinics",
    template: "%s | AI Front Desk",
  },
  description:
    "Give your clinic or appointment-based practice an intelligent AI receptionist that answers patient queries, checks availability, and books appointments 24/7 on WhatsApp.",
  keywords: [
    "AI receptionist",
    "clinic AI front desk",
    "WhatsApp assistant",
    "appointment booking automation",
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
    description: "Intelligent front-desk assistant for clinics and appointment businesses.",
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
      className={`${dmSerif.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
