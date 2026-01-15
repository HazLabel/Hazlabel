"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Chemical } from "@/lib/types"
import { PictogramBadges } from "@/components/ghs/pictogram"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    MoreHorizontal,
    Printer,
    Trash2,
    Eye,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface ChemicalTableProps {
    chemicals: Chemical[]
    isLoading?: boolean
}

export function ChemicalTable({ chemicals, isLoading }: ChemicalTableProps) {
    const [deleteChemical, setDeleteChemical] = useState<Chemical | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const queryClient = useQueryClient()

    const handleDelete = async () => {
        if (!deleteChemical) return

        setIsDeleting(true)
        try {
            await api.delete(`/chemicals/${deleteChemical.id}`)
            toast.success("Chemical deleted", {
                description: `${deleteChemical.name} has been removed from your vault.`
            })
            queryClient.invalidateQueries({ queryKey: ["chemicals"] })
        } catch {
            toast.error("Delete failed", {
                description: "Could not delete the chemical. Please try again."
            })
        } finally {
            setIsDeleting(false)
            setDeleteChemical(null)
        }
    }

    if (isLoading) {
        return <TableSkeleton />
    }

    if (chemicals.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                No chemicals match your filters.
            </div>
        )
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-transparent bg-slate-50">
                        <TableHead className="text-slate-600 font-semibold">Chemical</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Signal Word</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Pictograms</TableHead>
                        <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {chemicals.map((chemical) => (
                        <TableRow
                            key={chemical.id}
                            className="border-slate-100 table-row-hover group"
                        >
                            {/* Chemical Name */}
                            <TableCell>
                                <Link
                                    href={`/inventory/${chemical.id}`}
                                    className="block group/link"
                                >
                                    <p className="font-medium text-slate-900 group-hover/link:text-sky-600 transition-colors">
                                        {chemical.name}
                                    </p>
                                    {chemical.ghs_data?.product_identifier && chemical.ghs_data.product_identifier !== chemical.name && (
                                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                                            {chemical.ghs_data.product_identifier}
                                        </p>
                                    )}
                                </Link>
                            </TableCell>

                            {/* Signal Word */}
                            <TableCell>
                                {chemical.status === "completed" && chemical.ghs_data?.signal_word ? (
                                    <SignalWordBadge signalWord={chemical.ghs_data.signal_word} />
                                ) : chemical.status === "processing" ? (
                                    <span className="text-slate-400 text-sm">—</span>
                                ) : (
                                    <span className="text-slate-400 text-sm">Unknown</span>
                                )}
                            </TableCell>

                            {/* Pictograms */}
                            <TableCell>
                                {chemical.status === "completed" && chemical.ghs_data?.pictograms ? (
                                    <PictogramBadges
                                        pictograms={chemical.ghs_data.pictograms}
                                        maxShow={4}
                                    />
                                ) : chemical.status === "processing" ? (
                                    <span className="text-slate-400 text-sm">—</span>
                                ) : (
                                    <span className="text-slate-400 text-sm">None</span>
                                )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                                <StatusBadge
                                    status={chemical.status}
                                    needsReview={chemical.needs_review}
                                />
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-48 bg-white border-slate-200"
                                    >
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={`/inventory/${chemical.id}`}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>

                                        {chemical.status === "completed" && (
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/print?selected=${chemical.id}`}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                    Print Label
                                                </Link>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator className="bg-slate-100" />

                                        <DropdownMenuItem
                                            onClick={() => setDeleteChemical(chemical)}
                                            className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteChemical} onOpenChange={() => setDeleteChemical(null)}>
                <DialogContent className="bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Chemical
                        </DialogTitle>
                        <DialogDescription className="text-slate-600">
                            Are you sure you want to delete <strong className="text-slate-900">{deleteChemical?.name}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteChemical(null)}
                            disabled={isDeleting}
                            className="border-slate-200 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function SignalWordBadge({ signalWord }: { signalWord: string }) {
    const isDanger = signalWord === "Danger"

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
            isDanger ? "signal-danger" : "signal-warning"
        )}>
            <AlertTriangle className="h-3 w-3" />
            {signalWord}
        </span>
    )
}

function StatusBadge({ status, needsReview }: { status: string; needsReview?: boolean }) {
    if (status === "processing") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
            </span>
        )
    }

    if (status === "failed") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                <XCircle className="h-3 w-3" />
                Failed
            </span>
        )
    }

    if (needsReview) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                <Clock className="h-3 w-3" />
                Review
            </span>
        )
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"
            title="Hazards reproduced from manufacturer SDS Section 2. Not a certification."
        >
            <CheckCircle2 className="h-3 w-3" />
            SDS Parsed
        </span>
    )
}

function TableSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
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
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                    <div className="h-8 w-8 bg-slate-100 rounded" />
                </div>
            ))}
        </div>
    )
}
