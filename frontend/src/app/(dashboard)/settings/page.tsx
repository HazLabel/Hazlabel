"use client"

import React, { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    User, 
    Printer, 
    Bell, 
    Shield,
    Save,
    Loader2,
    CheckCircle2,
    Mail,
    Building
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// PDF Label Size Options
const LABEL_SIZE_OPTIONS = {
    // Avery Labels (most common for office use)
    "avery_5163": { name: "Avery 5163", size: "4\" × 2\"", description: "10 labels per sheet" },
    "avery_5164": { name: "Avery 5164", size: "3⅓\" × 4\"", description: "6 labels per sheet" },
    "avery_5165": { name: "Avery 5165", size: "8½\" × 11\"", description: "Full sheet label" },
    "avery_5160": { name: "Avery 5160", size: "2⅝\" × 1\"", description: "30 labels per sheet" },
    "avery_5167": { name: "Avery 5167", size: "½\" × 1¾\"", description: "80 labels per sheet" },
    // GHS-specific sizes
    "ghs_4x4": { name: "GHS 4×4", size: "4\" × 4\"", description: "Standard GHS label" },
    "ghs_4x2": { name: "GHS 4×2", size: "4\" × 2\"", description: "Compact GHS label" },
    "ghs_2x2": { name: "GHS 2×2", size: "2\" × 2\"", description: "Small container label" },
    // Custom sizes
    "letter_full": { name: "Letter Full", size: "8½\" × 11\"", description: "Full page (US Letter)" },
    "a4_full": { name: "A4 Full", size: "210 × 297mm", description: "Full page (A4)" },
} as const

type LabelSizeKey = keyof typeof LABEL_SIZE_OPTIONS

interface UserSettings {
    display_name: string
    organization: string
    label_size: LabelSizeKey
    labels_per_page: number
    notifications_enabled: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
    display_name: "",
    organization: "",
    label_size: "avery_5163",
    labels_per_page: 1,
    notifications_enabled: true,
}

export default function SettingsPage() {
    const { user, loading: userLoading } = useUser()
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const supabase = createClient()

    // Load settings from user metadata
    useEffect(() => {
        if (user) {
            const metadata = user.user_metadata || {}
            setSettings({
                display_name: metadata.display_name || user.email?.split("@")[0] || "",
                organization: metadata.organization || "",
                label_size: metadata.label_size || "avery_5163",
                labels_per_page: metadata.labels_per_page || 1,
                notifications_enabled: metadata.notifications_enabled ?? true,
            })
        }
    }, [user])

    const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!user) return

        setIsSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    display_name: settings.display_name,
                    organization: settings.organization,
                    label_size: settings.label_size,
                    labels_per_page: settings.labels_per_page,
                    notifications_enabled: settings.notifications_enabled,
                }
            })

            if (error) throw error

            toast.success("Settings saved", {
                description: "Your preferences have been updated."
            })
            setHasChanges(false)
        } catch (error) {
            toast.error("Failed to save settings", {
                description: error instanceof Error ? error.message : "Please try again."
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (userLoading) {
        return <LoadingSkeleton />
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between animate-reveal">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Settings
                </h1>
                    <p className="text-slate-600 text-lg mt-1">
                        Manage your account and preferences.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                        "gap-2 transition-all",
                        hasChanges
                            ? "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20"
                            : "bg-slate-100 text-slate-400"
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : hasChanges ? (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Saved
                        </>
                    )}
                </Button>
            </div>

            {/* Profile Section */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-sky-50">
                        <User className="h-5 w-5 text-sky-600" />
                            </div>
                            <div>
                        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
                        <p className="text-sm text-slate-500">Your personal information</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="display_name" className="text-slate-700">
                                Display Name
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="display_name"
                                    value={settings.display_name}
                                    onChange={(e) => updateSetting("display_name", e.target.value)}
                                    className="pl-10 border-slate-200"
                                    placeholder="Your name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="organization" className="text-slate-700">
                                Organization
                            </Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="organization"
                                    value={settings.organization}
                                    onChange={(e) => updateSetting("organization", e.target.value)}
                                    className="pl-10 border-slate-200"
                                    placeholder="Company or lab name"
                                />
                            </div>
                        </div>
                    </div>

                        <div className="space-y-2">
                        <Label className="text-slate-700">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={user?.email || ""}
                                disabled
                                className="pl-10 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Email cannot be changed from here.
                        </p>
                    </div>
                </div>
            </section>

            {/* Label Printing Settings */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-violet-50">
                        <Printer className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Label Printing</h2>
                        <p className="text-sm text-slate-500">Configure PDF label size and format</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Label Size Selection */}
                    <div className="space-y-2">
                        <Label className="text-slate-700">Label Size</Label>
                        <Select
                            value={settings.label_size}
                            onValueChange={(value: LabelSizeKey) => updateSetting("label_size", value)}
                        >
                            <SelectTrigger className="border-slate-200">
                                <SelectValue>
                                    {LABEL_SIZE_OPTIONS[settings.label_size]?.name} ({LABEL_SIZE_OPTIONS[settings.label_size]?.size})
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 max-h-[300px]">
                                {/* Avery Labels */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                    Avery Labels
                                </div>
                                {Object.entries(LABEL_SIZE_OPTIONS)
                                    .filter(([key]) => key.startsWith("avery"))
                                    .map(([key, option]) => (
                                        <SelectItem key={key} value={key} className="py-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.name}</span>
                                                <span className="text-xs text-slate-500">
                                                    {option.size} — {option.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                                {/* GHS Standard Sizes */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                    GHS Standard
                                </div>
                                {Object.entries(LABEL_SIZE_OPTIONS)
                                    .filter(([key]) => key.startsWith("ghs"))
                                    .map(([key, option]) => (
                                        <SelectItem key={key} value={key} className="py-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.name}</span>
                                                <span className="text-xs text-slate-500">
                                                    {option.size} — {option.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                                {/* Full Page Options */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                    Full Page
                                </div>
                                {Object.entries(LABEL_SIZE_OPTIONS)
                                    .filter(([key]) => key.includes("full"))
                                    .map(([key, option]) => (
                                        <SelectItem key={key} value={key} className="py-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.name}</span>
                                                <span className="text-xs text-slate-500">
                                                    {option.size} — {option.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Current Selection Info */}
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                                <Printer className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">
                                    {LABEL_SIZE_OPTIONS[settings.label_size]?.name}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {LABEL_SIZE_OPTIONS[settings.label_size]?.size} — {LABEL_SIZE_OPTIONS[settings.label_size]?.description}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Labels will be generated as PDF for printing on standard laser/inkjet printers.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Labels per page for multi-label sheets */}
                    {settings.label_size.startsWith("avery") && !settings.label_size.includes("5165") && (
                        <div className="space-y-2">
                            <Label className="text-slate-700">Labels Per Print Job</Label>
                            <Select
                                value={String(settings.labels_per_page)}
                                onValueChange={(value) => updateSetting("labels_per_page", parseInt(value))}
                            >
                                <SelectTrigger className="border-slate-200 w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="1">1 label</SelectItem>
                                    <SelectItem value="2">2 labels</SelectItem>
                                    <SelectItem value="5">5 labels</SelectItem>
                                    <SelectItem value="10">10 labels</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                Number of identical labels to print per chemical
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Notifications */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-300">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-amber-50">
                        <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                        <p className="text-sm text-slate-500">Manage how you receive updates</p>
                    </div>
                </div>

                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="font-medium text-slate-900">Processing Notifications</p>
                        <p className="text-sm text-slate-500">
                            Get notified when SDS parsing completes
                        </p>
                    </div>
                    <button
                        onClick={() => updateSetting("notifications_enabled", !settings.notifications_enabled)}
                        className={cn(
                            "relative w-12 h-6 rounded-full transition-colors",
                            settings.notifications_enabled
                                ? "bg-sky-600"
                                : "bg-slate-200"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                settings.notifications_enabled && "translate-x-6"
                            )}
                        />
                    </button>
                </div>
            </section>

            {/* Security */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-400">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-red-50">
                        <Shield className="h-5 w-5 text-red-600" />
                    </div>
                            <div>
                        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                        <p className="text-sm text-slate-500">Protect your account</p>
                            </div>
                            </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-slate-900">Change Password</p>
                            <p className="text-sm text-slate-500">
                                Update your account password
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            className="border-slate-200 hover:bg-slate-50"
                            onClick={async () => {
                                if (!user?.email) return
                                const { error } = await supabase.auth.resetPasswordForEmail(user.email)
                                if (error) {
                                    toast.error("Failed to send reset email")
                                } else {
                                    toast.success("Password reset email sent")
                                }
                            }}
                        >
                            Reset Password
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-red-600">Delete Account</p>
                                <p className="text-sm text-slate-500">
                                    Permanently remove your account and all data
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                                Delete Account
                            </Button>
                        </div>
                        </div>
            </div>
            </section>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8 max-w-3xl animate-pulse">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <div className="h-10 w-48 bg-slate-200 rounded" />
                    <div className="h-5 w-64 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded" />
            </div>
            
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-xl" />
            ))}
        </div>
    )
}
