"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function VerifiedPage() {
    const router = useRouter()

    useEffect(() => {
        // Auto-close tab after 5 seconds if opened in a new tab
        const timer = setTimeout(() => {
            if (window.opener) {
                window.close()
            }
        }, 5000)

        return () => clearTimeout(timer)
    }, [])

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
                            className="h-9 w-auto hover:scale-105 transition-all"
                        />
                    </Link>
                </div>

                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Email Verified! ✓
                    </h1>
                    <p className="text-slate-600">
                        Your account has been successfully verified.
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <p className="text-sm text-slate-700">
                        You can now close this page and sign in to your HazLabel account.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                    <Button
                        asChild
                        className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                    >
                        <Link href="/login">
                            Go to Sign In
                        </Link>
                    </Button>

                    <button
                        onClick={() => window.close()}
                        className="w-full h-12 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Close this page
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-slate-400 pt-4">
                    This page will automatically close in 5 seconds
                </p>
            </div>
        </div>
    )
}
