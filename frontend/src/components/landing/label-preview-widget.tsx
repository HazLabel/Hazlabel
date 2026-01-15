"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Info, AlertTriangle, Zap, Check } from "lucide-react"
import Image from "next/image"

// Simplified local GHS data for the interactive widget
const GHS_MAPPINGS: Record<string, { pictograms: string[], signal: string, title: string }> = {
    "H225": { pictograms: ["GHS02"], signal: "DANGER", title: "Highly flammable liquid" },
    "H314": { pictograms: ["GHS05"], signal: "DANGER", title: "Causes severe skin burns" },
    "H318": { pictograms: ["GHS05"], signal: "DANGER", title: "Causes serious eye damage" },
    "H301": { pictograms: ["GHS06"], signal: "DANGER", title: "Toxic if swallowed" },
    "H330": { pictograms: ["GHS06"], signal: "DANGER", title: "Fatal if inhaled" },
    "H317": { pictograms: ["GHS07"], signal: "WARNING", title: "May cause allergic reaction" },
    "H319": { pictograms: ["GHS07"], signal: "WARNING", title: "Causes serious eye irritation" },
    "H335": { pictograms: ["GHS07"], signal: "WARNING", title: "May cause respiratory irritation" },
    "H350": { pictograms: ["GHS08"], signal: "DANGER", title: "May cause cancer" },
    "H410": { pictograms: ["GHS09"], signal: "WARNING", title: "Very toxic to aquatic life" }
}

const COMMON_CODES = ["H225", "H314", "H317", "H330", "H350", "H410"]

export function LabelPreviewWidget() {
    const [selectedCodes, setSelectedCodes] = useState<string[]>(["H225", "H319"])
    const [currentMapping, setCurrentMapping] = useState<{ pictograms: string[], signal: string }>({
        pictograms: ["GHS02", "GHS07"],
        signal: "DANGER"
    })

    useEffect(() => {
        let pics: string[] = []
        let isDanger = false

        selectedCodes.forEach(code => {
            const mapping = GHS_MAPPINGS[code]
            if (mapping) {
                mapping.pictograms.forEach(p => {
                    if (!pics.includes(p)) pics.push(p)
                })
                if (mapping.signal === "DANGER") isDanger = true
            }
        })

        setCurrentMapping({
            pictograms: pics,
            signal: selectedCodes.length > 0 ? (isDanger ? "DANGER" : "WARNING") : "NONE"
        })
    }, [selectedCodes])

    const toggleCode = (code: string) => {
        setSelectedCodes(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-5xl mx-auto p-4 md:p-8">
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-6 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 shadow-xl">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-sky-600" />
                        Live Classifier
                    </h3>
                    <p className="text-sm text-slate-500">Pick hazard codes to see how the intelligence engine classifies them instantly.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {COMMON_CODES.map(code => (
                        <button
                            key={code}
                            onClick={() => toggleCode(code)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selectedCodes.includes(code)
                                    ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                                }`}
                        >
                            {code}
                            {selectedCodes.includes(code) && <Check className="h-3 w-3" />}
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Info className="h-3 w-3" />
                        <span>GHS Revision 11 Logic Applied</span>
                    </div>
                </div>
            </div>

            {/* Label Preview */}
            <div className="w-full lg:w-2/3 flex items-center justify-center">
                <motion.div
                    layout
                    className="relative w-full aspect-[16/10] max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 group"
                >
                    {/* Label Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Product Identifier</p>
                            <h4 className="font-bold text-slate-800">Industrial Solvent XP-9</h4>
                        </div>
                        <Shield className="h-5 w-5 text-sky-600 opacity-50" />
                    </div>

                    <div className="p-6 flex h-full">
                        {/* Left side: Text */}
                        <div className="flex-1 space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentMapping.signal}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`text-3xl font-black italic tracking-tighter ${currentMapping.signal === "DANGER" ? "text-red-600" : "text-amber-500"
                                        }`}
                                >
                                    {currentMapping.signal !== "NONE" ? currentMapping.signal : "NO HAZARD"}
                                </motion.div>
                            </AnimatePresence>

                            <div className="space-y-1">
                                {selectedCodes.map(code => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={code}
                                        className="flex items-center gap-2 text-xs text-slate-600"
                                    >
                                        <span className="font-bold text-slate-900 shrink-0">{code}</span>
                                        <span className="truncate">{GHS_MAPPINGS[code]?.title || "Hazard description..."}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right side: Pictograms */}
                        <div className="w-24 flex flex-col items-center justify-start gap-3 relative mr-4">
                            <AnimatePresence>
                                {currentMapping.pictograms.map((pic, idx) => (
                                    <motion.div
                                        key={pic}
                                        layout
                                        initial={{ opacity: 0, scale: 0, rotate: -45 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        className="w-16 h-16 relative border-2 border-red-600 rounded-sm rotate-45 shadow-lg bg-white overflow-hidden"
                                    >
                                        <div className="-rotate-45 w-full h-full flex items-center justify-center p-2">
                                            <Image
                                                src={`/pictograms/${pic}.png`}
                                                alt={pic}
                                                width={48}
                                                height={48}
                                                className="object-contain"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Label Footer */}
                    <div className="absolute bottom-0 w-full p-2 bg-slate-50 border-t border-slate-100 flex justify-between px-4">
                        <span className="text-[8px] text-slate-400">NuGenTec 1155 Park Avenue, Emeryville, CA 94608</span>
                        <span className="text-[8px] text-slate-400 font-bold tracking-widest">GHS REV 11 COMPLIANT</span>
                    </div>

                    {/* Floating badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-sky-950/90 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium border border-sky-400/30">
                        Real-time API result
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
