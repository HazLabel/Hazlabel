import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://seo-fixer.writesonic.com https://va.vercel-scripts.com https://cdn.vercel-insights.com https://app.lemonsqueezy.com https://*.lemonsqueezy.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://app.lemonsqueezy.com https://*.lemonsqueezy.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.hazlabel.co https://va.vercel-scripts.com https://app.lemonsqueezy.com https://*.lemonsqueezy.com; connect-src 'self' https://seo-fixer.writesonic.com https://*.supabase.co https://va.vercel-scripts.com https://hazlabel-production.up.railway.app https://api.lemonsqueezy.com https://app.lemonsqueezy.com https://*.lemonsqueezy.com https://api.stripe.com https://*.stripe.com; frame-src https://app.lemonsqueezy.com https://*.lemonsqueezy.com; upgrade-insecure-requests;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
