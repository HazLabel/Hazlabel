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
            "flex gap-3 px-4 animate-reveal",
            className
        )}>
            <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-slate-400" />
            </div>

            <div className="flex-1 text-sm text-slate-500">
                <p className="leading-relaxed">
                    <span className="font-semibold text-slate-700">Verification Required:</span> AI-extracted data may contain errors.
                    Always verify against the original SDS before use.
                    <Link
                        href="/disclaimer"
                        className="inline-flex items-center gap-1 ml-2 text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                    >
                        Legal Terms
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </p>
            </div>
        </div>
    )
}
