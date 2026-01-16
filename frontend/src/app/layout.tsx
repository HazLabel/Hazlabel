import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "HazLabel | AI-Driven Industrial Compliance",
  description: "Automate GHS compliance with agentic AI. Parse SDS, generate ZPL labels, and manage industrial chemical safety in one futuristic platform.",
  keywords: ["GHS Compliance", "SDS Parsing", "AI Chemical Safety", "ZPL Label Generator", "Industrial Safety Dashboard"],
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
