"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    Sparkles,
    Shield,
    Zap,
    FileSearch,
    Database,
    CheckCircle2,
    Play,
    Linkedin,
    Twitter,
    History
} from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">HazLabel</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <NavLink href="#features">Features</NavLink>
                        <NavLink href="#how-it-works">How it Works</NavLink>
                        <NavLink href="#pricing">Pricing</NavLink>
                        <NavLink href="/inventory">Dashboard</NavLink>
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

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 hero-pattern">
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 grid-pattern opacity-50" />

                    <div className="relative max-w-7xl mx-auto px-6">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            {/* Badge */}
                            <div className="animate-reveal">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sm font-medium text-sky-700">
                                    <Sparkles className="h-4 w-4" />
                                    Powered by GPT-4o + GHS Rev 11
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] animate-reveal delay-100">
                                Chemical Safety
                                <br />
                                <span className="gradient-text">Automated</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-reveal delay-200">
                                Transform Safety Data Sheets into compliant GHS labels in seconds.
                                AI-powered extraction with regulatory precision.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-reveal delay-300">
                                <Button
                                    size="lg"
                                    asChild
                                    className="h-14 px-8 text-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 transition-all hover:-translate-y-0.5"
                                >
                                    <Link href="/login">
                                        Start Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 text-lg border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    Watch Demo
                                </Button>
                            </div>

                            {/* Social Proof */}
                            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-slate-500 animate-reveal delay-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>14M+ Labels Generated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>99.9% Accuracy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>GHS Rev 11 Compliant</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="mt-20 animate-reveal delay-500">
                            <div className="relative max-w-5xl mx-auto">
                                {/* Main card */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                                    {/* Window header */}
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                        <div className="flex gap-1.5">
                                            <div className="h-3 w-3 rounded-full bg-red-400" />
                                            <div className="h-3 w-3 rounded-full bg-amber-400" />
                                            <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <span className="text-xs text-slate-500 ml-2 font-mono">hazlabel-console</span>
                                    </div>

                                    {/* Terminal content */}
                                    <div className="p-6 bg-slate-900 font-mono text-sm">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <span className="text-emerald-400">$</span>
                                                <span className="text-white">hazlabel parse acetone_sds.pdf</span>
                                            </div>
                                            <div className="pl-4 space-y-1 text-slate-400">
                                                <p><span className="text-sky-400">[SCAN]</span> Extracting text from PDF...</p>
                                                <p><span className="text-sky-400">[AI]</span> Identifying GHS classification...</p>
                                                <p><span className="text-cyan-400">[VALID]</span> H225, H319, H336 verified against Rev 11</p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-700">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-emerald-400">✓</span>
                                                    <span className="text-white">Label generated in <span className="text-sky-400">2.4s</span></span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-800 rounded-lg p-4 mt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <p className="text-white font-semibold">Acetone (Technical Grade)</p>
                                                        <p className="text-red-400 font-bold text-xs uppercase tracking-wider">⚠ DANGER</p>
                                                        <div className="flex gap-2">
                                                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">GHS02</span>
                                                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">GHS07</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs text-slate-400">
                                                        <p>H225 • H319 • H336</p>
                                                        <p className="text-emerald-400 mt-1">Ready to Print</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">
                                Everything you need for
                                <br />
                                <span className="gradient-text">GHS Compliance</span>
                            </h2>
                            <p className="text-xl text-slate-600">
                                From PDF upload to thermal printer output, we handle the entire compliance workflow.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<FileSearch className="h-6 w-6" />}
                                title="AI-Powered Extraction"
                                description="GPT-4o analyzes SDS documents with 99.9% accuracy, extracting hazard codes, precautionary statements, and pictograms."
                                color="sky"
                            />
                            <FeatureCard
                                icon={<Shield className="h-6 w-6" />}
                                title="GHS Rev 11 Validation"
                                description="Every code is validated against the UN GHS Revision 11 master database. Deleted codes and mismatches are flagged instantly."
                                color="cyan"
                            />
                            <FeatureCard
                                icon={<Zap className="h-6 w-6" />}
                                title="Signal Word Logic"
                                description="Automatic enforcement of Danger vs Warning signal words based on hazard severity. Prevents fatal classification errors."
                                color="amber"
                            />
                            <FeatureCard
                                icon={<Database className="h-6 w-6" />}
                                title="Chemical Vault"
                                description="Secure cloud storage for all your chemical records with full audit history, search, and compliance tracking."
                                color="emerald"
                            />
                            <FeatureCard
                                icon={<History className="h-6 w-6" />}
                                title="Smart Revision Tracking"
                                description="Automatically detects changes between SDS versions, highlighting updated hazard codes so you never miss a supplier revision."
                                color="violet"
                            />
                            <FeatureCard
                                icon={<CheckCircle2 className="h-6 w-6" />}
                                title="P-Code Cross-Validation"
                                description="Ensures required precautionary codes are present for each hazard. Catches water-reactive chemicals missing P223."
                                color="sky"
                            />
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how-it-works" className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">
                                Three steps to
                                <br />
                                <span className="gradient-text">Compliant Labels</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <StepCard
                                number="01"
                                title="Upload SDS"
                                description="Drop your Safety Data Sheet PDF. Supports multi-page documents from any manufacturer."
                            />
                            <StepCard
                                number="02"
                                title="AI Extraction"
                                description="Our engine extracts and validates all GHS data against Revision 11 standards in seconds."
                            />
                            <StepCard
                                number="03"
                                title="Print Labels"
                                description="Generate compliant labels for any format. Print directly or download for your thermal printers."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 bg-gradient-to-br from-sky-600 to-cyan-600">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                                Ready to automate your
                                <br />
                                safety compliance?
                            </h2>
                            <p className="text-xl text-sky-100 max-w-2xl mx-auto mb-10">
                                Join hundreds of EHS teams who have eliminated manual data entry errors
                                and reduced label generation time by 95%.
                            </p>
                            <Button
                                size="lg"
                                asChild
                                className="h-14 px-10 text-lg bg-white text-sky-700 hover:bg-sky-50 font-semibold rounded-xl shadow-lg"
                            >
                                <Link href="/login">
                                    Start Your Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <p className="text-sm text-sky-200 mt-4">
                                No credit card required • 50 free SDS uploads
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12">
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-lg font-bold">HazLabel</span>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xs">
                                The modern compliance platform for industrial chemical safety.
                                Built on precision AI and GHS expertise.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    <Twitter className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        <FooterLinks
                            title="Product"
                            links={["Features", "Pricing", "API Docs", "Changelog"]}
                        />
                        <FooterLinks
                            title="Company"
                            links={["About", "Blog", "Careers", "Contact"]}
                        />
                    </div>

                    <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                        <p>© 2026 HazLabel. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Security</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
            {children}
        </a>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    color
}: {
    icon: React.ReactNode
    title: string
    description: string
    color: "sky" | "cyan" | "amber" | "emerald" | "violet"
}) {
    const colorClasses = {
        sky: "bg-sky-100 text-sky-600",
        cyan: "bg-cyan-100 text-cyan-600",
        amber: "bg-amber-100 text-amber-600",
        emerald: "bg-emerald-100 text-emerald-600",
        violet: "bg-violet-100 text-violet-600"
    }

    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-3 rounded-xl ${colorClasses[color]} mb-5`}>
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    )
}

function StepCard({
    number,
    title,
    description
}: {
    number: string
    title: string
    description: string
}) {
    return (
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
            <div className="text-5xl font-bold gradient-text mb-4">{number}</div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    )
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h4 className="font-semibold text-white mb-4">{title}</h4>
            <ul className="space-y-3">
                {links.map(link => (
                    <li key={link}>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
