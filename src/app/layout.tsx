import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ledgerly.ai"),
  title: {
    default: "Ledgerly | AI Accounting Copilot",
    template: "%s | Ledgerly",
  },
  description:
    "Ledgerly turns small business accounting into an AI-assisted workflow. Generate clean financial reports, categorize expenses, and predict cash flow in seconds.",
  openGraph: {
    title: "Ledgerly | AI Accounting Copilot",
    description:
      "AI-native accounting for small and mid-sized businesses. Upload financial data, receive investor-ready reports, and stay ahead with automated cash flow projections.",
    url: "https://ledgerly.ai",
    siteName: "Ledgerly",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ledgerly dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ledgerly",
    title: "Ledgerly | AI Accounting Copilot",
    description:
      "Automate bookkeeping and produce AI-generated insights ready for investors and tax prep.",
    images: [
      {
        url: "/og-image.png",
        alt: "Ledgerly dashboard preview",
      },
    ],
  },
  keywords: [
    "AI accounting",
    "small business finance",
    "cash flow forecasting",
    "AWS Bedrock",
    "automated bookkeeping",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(42,91,255,0.08),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(10,132,255,0.06),_transparent_55%)]" />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
