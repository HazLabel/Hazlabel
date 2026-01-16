"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, Mail, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"

function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Get redirect URL from query params (default to /inventory)
    const redirectTo = searchParams.get('redirect') || '/inventory'

    // Password strength checker
    const checkPasswordStrength = (pwd: string) => {
        if (pwd.length === 0) {
            setPasswordStrength("")
            return
        }
        if (pwd.length < 8) {
            setPasswordStrength("weak")
            return
        }
        const hasUpper = /[A-Z]/.test(pwd)
        const hasLower = /[a-z]/.test(pwd)
        const hasNumber = /[0-9]/.test(pwd)
        const hasSpecial = /[!@#$%^&*]/.test(pwd)

        const strengthScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

        if (strengthScore === 4 && pwd.length >= 12) {
            setPasswordStrength("strong")
        } else if (strengthScore >= 3 && pwd.length >= 8) {
            setPasswordStrength("medium")
        } else {
            setPasswordStrength("weak")
        }
    }

    const handlePasswordChange = (value: string) => {
        setPassword(value)
        if (isSignUp) {
            checkPasswordStrength(value)
        }
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    toast.error("Passwords do not match", {
                        description: "Please make sure both passwords are the same."
                    })
                    setLoading(false)
                    return
                }

                if (!agreedToTerms) {
                    toast.error("Terms of Service", {
                        description: "Please agree to the Terms, Privacy Policy, and Safety Disclaimer to continue."
                    })
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                if (data.session) {
                    // If a session is returned, enforce email verification
                    toast.success("Registration successful!", {
                        description: "Please check your email to verify your account before logging in."
                    })
                    setLoading(false)
                    // Auto-switch to login view and pre-fill email
                    setIsSignUp(false)
                } else {
                    toast.success("Check your email", {
                        description: "We sent you a verification link."
                    })
                    setLoading(false)
                    // Auto-switch to login view and pre-fill email
                    setIsSignUp(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) {
                    // Check if error is due to unverified email
                    if (error.message.includes("Email not confirmed") || error.message.includes("verify")) {
                        toast.error("Email not verified", {
                            description: "Please verify your email before signing in. Check your inbox for the verification link."
                        })
                    } else {
                        throw error
                    }
                    setLoading(false)
                    return
                }
                toast.success("Welcome back!", {
                    description: "Redirecting to your vault..."
                })
                // Use router.push with a small delay to ensure session cookies are set
                setTimeout(() => {
                    router.push(redirectTo)
                    router.refresh()
                }, 100)
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred."
            toast.error(isSignUp ? "Registration Failed" : "Login Failed", {
                description: message
            })
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative px-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 hero-pattern" />
            <div className="absolute inset-0 grid-pattern opacity-30" />

            <div className="relative w-full max-w-md">


                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-10 animate-reveal delay-100">
                    {/* Header */}
                    <div className="text-center mb-8 space-y-4">
                        <Link href="/" className="inline-block group mx-auto">
                            <Image
                                src="/logo.png"
                                alt="HazLabel"
                                width={160}
                                height={40}
                                className="h-10 w-auto group-hover:scale-105 transition-all"
                            />
                        </Link>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {isSignUp ? "Create your account" : "Welcome back"}
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {isSignUp
                                    ? "Start automating GHS compliance today"
                                    : "Sign in to access your chemical vault"
                                }
                            </p>
                        </div>
                    </div>



                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 pl-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                                    Password
                                </Label>
                                {!isSignUp && (
                                    <Link
                                        href="#"
                                        className="text-sm text-sky-600 hover:text-sky-700 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                    className="h-12 pr-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {isSignUp && passwordStrength && (
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${passwordStrength === "weak"
                                                ? "w-1/3 bg-red-500"
                                                : passwordStrength === "medium"
                                                    ? "w-2/3 bg-amber-500"
                                                    : "w-full bg-emerald-500"
                                                }`}
                                        />
                                    </div>
                                    <span
                                        className={`font-medium ${passwordStrength === "weak"
                                            ? "text-red-600"
                                            : passwordStrength === "medium"
                                                ? "text-amber-600"
                                                : "text-emerald-600"
                                            }`}
                                    >
                                        {passwordStrength === "weak" && "Weak"}
                                        {passwordStrength === "medium" && "Medium"}
                                        {passwordStrength === "strong" && "Strong"}
                                    </span>
                                </div>
                            )}
                            {isSignUp && password.length > 0 && passwordStrength === "weak" && (
                                <p className="text-xs text-slate-500">
                                    Use 8+ characters with uppercase, lowercase, numbers & symbols
                                </p>
                            )}
                        </div>

                        {isSignUp && (
                            <div className="space-y-2 animate-reveal">
                                <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-12 pr-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isSignUp && (
                            <div className="flex items-center space-x-3 py-3 animate-reveal">
                                <Checkbox
                                    id="terms"
                                    checked={agreedToTerms}
                                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                    className="border-slate-300 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                />
                                <Label
                                    htmlFor="terms"
                                    className="text-sm text-slate-500 font-normal cursor-pointer select-none leading-relaxed"
                                >
                                    I agree to the <Link href="/terms" className="text-sky-600 hover:text-sky-700 font-medium inline">Terms of Service</Link>, <Link href="/privacy" className="text-sky-600 hover:text-sky-700 font-medium inline">Privacy Policy</Link>, and have read the <Link href="/disclaimer" className="text-sky-600 hover:text-sky-700 font-medium inline">Safety Disclaimer</Link>.
                                </Label>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-semibold mt-2 shadow-md shadow-sky-500/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? "Create Account" : "Sign In"}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        {isSignUp ? "Already have an account?" : "New to HazLabel?"}{" "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
                        >
                            {isSignUp ? "Sign in" : "Create account"}
                        </button>
                    </p>
                </div>


                {/* Footer Credits */}
                <p className="text-center text-xs text-slate-400 mt-8 animate-reveal delay-200">
                    © 2026 HazLabel. Built for safety professionals.
                </p>
            </div>
        </div>
    )
}

// Wrap in Suspense for useSearchParams
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
