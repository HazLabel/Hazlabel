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
    Building,
    Eye,
    EyeOff,
    Key,
    X,
    CreditCard,
    Trash2,
    AlertTriangle,
    ArrowRight,
    MailCheck,
    MousePointerClick,
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SubscriptionManagement } from "@/components/subscription-management"
import { useRouter } from "next/navigation"

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

    // Email change state
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [sentToEmail, setSentToEmail] = useState("")

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [deleteLoading, setDeleteLoading] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    // Refresh session on mount to pick up any changes made externally
    // (e.g. email change confirmed via verification link in another tab)
    useEffect(() => {
        supabase.auth.refreshSession()
    }, [])

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

    const handleEmailChange = async () => {
        if (!newEmail || !user) return

        setEmailLoading(true)
        try {
            const { error } = await supabase.auth.updateUser(
                { email: newEmail },
                { emailRedirectTo: `${window.location.origin}/auth/callback?type=email_change` }
            )

            if (error) throw error

            setSentToEmail(newEmail)
            setEmailSent(true)
            setNewEmail("")
        } catch (error) {
            toast.error("Failed to change email", {
                description: error instanceof Error ? error.message : "Please try again."
            })
        } finally {
            setEmailLoading(false)
        }
    }

    const closeEmailModal = () => {
        setShowEmailModal(false)
        setNewEmail("")
        setEmailSent(false)
        setSentToEmail("")
    }

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error("All fields are required")
            return
        }

        if (newPassword !== confirmNewPassword) {
            toast.error("Passwords don't match")
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setPasswordLoading(true)
        try {
            // First, reauthenticate with current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user!.email!,
                password: currentPassword
            })

            if (signInError) {
                throw new Error("Current password is incorrect")
            }

            // Then update to new password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            toast.success("Password updated", {
                description: "Your password has been changed successfully."
            })
            setShowPasswordModal(false)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmNewPassword("")
        } catch (error) {
            toast.error("Failed to change password", {
                description: error instanceof Error ? error.message : "Please try again."
            })
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return

        setDeleteLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
                throw new Error("Not authenticated")
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hazlabel-production.up.railway.app"
            const response = await fetch(`${apiUrl}/account`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || "Failed to delete account")
            }

            // Sign out and redirect
            await supabase.auth.signOut()
            router.push("/login")
            toast.success("Account deleted", {
                description: "Your account and all data have been permanently removed.",
            })
        } catch (error) {
            toast.error("Failed to delete account", {
                description: error instanceof Error ? error.message : "Please try again or contact support.",
            })
        } finally {
            setDeleteLoading(false)
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

            {/* Subscription & Billing */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-reveal delay-350">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-50">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Subscription & Billing</h2>
                        <p className="text-sm text-slate-500">Manage your plan and payment details</p>
                    </div>
                </div>

                <SubscriptionManagement />
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
                    {/* Change Email */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-slate-900">Change Email</p>
                            <p className="text-sm text-slate-500">
                                Update your email address
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 gap-2"
                            onClick={() => setShowEmailModal(true)}
                        >
                            <Mail className="h-4 w-4" />
                            Change Email
                        </Button>
                    </div>

                    {/* Change Password */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-slate-900">Change Password</p>
                            <p className="text-sm text-slate-500">
                                Update your account password
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 gap-2"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            <Key className="h-4 w-4" />
                            Change Password
                        </Button>
                    </div>

                    {/* Delete Account */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-red-600">Delete Account</p>
                                <p className="text-sm text-slate-500">
                                    Permanently remove your account and all data
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Email Change Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
                        {!emailSent ? (
                            /* Step 1: Enter new email */
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-slate-900">Change Email Address</h3>
                                    <button onClick={closeEmailModal} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Current Email</Label>
                                        <Input
                                            value={user?.email || ""}
                                            disabled
                                            className="bg-slate-50 text-slate-500 h-9 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="newEmail" className="text-xs text-slate-600">New Email</Label>
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="new.email@example.com"
                                            className="border-slate-200 h-9 text-sm"
                                            onKeyDown={(e) => e.key === "Enter" && newEmail && handleEmailChange()}
                                        />
                                    </div>

                                    {/* How it works */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">How it works</p>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-bold mt-0.5">1</div>
                                                <p className="text-xs text-slate-600">We&apos;ll send a verification link to your <span className="font-medium">new email</span></p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
                                                <p className="text-xs text-slate-600">Click the link in the email to confirm</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-bold mt-0.5">3</div>
                                                <p className="text-xs text-slate-600">Your email will be updated automatically</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-1">
                                    <Button
                                        variant="outline"
                                        onClick={closeEmailModal}
                                        className="flex-1 h-9 text-sm"
                                        disabled={emailLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleEmailChange}
                                        disabled={!newEmail || emailLoading}
                                        className="flex-1 h-9 text-sm bg-sky-600 hover:bg-sky-700"
                                    >
                                        {emailLoading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Verification
                                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Step 2: Email sent — check your inbox */
                            <div className="space-y-4 text-center">
                                <div className="flex justify-center pt-1">
                                    <div className="h-14 w-14 rounded-full bg-sky-50 border-2 border-sky-200 flex items-center justify-center">
                                        <MailCheck className="h-7 w-7 text-sky-600" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-slate-900">Check Your Inbox</h3>
                                    <p className="text-sm text-slate-500">
                                        We sent a verification link to
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 bg-slate-50 rounded-md py-1.5 px-3 inline-block">
                                        {sentToEmail}
                                    </p>
                                </div>

                                {/* Instructions */}
                                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-left space-y-2.5">
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex-shrink-0 p-1 rounded-md bg-sky-100">
                                            <Mail className="h-3.5 w-3.5 text-sky-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-800">Open the email from HazLabel</p>
                                            <p className="text-[11px] text-slate-500">Check spam/junk if you don&apos;t see it</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex-shrink-0 p-1 rounded-md bg-sky-100">
                                            <MousePointerClick className="h-3.5 w-3.5 text-sky-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-800">Click &quot;Change Email&quot; in the email</p>
                                            <p className="text-[11px] text-slate-500">This confirms you own the new address</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex-shrink-0 p-1 rounded-md bg-sky-100">
                                            <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-800">You&apos;ll be redirected back here</p>
                                            <p className="text-[11px] text-slate-500">Your email updates instantly once confirmed</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1">
                                    <Button
                                        variant="outline"
                                        onClick={closeEmailModal}
                                        className="w-full h-9 text-sm"
                                    >
                                        Got it, I&apos;ll check my email
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false)
                                    setCurrentPassword("")
                                    setNewPassword("")
                                    setConfirmNewPassword("")
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <div className="space-y-1">
                                <Label htmlFor="currentPassword" className="text-xs text-slate-600">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="pr-10 h-9 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="newPassword" className="text-xs text-slate-600">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="pr-10 h-9 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="confirmNewPassword" className="text-xs text-slate-600">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmNewPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="pr-10 h-9 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Password must be at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPasswordModal(false)
                                    setCurrentPassword("")
                                    setNewPassword("")
                                    setConfirmNewPassword("")
                                }}
                                className="flex-1 h-9 text-sm"
                                disabled={passwordLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePasswordChange}
                                disabled={!currentPassword || !newPassword || !confirmNewPassword || passwordLoading}
                                className="flex-1 h-9 text-sm bg-sky-600 hover:bg-sky-700"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        Updating...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-red-100">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">Delete Account</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeleteConfirmText("")
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-red-800 mb-1.5">
                                    This action is permanent and cannot be undone.
                                </p>
                                <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
                                    <li>All your chemicals and labels will be deleted</li>
                                    <li>Your subscription will be cancelled immediately</li>
                                    <li>Your audit logs will be removed</li>
                                    <li>You will be signed out and unable to log back in</li>
                                </ul>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="deleteConfirm" className="text-xs text-slate-600">
                                    Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                                </Label>
                                <Input
                                    id="deleteConfirm"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE to confirm"
                                    className="border-slate-200 h-9 text-sm"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeleteConfirmText("")
                                }}
                                className="flex-1 h-9 text-sm"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                                className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete My Account
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
