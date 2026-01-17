import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hazlabel.co"),
  title: "HazLabel | AI-Driven Industrial Chemical Safety & GHS Compliance",
  description: "Automate GHS compliance with agentic AI. Parse SDS, generate ZPL labels, and manage industrial chemical safety in one futuristic platform.",
  keywords: ["GHS Compliance", "SDS Parsing", "AI Chemical Safety", "ZPL Label Generator", "Industrial Safety Dashboard"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HazLabel | AI-Driven Industrial Chemical Safety",
    description: "Automate GHS compliance with agentic AI. Parse SDS and generate ZPL labels.",
    url: "https://www.hazlabel.co",
    siteName: "HazLabel",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "HazLabel Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HazLabel | AI-Driven Industrial Chemical Safety",
    description: "Automate GHS compliance with agentic AI. Parse SDS and generate ZPL labels.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/icon-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icon-logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-white text-slate-900 selection:bg-cyan-500/20">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <SpeedInsights />
          <Analytics />
        </Providers>

        {/* SEO Fixer */}
        <Script
          src="https://seo-fixer.writesonic.com/site-audit/fixer-script/index.js"
          id="wsAiSeoMb"
          strategy="afterInteractive"
        />
        <Script id="wsAiSeoInitScript" strategy="afterInteractive">
          {`
            window.addEventListener('load', function() {
              if (window.wsSEOfixer) {
                window.wsSEOfixer.configure({
                  hostURL: 'https://seo-fixer.writesonic.com',
                  siteID: '6969e4ae5086433123ff411a'
                });
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
