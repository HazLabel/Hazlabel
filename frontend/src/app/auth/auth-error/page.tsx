"use client"

import { AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function AuthErrorPage() {
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

                {/* Error icon */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-amber-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Authentication Error
                    </h1>
                    <p className="text-slate-600">
                        Something went wrong during verification. The link may have expired or already been used.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                    <p className="text-sm text-amber-800">
                        If you were trying to verify your email, try signing in again or request a new verification link from your Settings page.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        asChild
                        className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold gap-2"
                    >
                        <Link href="/login">
                            Go to Sign In
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="w-full h-11"
                    >
                        <Link href="/">
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
