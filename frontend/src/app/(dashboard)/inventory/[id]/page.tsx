"use client"

import React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Chemical } from "@/lib/types"
import { useUser } from "@/hooks/use-user"
import { PictogramGrid } from "@/components/ghs/pictogram"
import { ValidationPanel } from "@/components/validation/validation-panel"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Printer,
    AlertTriangle,
    Calendar,
    FileText,
    ExternalLink,
    Loader2,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Ambulance,
    Archive,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

// P-code categories per GHS Annex 3
type PCodeCategory = "prevention" | "response" | "storage" | "disposal"

interface GroupedPCode {
    code: string
    statement: string
    category: PCodeCategory
}

function categorizePCode(code: string): PCodeCategory {
    const num = parseInt(code.replace(/\D/g, "").substring(0, 1))
    if (num === 1 || num === 2) return "prevention"
    if (num === 3) return "response"
    if (num === 4) return "storage"
    return "disposal" // P5xx
}

function fixIncompleteStatement(code: string, statement: string): string {
    // Fix truncated P501 - GHS requires complete disposal instructions
    if (code.startsWith("P501") && (statement.includes("...") || statement.includes("…") || statement.endsWith("to"))) {
        return "Dispose of contents/container in accordance with local/regional/national/international regulations."
    }
    return statement
}

function groupPCodes(statements: string[]): Record<PCodeCategory, GroupedPCode[]> {
    const groups: Record<PCodeCategory, GroupedPCode[]> = {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
    }
    
    statements.forEach(statement => {
        const code = statement.split(":")[0]?.trim() || statement.split(" ")[0]
        const text = statement.includes(":") 
            ? statement.split(":").slice(1).join(":").trim() 
            : statement
        const category = categorizePCode(code)
        
        groups[category].push({
            code,
            statement: fixIncompleteStatement(code, text),
            category
        })
    })
    
    return groups
}

const CATEGORY_CONFIG: Record<PCodeCategory, { label: string; icon: React.ElementType; color: string }> = {
    prevention: { label: "Prevention", icon: ShieldAlert, color: "sky" },
    response: { label: "Response", icon: Ambulance, color: "amber" },
    storage: { label: "Storage", icon: Archive, color: "violet" },
    disposal: { label: "Disposal", icon: Trash2, color: "slate" }
}

export default function ChemicalDetailPage() {
    const params = useParams()
    const { user, loading: userLoading } = useUser()

    const { data: chemical, isLoading, error } = useQuery({
        queryKey: ["chemical", params.id],
        queryFn: async () => {
            const res = await api.get<Chemical>(`/chemicals/${params.id}`)
            return res.data
        },
        enabled: !!params.id && !!user,
    })

    // Show loading while user is being fetched or query is loading
    if (userLoading || isLoading) {
        return <LoadingSkeleton />
    }

    // Only show error after user is loaded and query has completed
    if (error || !chemical) {
        return <ErrorState />
    }

    const ghs = chemical.ghs_data
    const signalWord = ghs?.signal_word
    const isDanger = signalWord === "Danger"

    return (
        <div className="space-y-8">
            {/* Back Button & Header */}
            <div className="space-y-4 animate-reveal">
                <Link 
                    href="/inventory"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Vault
                    </Link>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
                            {chemical.name}
                        </h1>
                        {ghs?.product_identifier && ghs.product_identifier !== chemical.name && (
                            <p className="text-slate-500 text-lg">
                                {ghs.product_identifier}
                            </p>
                        )}

                        {/* Status badges */}
                        <div className="flex items-center gap-3 mt-4">
                            {chemical.status === "processing" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-sm font-medium">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing
                                </span>
                            ) : chemical.needs_review ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium">
                                    <Clock className="h-4 w-4" />
                                    Needs Review
                                </span>
                            ) : (
                                <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium cursor-help"
                                    title="Hazards reproduced from manufacturer SDS Section 2. Not a certification."
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    SDS Parsed
                                </span>
                            )}

                            {signalWord && (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider",
                                    isDanger ? "signal-danger" : "signal-warning"
                                )}>
                                    <AlertTriangle className="h-4 w-4" />
                                    {signalWord}
                                </span>
                            )}
                        </div>
                    </div>

                <div className="flex gap-3">
                        {chemical.source_pdf_url && (
                            <Button
                                variant="outline"
                                asChild
                                className="border-slate-200 hover:bg-slate-50"
                            >
                                <a href={chemical.source_pdf_url} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View SDS
                                    <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                            </Button>
                        )}
                        <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
                            <Link href={`/print?selected=${chemical.id}`}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Label
                            </Link>
                                </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Identifier - Required on GHS Labels */}
                    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal">
                            <div className="flex items-center justify-between">
                                <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Product Identifier
                                </p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {ghs?.product_identifier || chemical.name}
                                </h2>
                                {ghs?.supplier_info && (
                                    <p className="text-slate-500 mt-1">
                                        Supplier: {ghs.supplier_info}
                                    </p>
                                )}
                            </div>
                            {signalWord && (
                                <div className={cn(
                                    "px-4 py-2 rounded-lg text-lg font-bold uppercase tracking-wider",
                                    isDanger ? "signal-danger" : "signal-warning"
                                )}>
                                    {signalWord}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Pictograms */}
                    {ghs?.pictograms && ghs.pictograms.length > 0 && (
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm animate-reveal delay-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100">
                                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Hazard Pictograms
                                </h2>
                                    </div>
                            <div className="bg-gradient-to-br from-slate-50 to-white p-6">
                                <PictogramGrid 
                                    pictograms={ghs.pictograms} 
                                    size="lg"
                                    showLabels
                                />
                                </div>
                        </section>
                    )}

                    {/* Hazard Statements */}
                    {ghs?.hazard_statements && ghs.hazard_statements.length > 0 && (
                        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-200">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Hazard Statements (H-Codes)
                            </h2>
                            <div className="space-y-2">
                                {ghs.hazard_statements.map((statement, i) => (
                                    <div 
                                        key={i}
                                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
                                    >
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-mono font-bold">
                                            {statement.split(":")[0] || `H${i + 1}`}
                                        </span>
                                        <span className="text-slate-700 text-sm">
                                            {statement.includes(":") ? statement.split(":").slice(1).join(":").trim() : statement}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Precautionary Statements - Grouped by Category */}
                    {ghs?.precautionary_statements && ghs.precautionary_statements.length > 0 && (
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm animate-reveal delay-300 overflow-hidden">
                            <div className="p-4 border-b border-slate-100">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Precautionary Statements (P-Codes)
                                </h2>
                            </div>
                            <div className="p-4 space-y-6">
                                {(() => {
                                    const grouped = groupPCodes(ghs.precautionary_statements)
                                    return (
                                        <>
                                            {(["prevention", "response", "storage", "disposal"] as PCodeCategory[]).map(category => {
                                                const items = grouped[category]
                                                if (items.length === 0) return null
                                                const config = CATEGORY_CONFIG[category]
                                                const Icon = config.icon
                                                
                                                return (
                                                    <div key={category}>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Icon className={cn(
                                                                "h-4 w-4",
                                                                config.color === "sky" && "text-sky-600",
                                                                config.color === "amber" && "text-amber-600",
                                                                config.color === "violet" && "text-violet-600",
                                                                config.color === "slate" && "text-slate-600"
                                                            )} />
                                                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                                                {config.label}
                                                            </h3>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {items.map((item, i) => (
                                                                <div 
                                                                    key={i}
                                                                    className={cn(
                                                                        "flex items-start gap-3 p-3 rounded-lg border",
                                                                        config.color === "sky" && "bg-sky-50 border-sky-100",
                                                                        config.color === "amber" && "bg-amber-50 border-amber-100",
                                                                        config.color === "violet" && "bg-violet-50 border-violet-100",
                                                                        config.color === "slate" && "bg-slate-50 border-slate-200"
                                                                    )}
                                                                >
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0",
                                                                        config.color === "sky" && "bg-sky-100 text-sky-700",
                                                                        config.color === "amber" && "bg-amber-100 text-amber-700",
                                                                        config.color === "violet" && "bg-violet-100 text-violet-700",
                                                                        config.color === "slate" && "bg-slate-200 text-slate-700"
                                                                    )}>
                                                                        {item.code}
                                                                    </span>
                                                                    <span className="text-slate-700 text-sm">
                                                                        {item.statement}
                                                                    </span>
                                        </div>
                                    ))}
                                </div>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )
                                })()}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Validation Panel */}
                    {chemical.validation_results && (
                        <div className="animate-reveal delay-100">
                            <ValidationPanel 
                                validation={chemical.validation_results} 
                                compact 
                            />
                        </div>
                    )}

                    {/* Metadata */}
                    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Record Details
                        </h2>
                        <div className="space-y-4">
                            {ghs?.supplier_info && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                        Supplier
                                    </p>
                                    <p className="text-slate-900 font-medium">
                                        {ghs.supplier_info}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Added
                                </p>
                                <p className="text-slate-900 font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {new Date(chemical.created_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Record ID
                                </p>
                                <p className="text-slate-500 font-mono text-sm">
                                    {chemical.id}
                                </p>
                            </div>
                            </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
            return (
        <div className="space-y-8 animate-pulse">
            <div className="space-y-4">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-10 w-2/3 bg-slate-200 rounded" />
                <div className="flex gap-3">
                    <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                    <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-48 bg-slate-100 rounded-xl" />
                    <div className="h-64 bg-slate-100 rounded-xl" />
                </div>
                <div className="space-y-6">
                    <div className="h-48 bg-slate-100 rounded-xl" />
                    <div className="h-32 bg-slate-100 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

function ErrorState() {
            return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Chemical Not Found
            </h2>
            <p className="text-slate-500 mb-6">
                This record may have been deleted or you don&apos;t have access.
            </p>
            <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
                <Link href="/inventory">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Vault
                </Link>
            </Button>
        </div>
    )
}
