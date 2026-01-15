import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "HazLabel | AI-Driven Industrial Compliance",
  description: "Automate GHS compliance with agentic AI. Parse SDS, generate ZPL labels, and manage industrial chemical safety in one futuristic platform.",
  keywords: ["GHS Compliance", "SDS Parsing", "AI Chemical Safety", "ZPL Label Generator", "Industrial Safety Dashboard"],
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
        </Providers>
      </body>
    </html>
  );
}
