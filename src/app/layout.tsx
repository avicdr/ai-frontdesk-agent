import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080c18",
};

export const metadata: Metadata = {
  title: {
    default: "AI Front Desk — AI Receptionist for Clinics",
    template: "%s | AI Front Desk",
  },
  description:
    "Give your dental clinic or appointment-based business an AI receptionist that answers patient queries, checks availability, and books appointments — 24/7 on WhatsApp.",
  keywords: [
    "AI receptionist",
    "dental clinic AI",
    "WhatsApp chatbot",
    "appointment booking",
    "clinic automation",
  ],
  authors: [{ name: "AI Front Desk" }],
  openGraph: {
    title: "AI Front Desk — AI Receptionist for Clinics",
    description: "AI-powered receptionist for dental clinics and appointment businesses.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
