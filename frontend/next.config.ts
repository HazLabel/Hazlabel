import type { NextConfig } from "next";

const securityHeaders = [
    // Prevents MIME type sniffing attacks
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    // Prevents clickjacking by controlling iframe embedding
    {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
    },
    // Controls referrer info sent when navigating to external sites
    {
        key: "Referrer-Policy",
        value: "no-referrer-when-downgrade",
    },
    // CSP: permissive enough to allow Lemon Squeezy payments + all third-party services
    // Using https: scheme to allow all HTTPS sources (prevents XSS while keeping payments working)
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https:",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https:",
            "worker-src 'self' blob:",
            "media-src 'self' https:",
        ].join("; "),
    },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
