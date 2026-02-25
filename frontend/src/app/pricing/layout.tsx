import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | HazLabel — GHS Compliance Plans for Every Facility",
  description:
    "Simple, transparent pricing for AI-powered GHS compliance. Free starter plan, Professional at $99/mo, and Enterprise at $299/mo. No hidden fees.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | HazLabel — GHS Compliance Plans",
    description:
      "Choose the plan that fits your facility. From free starter to enterprise-grade GHS compliance automation.",
    url: "https://www.hazlabel.co/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
