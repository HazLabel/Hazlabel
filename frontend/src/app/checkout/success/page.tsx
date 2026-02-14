"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function CheckoutSuccessContent() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your subscription...')

    useEffect(() => {
        const verifySubscription = async () => {
            try {
                // Wait a bit for webhook to process
                await new Promise(resolve => setTimeout(resolve, 2000))

                const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
                const { createClient } = await import('@/utils/supabase/client')
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    setStatus('error')
                    setMessage('Please sign in to access your subscription.')
                    return
                }

                // Verify subscription was created
                const response = await fetch(`${apiUrl}/subscription/status`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.tier !== 'free') {
                        setStatus('success')
                        setMessage(`Successfully subscribed to ${data.tier}!`)

                        // Redirect to dashboard after 3 seconds
                        setTimeout(() => {
                            router.push('/(dashboard)/dashboard')
                        }, 3000)
                    } else {
                        // Subscription not yet processed, keep checking
                        setMessage('Processing your payment...')
                        setTimeout(verifySubscription, 3000)
                    }
                } else {
                    throw new Error('Failed to verify subscription')
                }
            } catch (error) {
                console.error('Verification error:', error)
                setStatus('error')
                setMessage('We encountered an issue verifying your subscription. Please contact support if this persists.')
            }
        }

        verifySubscription()
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Processing Payment
                            </h1>
                            <p className="text-slate-600 mb-6">
                                {message}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                <div className="h-2 w-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Welcome to HazLabel Professional!
                            </h1>
                            <p className="text-slate-600 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                Redirecting you to your dashboard...
                            </p>
                            <Button asChild className="w-full bg-sky-600 hover:bg-sky-700">
                                <Link href="/(dashboard)/dashboard">
                                    Go to Dashboard Now
                                </Link>
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Verification Issue
                            </h1>
                            <p className="text-slate-600 mb-6">
                                {message}
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button asChild className="w-full bg-sky-600 hover:bg-sky-700">
                                    <Link href="/(dashboard)/dashboard">
                                        Go to Dashboard
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="mailto:support@hazlabel.co">
                                        Contact Support
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Questions? Email us at{' '}
                    <a href="mailto:support@hazlabel.co" className="text-sky-600 hover:underline">
                        support@hazlabel.co
                    </a>
                </p>
            </div>
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Loading...
                        </h1>
                    </div>
                </div>
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    )
}
