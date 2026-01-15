"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Chemical } from "@/lib/types"
import { GHSPictogram } from "@/components/ghs/pictogram"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, AlertCircle, PhoneCall, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function MobileSafetyView() {
    const { id } = useParams()

    const { data: chemical, isLoading, error } = useQuery({
        queryKey: ["chemical", id],
        queryFn: async () => {
            const response = await api.get<Chemical>(`/chemicals/${id}`)
            return response.data
        },
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
                    <p className="text-slate-500 font-medium">Loading Safety Data...</p>
                </div>
            </div>
        )
    }

    if (error || !chemical) {
        return (
            <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center max-w-sm">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-500 mb-8">This safety record is no longer available or the link is invalid.</p>
                    <Button className="w-full h-12 text-lg font-bold" variant="destructive">
                        REPORT INCIDENT
                    </Button>
                </div>
            </div>
        )
    }

    const { ghs_data } = chemical

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Massive Signal Word Banner */}
            <div className={cn(
                "w-full py-8 px-6 text-center text-white shadow-lg",
                ghs_data?.signal_word === "Danger" ? "bg-red-600" : "bg-amber-500"
            )}>
                <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-90 mb-2">GHS Safety Warning</p>
                <h1 className="text-5xl font-black tracking-tighter uppercase">
                    {ghs_data?.signal_word || "CAUTION"}
                </h1>
            </div>

            <div className="p-6 space-y-8">
                {/* Product Identity */}
                <div className="border-b pb-6">
                    <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                        {chemical.name}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Chemical Identifier: {chemical.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* Large Pictograms */}
                <div className="flex flex-wrap justify-center gap-8 py-4">
                    {ghs_data?.pictograms.map((pic) => (
                        <GHSPictogram key={pic} code={pic} size={120} className="border-red-600 border-4 shadow-xl" />
                    ))}
                    {(!ghs_data?.pictograms || ghs_data.pictograms.length === 0) && (
                        <p className="text-slate-400 italic">No specific pictograms required</p>
                    )}
                </div>

                {/* Hazard Statements */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                        <h3 className="text-xl font-bold uppercase tracking-wide text-slate-900">Hazard Statements</h3>
                    </div>
                    <div className="space-y-3">
                        {ghs_data?.hazard_statements.map((stmt, idx) => (
                            <div key={idx} className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-lg font-bold text-red-900 leading-snug">
                                    {stmt}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Precautionary Statements */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                        <FileText className="h-6 w-6 text-slate-900" />
                        <h3 className="text-xl font-bold uppercase tracking-wide text-slate-900">Precautionary Info</h3>
                    </div>
                    <div className="space-y-3">
                        {ghs_data?.precautionary_statements.slice(0, 6).map((stmt, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-slate-700 font-medium leading-relaxed">
                                    {stmt}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Supplier Info */}
                <div className="pt-6 border-t mt-12">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Responsible Party</h4>
                    <p className="text-slate-600 leading-relaxed italic">{ghs_data?.supplier_info}</p>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t flex gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
                <Button
                    className="flex-1 h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800"
                    onClick={() => window.open(chemical.source_pdf_url, "_blank")}
                    disabled={!chemical.source_pdf_url}
                >
                    <FileText className="mr-2 h-5 w-5" /> SDS PDF
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 h-14 text-lg font-bold border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => toast.info("Incident report started", { description: "Compliance team notified." })}
                >
                    <PhoneCall className="mr-2 h-5 w-5" /> EMERGENCY
                </Button>
            </div>
        </div>
    )
}
