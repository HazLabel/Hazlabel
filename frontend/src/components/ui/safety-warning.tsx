"use client"

import React from "react"
import { ShieldAlert, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SafetyWarningProps {
    className?: string
    variant?: "default" | "compact"
}

export function SafetyWarning({ className, variant = "default" }: SafetyWarningProps) {
    if (variant === "compact") {
        return (
            <div className={cn(
                "flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 shadow-sm animate-reveal",
                className
            )}>
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs font-medium leading-tight">
                    <span className="font-bold">AI Proofing Required:</span> Automated systems can make mistakes. Always verify labels against original SDS before use.
                </p>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm animate-reveal",
            className
        )}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5">
                <ShieldAlert className="h-32 w-32 text-amber-600" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                <div className="flex-shrink-0">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                </div>

                <div className="flex-1">
                    <h4 className="text-amber-900 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                        Safety Verification Required
                    </h4>
                    <p className="text-amber-800 text-sm leading-relaxed max-w-2xl">
                        HazLabel utilizes AI to extract GHS data. Automated systems can occasionally misinterpret complex SDS formatting. <span className="font-bold">You are responsible for double-checking all pictograms, signal words, and hazard statements against the original source document before printing or label application.</span>
                    </p>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                    <Link
                        href="/disclaimer"
                        className="text-amber-700 hover:text-amber-900 text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 transition-colors underline underline-offset-4"
                    >
                        Legal Terms
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
