"use client"

import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user"
import api from "@/lib/api"
import {
    FileText,
    Printer,
    Upload,
    Trash2,
    Eye,
    Calendar,
    Clock,
    Search,
    List,
    LayoutGrid
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type AuditLog = {
    id: string
    user_id: string
    action: string
    target_type: string
    target_id: string | null
    details: {
        name?: string
        source?: string
        format?: string
        count?: number
        ids?: string[]
    }
    created_at: string
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; description: (log: AuditLog) => string }> = {
    "chemical.created": {
        icon: <Upload className="h-4 w-4" />,
        label: "Uploaded",
        color: "sky",
        description: (log) => `Added "${log.details?.name || 'chemical'}" to vault`
    },
    "chemical.updated": {
        icon: <FileText className="h-4 w-4" />,
        label: "Updated",
        color: "violet",
        description: (log) => `Updated "${log.details?.name || 'chemical'}"`
    },
    "chemical.deleted": {
        icon: <Trash2 className="h-4 w-4" />,
        label: "Deleted",
        color: "red",
        description: (log) => `Removed "${log.details?.name || 'chemical'}" from vault`
    },
    "chemical.viewed": {
        icon: <Eye className="h-4 w-4" />,
        label: "Viewed",
        color: "slate",
        description: (log) => `Viewed "${log.details?.name || 'chemical'}"`
    },
    "label.printed": {
        icon: <Printer className="h-4 w-4" />,
        label: "Printed",
        color: "emerald",
        description: (log) => log.details?.count
            ? `Printed ${log.details.count} label${log.details.count > 1 ? 's' : ''}`
            : `Printed label for "${log.details?.name || 'chemical'}"`
    },
}

export default function LogsPage() {
    const { user } = useUser()
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline")

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["audit-logs", user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const res = await api.get<AuditLog[]>(`/audit-logs`)
            return res.data
        },
        enabled: !!user?.id,
    })

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const filtered = logs.filter(log => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
                log.action.toLowerCase().includes(query) ||
                (log.target_id && log.target_id.toLowerCase().includes(query)) ||
                (log.details?.name && log.details.name.toLowerCase().includes(query))
            )
        })

        const groups: Record<string, AuditLog[]> = {}
        filtered.forEach(log => {
            const date = new Date(log.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
            })
            if (!groups[date]) groups[date] = []
            groups[date].push(log)
        })
        return groups
    }, [logs, searchQuery])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2 animate-reveal">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                    Audit Logs
                </h1>
                <p className="text-slate-600 text-lg">
                    Track all activity in your chemical vault.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 animate-reveal delay-100">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-slate-200"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("timeline")}
                        className={cn(
                            "gap-2 h-9",
                            viewMode === "timeline"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Timeline
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={cn(
                            "gap-2 h-9",
                            viewMode === "table"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <List className="h-4 w-4" />
                        Table
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="animate-reveal delay-200">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : logs.length === 0 ? (
                    <EmptyState />
                ) : viewMode === "timeline" ? (
                    <TimelineView groupedLogs={groupedLogs} />
                ) : (
                    <TableView logs={Object.values(groupedLogs).flat()} />
                )}
            </div>
        </div>
    )
}

function TimelineView({ groupedLogs }: { groupedLogs: Record<string, AuditLog[]> }) {
    return (
        <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{date}</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-sm text-slate-500">{logs.length} events</span>
                    </div>

                    {/* Events */}
                    <div className="space-y-3 ml-4 border-l-2 border-slate-200 pl-6">
                        {logs.map((log) => (
                            <LogCard key={log.id} log={log} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function LogCard({ log }: { log: AuditLog }) {
    const defaultConfig = {
        icon: <FileText className="h-4 w-4" />,
        label: log.action,
        color: "slate",
        description: () => log.target_id || log.action
    }
    const config = ACTION_CONFIG[log.action] || defaultConfig

    const colorClasses: Record<string, string> = {
        sky: "bg-sky-100 text-sky-600",
        violet: "bg-violet-100 text-violet-600",
        red: "bg-red-100 text-red-600",
        emerald: "bg-emerald-100 text-emerald-600",
        slate: "bg-slate-100 text-slate-600",
    }

    const time = new Date(log.created_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })

    return (
        <div className="relative bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Timeline dot */}
            <div className="absolute -left-9 top-5 w-4 h-4 rounded-full bg-white border-2 border-slate-300" />

            <div className="flex items-start gap-4">
                <div className={cn("p-2 rounded-lg shrink-0", colorClasses[config.color])}>
                    {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{config.label}</span>
                        {log.target_type && (
                            <>
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-500 capitalize">{log.target_type}</span>
                            </>
                        )}
                    </div>

                    <p className="text-sm text-slate-600 mb-2">
                        {config.description(log)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TableView({ logs }: { logs: AuditLog[] }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Action</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Description</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => {
                        const defaultConfig = {
                            icon: <FileText className="h-4 w-4" />,
                            label: log.action,
                            color: "slate",
                            description: () => log.target_id || log.action
                        }
                        const config = ACTION_CONFIG[log.action] || defaultConfig

                        return (
                            <TableRow key={log.id} className="border-slate-100">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">{config.icon}</span>
                                        <span className="font-medium text-slate-900">{config.label}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="text-sm text-slate-600 max-w-[300px]">
                                            {config.description(log)}
                                        </p>
                                        {log.target_type && (
                                            <p className="text-xs text-slate-400 capitalize">{log.target_type}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No activity yet
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
                Upload your first SDS to see activity logs here.
            </p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-8 w-48 bg-slate-100 rounded-lg mb-4" />
                    <div className="space-y-3 ml-4 pl-6 border-l-2 border-slate-200">
                        {[...Array(2)].map((_, j) => (
                            <div key={j} className="h-24 bg-slate-100 rounded-xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
