"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"

export default function EmailChangedPage() {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [newEmail, setNewEmail] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        // Check session to confirm the email change went through
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                setStatus("error")
                return
            }

            setNewEmail(user.email || null)
            setStatus("success")
        }

        // Small delay so the loading state is visible
        const timer = setTimeout(checkSession, 1200)
        return () => clearTimeout(timer)
    }, [])

    // Countdown and auto-redirect once success
    useEffect(() => {
        if (status !== "success") return

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    router.push("/settings")
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [status, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-50 px-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center space-y-6">
                {/* Logo */}
                <div className="flex justify-center">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logo.png"
                            alt="HazLabel"
                            width={140}
                            height={35}
                            className="h-9 w-auto"
                        />
                    </Link>
                </div>

                {status === "loading" && (
                    <>
                        {/* Loading spinner */}
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-sky-50 border-2 border-sky-200 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Updating Your Email...
                            </h1>
                            <p className="text-slate-600">
                                Please wait while we confirm the change.
                            </p>
                        </div>

                        {/* Steps indicator */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <p className="text-sm text-slate-600">Verification link clicked</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                                    <Loader2 className="h-3.5 w-3.5 text-sky-600 animate-spin" />
                                </div>
                                <p className="text-sm text-slate-700 font-medium">Confirming email change...</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <span className="text-xs text-slate-400 font-bold">3</span>
                                </div>
                                <p className="text-sm text-slate-400">Redirect to settings</p>
                            </div>
                        </div>
                    </>
                )}

                {status === "success" && (
                    <>
                        {/* Success icon */}
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Email Changed Successfully
                            </h1>
                            <p className="text-slate-600">
                                Your email has been updated to:
                            </p>
                            {newEmail && (
                                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                                    <Mail className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-800">{newEmail}</span>
                                </div>
                            )}
                        </div>

                        {/* Steps completed */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <p className="text-sm text-slate-600">Verification link clicked</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <p className="text-sm text-slate-600">Email address updated</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                                    <Loader2 className="h-3.5 w-3.5 text-sky-600 animate-spin" />
                                </div>
                                <p className="text-sm text-slate-700 font-medium">Redirecting to settings...</p>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="space-y-3 pt-2">
                            <Button
                                asChild
                                className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold gap-2"
                            >
                                <Link href="/settings">
                                    Go to Settings
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <p className="text-xs text-slate-400">
                            Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        {/* Error state */}
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                                <Mail className="h-10 w-10 text-red-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Something Went Wrong
                            </h1>
                            <p className="text-slate-600">
                                We couldn&apos;t verify your email change. The link may have expired.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                            <p className="text-sm text-amber-800">
                                Try requesting a new email change from your Settings page. Verification links expire after 24 hours.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                asChild
                                className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold gap-2"
                            >
                                <Link href="/settings">
                                    Go to Settings
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full h-11"
                            >
                                <Link href="/login">
                                    Sign In Again
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
