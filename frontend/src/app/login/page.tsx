"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, Github, Mail } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"

function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Get redirect URL from query params (default to /inventory)
    const redirectTo = searchParams.get('redirect') || '/inventory'

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

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                if (data.session) {
                    // If a session is returned, it might be a partial session or auto-confirmed.
                    // However, to enforce the "Check email" flow, we should sign them out or just NOT redirect
                    // if they need to verify.
                    // For now, let's toast success but stay on page if we want them to verify.
                    // If they are auto-confirmed, they can log in.
                    toast.success("Registration successful!", {
                        description: "Please check your email to verify your account before logging in."
                    })
                    setLoading(false)
                    setIsSignUp(false) // Switch to login view so they can sign in after verifying
                } else {
                    toast.success("Check your email", {
                        description: "We sent you a verification link."
                    })
                    setLoading(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
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

    const handleGithubAuth = async () => {
        // Include the redirect path in the callback URL
        const callbackUrl = new URL('/auth/callback', window.location.origin)
        callbackUrl.searchParams.set('redirect', redirectTo)

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: callbackUrl.toString(),
            },
        })
        if (error) {
            toast.error("GitHub login failed", { description: error.message })
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

                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                        <Button
                            variant="outline"
                            className="w-full h-12 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                            onClick={handleGithubAuth}
                        >
                            <Github className="h-5 w-5 mr-3" />
                            Continue with GitHub
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">or continue with email</span>
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
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                            />
                        </div>

                        {isSignUp && (
                            <div className="space-y-2 animate-reveal">
                                <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20"
                                />
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

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6 animate-reveal delay-200">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Terms</a>
                    {" "}and{" "}
                    <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Privacy Policy</a>
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
