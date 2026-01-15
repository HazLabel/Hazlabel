"use client"

import React, { useState, useMemo } from "react"
import { ChemicalTable } from "@/components/inventory/chemical-table"
import { useChemicals } from "@/hooks/use-chemicals"
import { 
    Search, 
    Database, 
    AlertTriangle, 
    Clock,
    Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FilterType = "all" | "danger" | "warning" | "review" | "processing"

const filters: { id: FilterType; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: "All" },
    { id: "danger", label: "Danger", icon: <AlertTriangle className="h-3 w-3" /> },
    { id: "warning", label: "Warning" },
    { id: "review", label: "Needs Review", icon: <Clock className="h-3 w-3" /> },
    { id: "processing", label: "Processing" },
]

export default function InventoryPage() {
    const { data: chemicals = [], isLoading, isLoadingUser } = useChemicals()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState<FilterType>("all")

    // Filter chemicals based on search and filter
    const filteredChemicals = useMemo(() => {
        let result = chemicals

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.ghs_data?.product_identifier?.toLowerCase().includes(query)
            )
        }

        // Apply category filter
        switch (activeFilter) {
            case "danger":
                result = result.filter(c => c.ghs_data?.signal_word === "Danger")
                break
            case "warning":
                result = result.filter(c => c.ghs_data?.signal_word === "Warning")
                break
            case "review":
                result = result.filter(c => c.needs_review)
                break
            case "processing":
                result = result.filter(c => c.status === "processing")
                break
        }

        return result
    }, [chemicals, searchQuery, activeFilter])

    // Stats
    const stats = useMemo(() => ({
        total: chemicals.length,
        danger: chemicals.filter(c => c.ghs_data?.signal_word === "Danger").length,
        warning: chemicals.filter(c => c.ghs_data?.signal_word === "Warning").length,
        review: chemicals.filter(c => c.needs_review).length,
        processing: chemicals.filter(c => c.status === "processing").length,
    }), [chemicals])

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="space-y-2 animate-reveal">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                    Chemical Vault
                </h1>
                <p className="text-slate-600 text-lg">
                    Manage your chemical inventory and GHS compliance status.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-reveal delay-100">
                <StatsCard
                    label="Total Chemicals"
                    value={stats.total}
                    icon={<Database className="h-5 w-5" />}
                    color="sky"
                />
                <StatsCard
                    label="Danger Class"
                    value={stats.danger}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="red"
                />
                <StatsCard
                    label="Warning Class"
                    value={stats.warning}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="amber"
                />
                <StatsCard
                    label="Needs Review"
                    value={stats.review}
                    icon={<Clock className="h-5 w-5" />}
                    color="violet"
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 animate-reveal delay-200">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search chemicals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-slate-400 mr-1" />
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                                activeFilter === filter.id
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {filter.icon}
                            {filter.label}
                            {filter.id !== "all" && (
                                <span className="text-xs text-slate-500 ml-1">
                                    {stats[filter.id as keyof typeof stats]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="animate-reveal delay-300">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ChemicalTable 
                        chemicals={filteredChemicals} 
                        isLoading={isLoading || isLoadingUser} 
                    />
                </div>
            </div>

            {/* Empty state hint */}
            {!isLoading && chemicals.length === 0 && (
                <div className="text-center py-12 animate-reveal">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                        <Database className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No chemicals yet
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Upload your first Safety Data Sheet to start building your chemical vault.
                    </p>
                </div>
            )}
        </div>
    )
}

function StatsCard({ 
    label, 
    value, 
    icon, 
    color 
}: { 
    label: string
    value: number
    icon: React.ReactNode
    color: "sky" | "red" | "amber" | "violet"
}) {
    const colorClasses = {
        sky: "bg-sky-50 border-sky-100 text-sky-600",
        red: "bg-red-50 border-red-100 text-red-600",
        amber: "bg-amber-50 border-amber-100 text-amber-600",
        violet: "bg-violet-50 border-violet-100 text-violet-600",
    }
    
    return (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        {label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>
                <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
