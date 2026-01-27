"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    CheckCircle2,
    Shield,
    Zap,
    FileSearch,
    Database,
    History,
    Sparkles
} from "lucide-react"
import Image from "next/image"

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

    // Lemon Squeezy Variant IDs
    const checkoutUrls = {
        pro: {
            monthly: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO_MONTHLY || "#",
            annual: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO_ANNUAL || "#"
        },
        enterprise: {
            monthly: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_MONTHLY || "#",
            annual: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_ANNUAL || "#"
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center group">
                        <Image
                            src="/logo.png"
                            alt="HazLabel"
                            width={140}
                            height={35}
                            className="h-9 w-auto hover:scale-105 transition-all"
                        />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">Features</Link>
                        <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">How it Works</Link>
                        <Link href="/pricing" className="text-sm text-sky-600 font-semibold">Pricing</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 shadow-md shadow-sky-500/20">
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                            Scalable Compliance for <span className="gradient-text">Teams of All Sizes</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10">
                            Choose the plan that fits your facility's needs. From local labs to global chemical manufacturers.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-12">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                                className="relative w-14 h-7 bg-slate-200 rounded-full p-1 transition-colors hover:bg-slate-300"
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-7' : ''}`} />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
                                Annual
                                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    Save 20%
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-24">
                        <PricingCard
                            title="Starter"
                            price="0"
                            description="Perfect for small labs and trial runs."
                            features={[
                                "2 SDS Uploads / Month",
                                "2 PDF Downloads / Month",
                                "Standard GHS Pictograms",
                                "Community Support",
                                "Basic Label Templates"
                            ]}
                        />
                        <PricingCard
                            title="Professional"
                            price={billingCycle === 'monthly' ? "99" : "79"}
                            interval={billingCycle === 'monthly' ? "mo" : "mo"}
                            description="Comprehensive compliance for active facilities."
                            features={[
                                billingCycle === 'monthly' ? "200 SDS Parsing / Month" : "2,500 SDS Parsing / Year",
                                "Unlimited Downloads",
                                "GHS Revision 11 Validation",
                                "Revision Tracking",
                                "Priority Email Support",
                                "Team Workspace (up to 5 users)"
                            ]}
                            highlighted={true}
                            billingCycle={billingCycle}
                            checkoutUrl={billingCycle === 'monthly' ? checkoutUrls.pro.monthly : checkoutUrls.pro.annual}
                        />
                        <PricingCard
                            title="Enterprise"
                            price={billingCycle === 'monthly' ? "299" : "239"}
                            interval={billingCycle === 'monthly' ? "mo" : "mo"}
                            description="Custom solutions for global organizations."
                            features={[
                                billingCycle === 'monthly' ? "15,000 SDS Parsing / Month" : "200,000 SDS Parsing / Year",
                                "Multi-site Management",
                                "SSO & Role Control",
                                "Custom Template Design",
                                "Dedicated Compliance Expert",
                                "API Access",
                                "Unlimited Team Members"
                            ]}
                            billingCycle={billingCycle}
                            checkoutUrl={billingCycle === 'monthly' ? checkoutUrls.enterprise.monthly : checkoutUrls.enterprise.annual}
                        />
                    </div>

                    {/* Detailed Comparison Table (Optional but good for Paddle) */}
                    <div className="bg-slate-50 rounded-3xl p-8 md:p-12 mb-24">
                        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Feature Comparison</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="py-4 font-semibold text-slate-900">Feature</th>
                                        <th className="py-4 font-semibold text-slate-900">Starter</th>
                                        <th className="py-4 font-semibold text-slate-900 text-sky-600">Professional</th>
                                        <th className="py-4 font-semibold text-slate-900">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <ComparisonRow label="SDS Parsing" values={["2 / month", "2000 / year", "Unlimited"]} />
                                    <ComparisonRow label="Downloads" values={["2 / month", "Unlimited", "Unlimited"]} />
                                    <ComparisonRow label="GHS Validation" values={["Current Only", "Rev 11 + Historical", "Regional + Custom"]} />
                                    <ComparisonRow label="Revision Tracking" values={[false, true, true]} />
                                    <ComparisonRow label="Team Members" values={["1", "Up to 5", "Unlimited"]} />
                                    <ComparisonRow label="Support" values={["Community", "Priority Email", "Dedicated Success Manager"]} />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Billing & Pricing FAQ</h2>
                        <div className="grid gap-6">
                            <FAQItem
                                question="Can I change plans at any time?"
                                answer="Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the change is immediate. If you downgrade, it will take effect at the end of your current billing cycle."
                            />
                            <FAQItem
                                question="Do you offer a free trial for the Professional plan?"
                                answer="We offer a completely free Starter plan that lets you test the core extraction engine. For Professional trials, please contact our support team."
                            />
                            <FAQItem
                                question="What forms of payment do you accept?"
                                answer="We accept all major credit cards, PayPal, and wire transfers for Enterprise customers. All payments are processed securely via Paddle."
                            />
                            <FAQItem
                                question="Is there a setup fee?"
                                answer="No, there are no setup or hidden fees for the Starter and Professional plans. Enterprise customers may have custom implementation options."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 text-center md:text-left">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-800 pt-12">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="HazLabel"
                                width={120}
                                height={30}
                                className="h-8 w-auto brightness-0 invert"
                            />
                        </div>
                        <div className="flex gap-8 text-sm text-slate-400">
                            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                            <Link href="/disclaimer" className="hover:text-white">Legal Disclaimer</Link>
                        </div>
                        <p className="text-sm text-slate-500">© 2026 HazLabel AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function PricingCard({
    title,
    price,
    description,
    features,
    highlighted = false,
    interval = "mo",
    billingCycle = "monthly"
}: {
    title: string
    price: string
    description: string
    features: string[]
    highlighted?: boolean
    interval?: string
    highlighted?: boolean
    interval?: string
    billingCycle?: 'monthly' | 'annual'
    checkoutUrl?: string
}) {
    return (
        <div className={`p-8 rounded-3xl border ${highlighted ? 'bg-white border-sky-500 shadow-xl shadow-sky-500/10 scale-105 z-10' : 'bg-white border-slate-200'} flex flex-col h-full`}>
            <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    {highlighted && (
                        <span className="bg-sky-100 text-sky-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                    )}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{price === "Custom" ? "" : "$"}</span>
                    <span className="text-5xl font-bold text-slate-900">{price}</span>
                    {price !== "Custom" && price !== "0" && (
                        <div className="flex flex-col ml-2">
                            <span className="text-slate-500 font-medium leading-none">/{interval}</span>
                            {billingCycle === 'annual' && (
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1 whitespace-nowrap">
                                    Billed annually
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {billingCycle === 'annual' && price !== "0" && price !== "Custom" && (
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                        ${parseInt(price) * 12} billed yearly
                    </p>
                )}
                <p className="text-slate-500 mt-4 text-sm leading-relaxed">{description}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={highlighted ? "default" : "outline"}
                asChild
                className={`w-full h-12 rounded-xl font-bold ${highlighted ? 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20' : ''}`}
            >
                {price === "Custom" ? (
                    <Link href="/contact">Contact Sales</Link>
                ) : price === "0" ? (
                    <Link href="/login">Get Started</Link>
                ) : (
                    <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                        Subscribe Now
                    </a>
                )}
            </Button>
        </div>
    )
}

function ComparisonRow({ label, values }: { label: string; values: (string | boolean)[] }) {
    return (
        <tr className="border-b border-slate-100 group hover:bg-slate-50/50 transition-colors">
            <td className="py-4 text-slate-700 font-medium">{label}</td>
            {values.map((v, i) => (
                <td key={i} className={`py-4 ${i === 1 ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}>
                    {typeof v === 'boolean' ? (
                        v ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <span className="text-slate-300">-</span>
                    ) : v}
                </td>
            ))}
        </tr>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{question}</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{answer}</p>
        </div>
    )
}
