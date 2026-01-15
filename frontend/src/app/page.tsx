"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    Sparkles,
    Shield,
    Linkedin,
    Twitter,
    ChevronRight
} from "lucide-react"
import { LabelPreviewWidget } from "@/components/landing/label-preview-widget"
import { BentoFeatures } from "@/components/landing/bento-features"
import { MeshBackground } from "@/components/landing/mesh-background"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20"
                        >
                            <Shield className="h-5 w-5 text-white" />
                        </motion.div>
                        <span className="text-xl font-black tracking-tight text-slate-900">HazLabel</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-10">
                        <NavLink href="#features">Capabilities</NavLink>
                        <NavLink href="#how-it-works">Technology</NavLink>
                        <NavLink href="/inventory">Dashboard</NavLink>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild className="hidden sm:flex text-slate-600 hover:text-sky-600 font-semibold px-6">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-slate-900 hover:bg-sky-600 text-white font-bold h-11 px-6 rounded-full shadow-lg transition-all duration-300">
                            <Link href="/login" className="flex items-center gap-2">
                                Get Started
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-44 pb-32 overflow-hidden">
                    <MeshBackground />

                    <div className="relative max-w-7xl mx-auto px-6">
                        <div className="flex flex-col items-center text-center space-y-10">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/80 border border-sky-100 shadow-sm backdrop-blur-sm"
                            >
                                <Sparkles className="h-4 w-4 text-sky-500 fill-sky-500/20" />
                                <span className="text-sm font-bold text-sky-900">UN GHS Revision 11 (2025) Compliant</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-slate-900"
                            >
                                Industrial Safety
                                <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-cyan-500">Accelerated by AI</span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl md:text-2xl text-slate-500 max-w-3xl leading-relaxed font-normal"
                            >
                                The intelligence engine for chemical compliance. Transform raw SDS data into
                                regulatory-perfect GHS labels in under 3 seconds.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 w-full"
                            >
                                <Button
                                    size="lg"
                                    asChild
                                    className="h-16 px-10 text-xl bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-2xl shadow-sky-500/20 transition-all hover:-translate-y-1"
                                >
                                    <Link href="/login" className="flex items-center gap-3">
                                        Deploy GHS Engine
                                        <ArrowRight className="h-6 w-6" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-16 px-10 text-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl"
                                >
                                    <Link href="#" className="flex items-center gap-3">
                                        Watch Demo
                                    </Link>
                                </Button>
                            </motion.div>

                            {/* Terminal Mockup - Restored */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-20 w-full max-w-4xl mx-auto"
                            >
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden text-left font-sans">
                                    {/* Window header */}
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                        <div className="flex gap-1.5">
                                            <div className="h-3 w-3 rounded-full bg-red-400" />
                                            <div className="h-3 w-3 rounded-full bg-amber-400" />
                                            <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 ml-2 font-mono uppercase tracking-widest font-bold">compliance-console-v2</span>
                                    </div>

                                    {/* Terminal content */}
                                    <div className="p-8 bg-slate-900 font-mono text-sm leading-relaxed">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-emerald-400 shrink-0">$</span>
                                                <span className="text-white">hazlabel parse document_export_44.pdf</span>
                                            </div>
                                            <div className="pl-6 space-y-2 text-slate-400">
                                                <p className="flex items-center gap-2">
                                                    <span className="text-sky-400 font-bold">[SCAN]</span>
                                                    <span>Extracting text from PDF (7 pages)...</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-sky-400 font-bold">[AI]</span>
                                                    <span>Analyzing GHS Rev 11 criteria...</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-cyan-400 font-bold">[VALID]</span>
                                                    <span className="text-slate-300">Signal word elevated to <span className="text-red-400">DANGER</span> based on H314</span>
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-emerald-400 font-bold">READY</span>
                                                    <span className="text-slate-500">—</span>
                                                    <span className="text-slate-300">Label generated in 1.4s</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Demo Widget */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="w-full pt-20"
                            >
                                <LabelPreviewWidget />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Feature Bento Section */}
                <BentoFeatures />

                {/* Step-by-Step Tech Section */}
                <section id="how-it-works" className="py-32 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500 rounded-full blur-[160px]" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[160px]" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight">
                                    Three Layers of
                                    <br />
                                    <span className="text-sky-400">Compliance Assurance</span>
                                </h2>

                                <div className="space-y-12">
                                    <TechStep
                                        number="01"
                                        title="Neural SDS Ingestion"
                                        description="Our proprietary pipeline parses multi-lingual SDS documents, normalizing varying standards into a consistent, machine-readable format."
                                    />
                                    <TechStep
                                        number="02"
                                        title="GHS Rev 11 Logic Gate"
                                        description="Every extraction is cross-referenced against the current UN GHS v11 master database, ensuring outdated or deleted codes never reach your labels."
                                    />
                                    <TechStep
                                        number="03"
                                        title="The Final Output"
                                        description="High-precision PDF and ZPL generation for thermal printers, pre-configured for industrial label dimensions and durability."
                                    />
                                </div>
                            </div>

                            <div className="hidden lg:block">
                                <div className="bg-sky-500/10 border border-sky-400/20 rounded-3xl p-1 w-full aspect-square relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent" />
                                    <div className="h-full w-full rounded-[20px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-[150%] h-[150%] opacity-20"
                                            style={{ border: '1px dashed rgba(56, 189, 248, 0.4)', borderRadius: '100%' }}
                                        />
                                        <Shield className="h-32 w-32 text-sky-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-44">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-sky-600 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-3xl shadow-sky-500/30"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 h-64 w-64 bg-sky-400/20 blur-3xl translate-y-1/2 -translate-x-1/2" />

                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none">
                                Ready to modernize
                                <br />
                                your safety workflow?
                            </h2>
                            <p className="text-xl md:text-2xl text-sky-50 max-w-2xl mx-auto mb-12 font-medium opacity-90">
                                Join enterprise EHS teams who have eliminated compliance errors and reduced processing time by 95%.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Button
                                    size="lg"
                                    asChild
                                    className="h-16 px-12 text-xl bg-white text-sky-600 hover:bg-sky-50 font-black rounded-2xl shadow-2xl"
                                >
                                    <Link href="/login">Create Free Account</Link>
                                </Button>
                                <span className="text-sky-100 font-bold">No credit card required • 50 free uploads</span>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 text-white py-24 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-20">
                        <div className="md:col-span-2 space-y-8">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-black tracking-tight">HazLabel</span>
                            </div>
                            <p className="text-slate-500 text-lg max-w-sm font-medium">
                                The intelligence engine for modern industrial safety compliance.
                                Built for the 2025 regulatory landscape.
                            </p>
                            <div className="flex gap-4">
                                <SocialLink icon={<Twitter className="h-5 w-5" />} />
                                <SocialLink icon={<Linkedin className="h-5 w-5" />} />
                            </div>
                        </div>

                        <FooterColumn
                            title="Product"
                            links={["GHS Rev 11", "AI Extraction", "Chemical Vault", "ZPL Generation"]}
                        />
                        <FooterColumn
                            title="Company"
                            links={["Documentation", "Release Notes", "Privacy Policy", "Contact Sales"]}
                        />
                    </div>

                    <div className="border-t border-slate-900 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 font-medium">
                        <p>© 2026 HazLabel AI. All systems operational.</p>
                        <div className="flex gap-10">
                            <Link href="#" className="hover:text-white transition-colors">Safety Standard</Link>
                            <Link href="#" className="hover:text-white transition-colors">API Status</Link>
                            <Link href="#" className="hover:text-white transition-colors">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors uppercase tracking-widest px-2"
        >
            {children}
        </Link>
    )
}

function TechStep({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-8 group"
        >
            <div className="text-4xl font-black text-slate-800 group-hover:text-sky-500 transition-colors duration-500">
                {number}
            </div>
            <div>
                <h3 className="text-2xl font-black mb-3 text-white">{title}</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.div>
    )
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
    return (
        <Link href="#" className="h-11 w-11 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-sky-500 hover:bg-sky-500/10 transition-all">
            {icon}
        </Link>
    )
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
    return (
        <div className="space-y-6">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">{title}</h4>
            <ul className="space-y-4">
                {links.map(link => (
                    <li key={link}>
                        <Link href="#" className="text-slate-500 hover:text-sky-500 transition-colors font-medium">
                            {link}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
