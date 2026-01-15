"use client"

import React from "react"
import { ValidationResult, ValidationIssue } from "@/lib/types"
import {
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationPanelProps {
    validation: ValidationResult
    compact?: boolean
}

const SEVERITY_CONFIG = {
    critical: {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Critical",
    },
    error: {
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Error",
    },
    warning: {
        icon: AlertTriangle,
        color: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Warning",
    },
    info: {
        icon: Info,
        color: "text-sky-500",
        bg: "bg-sky-50",
        border: "border-sky-200",
        label: "Info",
    },
}

export function ValidationPanel({ validation, compact = false }: ValidationPanelProps) {
    const [expanded, setExpanded] = React.useState(!compact)

    // Count issues by severity
    const counts = validation.issues.reduce(
        (acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    const hasIssues = validation.issues.length > 0

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        validation.is_valid ? "bg-emerald-50" : "bg-amber-50"
                    )}>
                        {validation.is_valid ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                            <Shield className="h-5 w-5 text-amber-600" />
                        )}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-slate-900">
                            {validation.is_valid ? "Validation Passed" : "Review Required"}
                        </p>
                        <p className="text-sm text-slate-500">
                            {hasIssues ? `${validation.issues.length} issue${validation.issues.length !== 1 ? "s" : ""} found` : "No issues detected"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Severity counts */}
                    <div className="hidden sm:flex items-center gap-2">
                        {(["critical", "error", "warning", "info"] as const).map((severity) => {
                            const count = counts[severity] || 0
                            if (count === 0) return null
                            const config = SEVERITY_CONFIG[severity]
                            const Icon = config.icon
                            return (
                                <span
                                    key={severity}
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                                        config.bg, config.color
                                    )}
                                >
                                    <Icon className="h-3 w-3" />
                                    {count}
                                </span>
                            )
                        })}
                    </div>

                    {expanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && hasIssues && (
                <div className="border-t border-slate-200 p-4 space-y-3">
                    {validation.issues.map((issue, index) => (
                        <IssueCard key={index} issue={issue} />
                    ))}
                </div>
            )}

            {/* Signal Word Status */}
            {expanded && !validation.signal_word_valid && validation.suggested_signal_word && (
                <div className="border-t border-slate-200 p-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">Signal Word Mismatch</p>
                            <p className="text-sm text-amber-700 mt-0.5">
                                Suggested signal word: <strong>{validation.suggested_signal_word}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Missing P-Codes */}
            {expanded && validation.missing_p_codes.length > 0 && (
                <div className="border-t border-slate-200 p-4">
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-800">Missing Required P-Codes</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {validation.missing_p_codes.map((code) => (
                                    <span
                                        key={code}
                                        className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-mono font-bold"
                                    >
                                        {code}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Clear State */}
            {expanded && !hasIssues && (
                <div className="border-t border-slate-200 p-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                            <p className="font-medium text-emerald-800">All Checks Passed</p>
                            <p className="text-sm text-emerald-700">
                                This chemical data is compliant with GHS Revision 11.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function IssueCard({ issue }: { issue: ValidationIssue }) {
    const config = SEVERITY_CONFIG[issue.severity]
    const Icon = config.icon

    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            config.bg, config.border
        )}>
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.color)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        config.bg, config.color
                    )}>
                        {config.label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{issue.code}</span>
                </div>
                <p className="text-sm text-slate-800 font-medium mb-1">
                    {issue.message}
                </p>
                {issue.suggestion && (
                    <p className="text-xs text-slate-600">
                        💡 {issue.suggestion}
                    </p>
                )}
                {(issue.h_code || issue.p_code) && (
                    <div className="flex gap-2 mt-2">
                        {issue.h_code && (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-mono">
                                {issue.h_code}
                            </span>
                        )}
                        {issue.p_code && (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-mono">
                                {issue.p_code}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
