"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useChemicals } from "@/hooks/use-chemicals"
import { useUser } from "@/hooks/use-user"
import { Chemical } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PictogramBadges } from "@/components/ghs/pictogram"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    FileDown,
    CheckCircle2,
    AlertTriangle,
    Search,
    FileText,
    Loader2,
    Printer,
    Settings2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

// PDF Label Size Options (matches settings page)
const LABEL_SIZE_OPTIONS = {
    "avery_5163": { name: "Avery 5163", size: "4\" × 2\"", width: 4, height: 2 },
    "avery_5164": { name: "Avery 5164", size: "3⅓\" × 4\"", width: 3.33, height: 4 },
    "avery_5165": { name: "Avery 5165", size: "8½\" × 11\"", width: 8.5, height: 11 },
    "avery_5160": { name: "Avery 5160", size: "2⅝\" × 1\"", width: 2.625, height: 1 },
    "ghs_4x4": { name: "GHS 4×4", size: "4\" × 4\"", width: 4, height: 4 },
    "ghs_4x2": { name: "GHS 4×2", size: "4\" × 2\"", width: 4, height: 2 },
    "ghs_2x2": { name: "GHS 2×2", size: "2\" × 2\"", width: 2, height: 2 },
    "letter_full": { name: "Letter Full", size: "8½\" × 11\"", width: 8.5, height: 11 },
    "a4_full": { name: "A4 Full", size: "210 × 297mm", width: 8.27, height: 11.69 },
} as const

type LabelSizeKey = keyof typeof LABEL_SIZE_OPTIONS

export default function PrintPage() {
    const { data: chemicals = [], isLoading } = useChemicals()
    const { user } = useUser()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")
    const [isPrinting, setIsPrinting] = useState(false)
    const [labelSize, setLabelSize] = useState<LabelSizeKey>("avery_5163")
    const [labelsPerPage, setLabelsPerPage] = useState(1)
    const [showSettings, setShowSettings] = useState(false)

    // Load user's default label size from metadata
    useEffect(() => {
        if (user?.user_metadata) {
            const savedSize = user.user_metadata.label_size as LabelSizeKey
            const savedPerPage = user.user_metadata.labels_per_page as number
            if (savedSize && LABEL_SIZE_OPTIONS[savedSize]) {
                setLabelSize(savedSize)
            }
            if (savedPerPage) {
                setLabelsPerPage(savedPerPage)
            }
        }
    }, [user])

    // Only show completed chemicals
    const printableChemicals = useMemo(() => {
        const completed = chemicals.filter(c => c.status === "completed" && c.ghs_data)
        if (!searchQuery) return completed

        const query = searchQuery.toLowerCase()
        return completed.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.ghs_data?.product_identifier?.toLowerCase().includes(query)
        )
    }, [chemicals, searchQuery])

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === printableChemicals.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(printableChemicals.map(c => c.id)))
        }
    }

    const handlePrint = async () => {
        if (selectedIds.size === 0) return

        setIsPrinting(true)
        try {
            const ids = Array.from(selectedIds)
            const sizeConfig = LABEL_SIZE_OPTIONS[labelSize]

            // Get PDF blob with label size parameters
            const response = await api.post(
                "/print/pdf",
                {
                    chemical_ids: ids,
                    label_size: labelSize,
                    label_width: sizeConfig.width,
                    label_height: sizeConfig.height,
                    labels_per_page: labelsPerPage
                },
                { responseType: "blob" }
            )

            // Create download link
            const blob = new Blob([response.data], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `ghs_labels_${labelSize}_${Date.now()}.pdf`
            a.click()
            window.URL.revokeObjectURL(url)

            toast.success("PDF Generated", {
                description: `${ids.length} label(s) ready for printing on ${sizeConfig.name} (${sizeConfig.size}).`
            })
        } catch {
            toast.error("Print Failed", {
                description: "Could not generate labels. Please try again."
            })
        } finally {
            setIsPrinting(false)
        }
    }

    const selectedCount = selectedIds.size

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2 animate-reveal">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                    Print Queue
                </h1>
                <p className="text-slate-600 text-lg">
                    Select chemicals and generate GHS labels in bulk.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 animate-reveal delay-100">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search chemicals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-slate-200"
                    />
                </div>

                {/* Label Size + Settings Toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                            "border-slate-200",
                            showSettings && "bg-slate-100"
                        )}
                    >
                        <Settings2 className="h-4 w-4" />
                    </Button>

                    {/* Label Size Dropdown */}
                    <Select value={labelSize} onValueChange={(v: LabelSizeKey) => setLabelSize(v)}>
                        <SelectTrigger className="w-[180px] border-slate-200 bg-white">
                            <div className="flex items-center gap-2">
                                <Printer className="h-4 w-4 text-slate-500" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                Avery Labels
                            </div>
                            {Object.entries(LABEL_SIZE_OPTIONS)
                                .filter(([key]) => key.startsWith("avery"))
                                .map(([key, opt]) => (
                                    <SelectItem key={key} value={key}>
                                        {opt.name} ({opt.size})
                                    </SelectItem>
                                ))
                            }
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                GHS Standard
                            </div>
                            {Object.entries(LABEL_SIZE_OPTIONS)
                                .filter(([key]) => key.startsWith("ghs"))
                                .map(([key, opt]) => (
                                    <SelectItem key={key} value={key}>
                                        {opt.name} ({opt.size})
                                    </SelectItem>
                                ))
                            }
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                Full Page
                            </div>
                            {Object.entries(LABEL_SIZE_OPTIONS)
                                .filter(([key]) => key.includes("full"))
                                .map(([key, opt]) => (
                                    <SelectItem key={key} value={key}>
                                        {opt.name} ({opt.size})
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>

                {/* Download Button */}
                <Button
                    onClick={handlePrint}
                    disabled={selectedCount === 0 || isPrinting}
                    className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                >
                    {isPrinting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileDown className="h-4 w-4" />
                            Download PDF ({selectedCount})
                        </>
                    )}
                </Button>
            </div>

            {/* Print Settings Panel (collapsible) */}
            {showSettings && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 animate-reveal">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Print Settings
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Label Size Info */}
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-xs text-slate-500 mb-1">Label Size</p>
                            <p className="font-medium text-slate-900">
                                {LABEL_SIZE_OPTIONS[labelSize].name}
                            </p>
                            <p className="text-sm text-slate-600">
                                {LABEL_SIZE_OPTIONS[labelSize].size}
                            </p>
                        </div>

                        {/* Labels per page (for multi-label sheets) */}
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-xs text-slate-500 mb-1">Labels Per Chemical</p>
                            <Select
                                value={String(labelsPerPage)}
                                onValueChange={(v) => setLabelsPerPage(parseInt(v))}
                            >
                                <SelectTrigger className="border-slate-200 h-8 mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="1">1 label</SelectItem>
                                    <SelectItem value="2">2 labels</SelectItem>
                                    <SelectItem value="5">5 labels</SelectItem>
                                    <SelectItem value="10">10 labels</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dimensions */}
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-xs text-slate-500 mb-1">Dimensions</p>
                            <p className="font-medium text-slate-900">
                                {LABEL_SIZE_OPTIONS[labelSize].width}" × {LABEL_SIZE_OPTIONS[labelSize].height}"
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Width × Height
                            </p>
                        </div>

                        {/* Format */}
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <p className="text-xs text-slate-500 mb-1">Output Format</p>
                            <p className="font-medium text-slate-900">PDF</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                For laser/inkjet printers
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Info */}
            {selectedCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl animate-reveal">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    <span className="text-sky-800 font-medium">
                        {selectedCount} chemical{selectedCount !== 1 ? "s" : ""} selected for printing
                    </span>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-auto text-sm text-sky-600 hover:text-sky-700 font-medium"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-reveal delay-200">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : printableChemicals.length === 0 ? (
                    <EmptyState />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedIds.size === printableChemicals.length && printableChemicals.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-600 font-semibold">Chemical</TableHead>
                                <TableHead className="text-slate-600 font-semibold">Signal Word</TableHead>
                                <TableHead className="text-slate-600 font-semibold">Pictograms</TableHead>
                                <TableHead className="text-slate-600 font-semibold">H-Codes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {printableChemicals.map((chemical) => (
                                <PrintRow
                                    key={chemical.id}
                                    chemical={chemical}
                                    selected={selectedIds.has(chemical.id)}
                                    onToggle={() => toggleSelect(chemical.id)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}

function PrintRow({
    chemical,
    selected,
    onToggle,
}: {
    chemical: Chemical
    selected: boolean
    onToggle: () => void
}) {
    const signalWord = chemical.ghs_data?.signal_word
    const isDanger = signalWord === "Danger"

    return (
        <TableRow
            className={cn(
                "border-slate-100 cursor-pointer transition-colors",
                selected ? "bg-sky-50" : "hover:bg-slate-50"
            )}
            onClick={onToggle}
        >
            <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={selected}
                    onCheckedChange={onToggle}
                    className="border-slate-300"
                />
            </TableCell>
            <TableCell>
                <div>
                    <p className="font-medium text-slate-900">{chemical.name}</p>
                    {chemical.ghs_data?.product_identifier && chemical.ghs_data.product_identifier !== chemical.name && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {chemical.ghs_data.product_identifier}
                        </p>
                    )}
                </div>
            </TableCell>
            <TableCell>
                {signalWord && (
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                        isDanger ? "signal-danger" : "signal-warning"
                    )}>
                        <AlertTriangle className="h-3 w-3" />
                        {signalWord}
                    </span>
                )}
            </TableCell>
            <TableCell>
                {chemical.ghs_data?.pictograms && (
                    <PictogramBadges pictograms={chemical.ghs_data.pictograms} maxShow={4} />
                )}
            </TableCell>
            <TableCell>
                <p className="text-sm text-slate-600 truncate max-w-[200px]">
                    {chemical.ghs_data?.hazard_statements?.slice(0, 3).join(", ")}
                </p>
            </TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No chemicals to print
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
                Upload and process SDS files first to generate labels.
            </p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-5 w-5 bg-slate-200 rounded" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                    <div className="h-6 w-16 bg-slate-200 rounded" />
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, j) => (
                            <div key={j} className="h-7 w-7 bg-slate-100 rounded" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
