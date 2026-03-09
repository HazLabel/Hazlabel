import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hazlabel.co"),
  title: "HazLabel | AI-Driven Industrial Chemical Safety & GHS Compliance",
  description: "Automate GHS compliance with agentic AI. Parse SDS, generate ZPL labels, and manage industrial chemical safety in one futuristic platform.",
  keywords: ["GHS Compliance", "SDS Parsing", "AI Chemical Safety", "ZPL Label Generator", "Industrial Safety Dashboard", "GHS Compliant Labels", "Hazard Communication", "Chemical Inventory Management", "AI SDS Parsing", "Safety Data Sheet Management", "OSHA HazCom Compliance", "GHS Label Requirements", "Chemical Safety Software"],
  alternates: {
    canonical: "https://www.hazlabel.co",
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18000987405"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18000987405');
          `}
        </Script>
      </head>
      <body className={`${instrumentSerif.variable} ${plusJakartaSans.variable} antialiased font-sans bg-white text-slate-900 selection:bg-cyan-500/20`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <SpeedInsights />
          <Analytics />
        </Providers>

        {/* JSON-LD Structured Data */}
        <Script id="json-ld-organization" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "HazLabel",
            "url": "https://www.hazlabel.co",
            "logo": "https://www.hazlabel.co/logo.png",
            "description": "AI-powered GHS compliance platform for industrial chemical safety. Automate SDS parsing, label generation, and regulatory compliance."
          })}
        </Script>
        <Script id="json-ld-software" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "HazLabel",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "url": "https://www.hazlabel.co",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "299",
              "priceCurrency": "USD"
            }
          })}
        </Script>

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
