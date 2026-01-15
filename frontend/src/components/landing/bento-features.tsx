"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    FileSearch,
    Shield,
    Zap,
    Database,
    Printer,
    CheckCircle2,
    Lock,
    ArrowUpRight
} from "lucide-react"

const features = [
    {
        title: "AI SDS Extraction",
        description: "Our GPT-4o powered engine parses even the most complex multi-page PDFs with 99.9% accuracy.",
        icon: <FileSearch className="h-6 w-6" />,
        className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-sky-500 to-sky-700 text-white",
        iconBg: "bg-white/20 text-white"
    },
    {
        title: "GHS Rev 11 Ready",
        description: "Validated against the 2025 UN GHS standards.",
        icon: <Shield className="h-6 w-6" />,
        className: "bg-white border-slate-200",
        iconBg: "bg-sky-100 text-sky-600"
    },
    {
        title: "Instant Signals",
        description: "Auto-detects Danger vs Warning words.",
        icon: <Zap className="h-6 w-6" />,
        className: "bg-white border-slate-200",
        iconBg: "bg-amber-100 text-amber-600"
    },
    {
        title: "The Chemical Vault",
        description: "Enterprise-grade inventory management with full audit trails and compliance versioning.",
        icon: <Database className="h-6 w-6" />,
        className: "md:col-span-2 bg-slate-900 text-white",
        iconBg: "bg-sky-500 text-white"
    },
    {
        title: "Thermal & Laser",
        description: "ZPL and PDF support for all printers.",
        icon: <Printer className="h-6 w-6" />,
        className: "bg-white border-slate-200",
        iconBg: "bg-emerald-100 text-emerald-600"
    },
    {
        title: "Bank-Level Security",
        description: "Encrypted data storage and HIPAA/ISO ready controls.",
        icon: <Lock className="h-6 w-6" />,
        className: "bg-white border-slate-200",
        iconBg: "bg-slate-100 text-slate-600"
    }
]

export function BentoFeatures() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                            Precision Safety.
                            <br />
                            <span className="text-sky-600">Zero Compromise.</span>
                        </h2>
                        <p className="text-lg text-slate-600">
                            We've replaced manual compliance with a unified intelligence engine that handles the entire GHS lifecycle.
                        </p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <a href="/login" className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                            Explore the full platform
                            <ArrowUpRight className="h-5 w-5" />
                        </a>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 h-full md:h-[650px]">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative overflow-hidden p-8 rounded-3xl border transition-all hover:shadow-2xl hover:shadow-sky-500/10 group ${feature.className}`}
                        >
                            <div className={`inline-flex p-3 rounded-2xl mb-6 ${feature.iconBg}`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className={`text-sm leading-relaxed ${feature.className.includes('bg-white') ? 'text-slate-500' : 'text-sky-100/80'}`}>
                                {feature.description}
                            </p>

                            {/* Decorative element for large cards */}
                            {feature.className.includes('md:col-span-2') && (
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {feature.icon && React.cloneElement(feature.icon as React.ReactElement<any>, { size: 120 })}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
