"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * GHS Pictogram Component
 * Renders official UN GHS hazard pictograms
 * Supports codes GHS01-GHS09 per UN GHS Revision 11
 */

interface GHSPictogramProps {
    code: string
    size?: number
    className?: string
    showLabel?: boolean
}

// GHS Pictogram labels - official caption text per UN GHS
const GHS_PICTOGRAM_LABELS: Record<string, string> = {
    GHS01: "Explosive",
    GHS02: "Flammable",
    GHS03: "Oxidizing",
    GHS04: "Gas Under Pressure",
    GHS05: "Corrosive",
    GHS06: "Toxic",
    GHS07: "Health Hazard",
    GHS08: "Serious Health Hazard",
    GHS09: "Environmental Hazard"
}

// Legacy name mapping for backward compatibility
const NAME_TO_CODE: Record<string, string> = {
    "Exploding Bomb": "GHS01",
    "Explosive": "GHS01",
    "Flame": "GHS02",
    "Flammable": "GHS02",
    "Flame over circle": "GHS03",
    "Oxidizer": "GHS03",
    "Gas Cylinder": "GHS04",
    "Compressed Gas": "GHS04",
    "Corrosion": "GHS05",
    "Corrosive": "GHS05",
    "Skull and Crossbones": "GHS06",
    "Skull": "GHS06",
    "Toxic": "GHS06",
    "Exclamation Mark": "GHS07",
    "Exclamation": "GHS07",
    "Irritant": "GHS07",
    "Health Hazard": "GHS08",
    "Silhouette": "GHS08",
    "Environment": "GHS09",
    "Dead Tree": "GHS09",
    "Environmental": "GHS09"
}

// Valid GHS codes
const VALID_GHS_CODES = ["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"]

function normalizeCode(input: string): string {
    // If it's already a GHS code, return it uppercase
    const upper = input.toUpperCase().trim()
    if (upper.startsWith("GHS") && VALID_GHS_CODES.includes(upper)) {
        return upper
    }
    // Try to map from name
    return NAME_TO_CODE[input] || upper
}

function isValidGHSCode(code: string): boolean {
    return VALID_GHS_CODES.includes(code)
}

export function GHSPictogram({ 
    code, 
    size = 48, 
    className,
    showLabel = false 
}: GHSPictogramProps) {
    const normalizedCode = normalizeCode(code)
    const isValid = isValidGHSCode(normalizedCode)
    const label = GHS_PICTOGRAM_LABELS[normalizedCode]
    
    if (!isValid) {
        // Unknown pictogram - show placeholder
        return (
            <div
                className={cn(
                    "relative flex items-center justify-center bg-slate-100 border-2 border-slate-300 rounded",
                    className
                )}
                style={{ 
                    width: size, 
                    height: size
                }}
                title={`Unknown pictogram: ${code}`}
            >
                <span className="text-slate-400 text-xs font-mono">?</span>
            </div>
        )
    }
    
    // Container needs to be larger to fit the rotated diamond
    const containerSize = Math.ceil(size * 1.45)
    
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div
                className="relative flex items-center justify-center"
                style={{ width: containerSize, height: containerSize }}
                title={`${normalizedCode}: ${label}`}
            >
                <Image
                    src={`/pictograms/${normalizedCode}.png`}
                    alt={`${normalizedCode} - ${label}`}
                    width={size}
                    height={size}
                    className="object-contain [transform:rotate(-45deg)]"
                    priority
                    unoptimized
                />
            </div>
            
            {showLabel && (
                <span className="text-xs font-medium text-slate-600 text-center">
                    {label}
                </span>
            )}
        </div>
    )
}

// Size presets for different contexts
const SIZE_PRESETS: Record<string, number> = {
    sm: 36,
    md: 56,
    lg: 80,
    xl: 100
}

export function PictogramGrid({ 
    pictograms, 
    size = "md",
    showLabels = false,
    className 
}: { 
    pictograms: string[]
    size?: number | "sm" | "md" | "lg" | "xl"
    showLabels?: boolean
    className?: string
}) {
    if (!pictograms || pictograms.length === 0) {
        return (
            <div className="text-slate-400 text-sm italic">
                No pictograms assigned
            </div>
        )
    }
    
    // Resolve size - handle both number and preset string
    const resolvedSize = typeof size === "string" ? (SIZE_PRESETS[size] || 56) : size
    
    // Deduplicate and normalize pictograms
    const normalizedPictograms = [...new Set(pictograms.map(p => normalizeCode(p)))]
        .filter(isValidGHSCode)
    
    if (normalizedPictograms.length === 0) {
        return (
            <div className="text-slate-400 text-sm italic">
                No valid pictograms
            </div>
        )
    }
    
    return (
        <div className={cn(
            "flex flex-wrap items-center justify-center gap-6",
            className
        )}>
            {normalizedPictograms.map((pic) => (
                <GHSPictogram 
                    key={pic} 
                    code={pic} 
                    size={resolvedSize}
                    showLabel={showLabels}
                />
            ))}
        </div>
    )
}

// Compact version for table cells
export function PictogramBadges({ 
    pictograms, 
    maxShow = 4 
}: { 
    pictograms: string[]
    maxShow?: number 
}) {
    if (!pictograms || pictograms.length === 0) {
        return <span className="text-slate-400 text-xs">—</span>
    }
    
    // Deduplicate and normalize
    const normalizedPictograms = [...new Set(pictograms.map(p => normalizeCode(p)))]
        .filter(isValidGHSCode)
    
    if (normalizedPictograms.length === 0) {
        return <span className="text-slate-400 text-xs">—</span>
    }
    
    const visible = normalizedPictograms.slice(0, maxShow)
    const remaining = normalizedPictograms.length - maxShow
    
    return (
        <div className="flex items-center gap-2">
            {visible.map((pic) => (
                <GHSPictogram 
                    key={pic} 
                    code={pic} 
                    size={36}
                />
            ))}
            {remaining > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                    +{remaining}
                </span>
            )}
        </div>
    )
}

// Get pictogram info for display
export function getPictogramInfo(code: string): { code: string; label: string } | null {
    const normalizedCode = normalizeCode(code)
    const label = GHS_PICTOGRAM_LABELS[normalizedCode]
    
    if (!label) return null
    
    return {
        code: normalizedCode,
        label
    }
}

// List all available pictogram codes
export function getAllPictogramCodes(): string[] {
    return VALID_GHS_CODES
}
