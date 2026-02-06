"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap, Shield, Sparkles } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

interface UpgradeModalProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UpgradeModal({ trigger, open, onOpenChange }: UpgradeModalProps) {
    const { user } = useUser()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

    const checkoutUrls = {
        pro: {
            monthly: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO_MONTHLY,
            annual: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO_ANNUAL
        },
        enterprise: {
            monthly: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_MONTHLY,
            annual: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE_ANNUAL
        }
    }

    const getCheckoutUrl = (type: 'pro' | 'enterprise') => {
        const baseUrl = checkoutUrls[type][billingCycle]
        if (!baseUrl || baseUrl === "#") return "#"
        return `${baseUrl}${user?.id ? `?checkout[custom][user_id]=${user.id}` : ''}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl sm:rounded-3xl">
                <div className="grid lg:grid-cols-5 h-full">
                    {/* Left side: Marketing */}
                    <div className="lg:col-span-2 bg-slate-900 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -tr-1/4 w-64 h-64 bg-sky-500/10 blur-3xl rounded-full" />
                        <div className="absolute bottom-0 left-0 tr-1/4 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider mb-6">
                                <Sparkles className="h-3 w-3" />
                                Premium Access
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Unlock Industrial Power</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Upgrade your account to access our most advanced GHS Revision 11 validation engine and bulk processing tools.
                            </p>

                            <ul className="space-y-4">
                                <FeatureItem text="Unlimited SDS Parsing" />
                                <FeatureItem text="Bulk PDF Generation" />
                                <FeatureItem text="Revision History & Tracking" />
                                <FeatureItem text="Priority Processing" />
                                <FeatureItem text="Team Collaboration" />
                            </ul>
                        </div>

                        <div className="relative z-10 pt-12">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                Trusted by industrial safety teams worldwide
                            </p>
                        </div>
                    </div>

                    {/* Right side: Pricing Plans */}
                    <div className="lg:col-span-3 p-8 bg-white">
                        <div className="flex flex-col items-center mb-8">
                            <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl mb-2">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        billingCycle === 'monthly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                                        billingCycle === 'annual' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    Annual
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md">-20%</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Pro Plan */}
                            <PlanCard
                                icon={<Zap className="h-5 w-5 text-sky-500" />}
                                title="Professional"
                                price={billingCycle === 'monthly' ? "99" : "79"}
                                interval="/mo"
                                description="Best for active facilities"
                                features={["10,000 parses/mo", "Bulk printing", "Priority email"]}
                                checkoutUrl={getCheckoutUrl('pro')}
                            />

                            {/* Enterprise Plan */}
                            <PlanCard
                                icon={<Shield className="h-5 w-5 text-violet-500" />}
                                title="Enterprise"
                                price={billingCycle === 'monthly' ? "299" : "239"}
                                interval="/mo"
                                description="For global organizations"
                                features={["40,000 parses/mo", "Full API access", "SSO & Custom MFA"]}
                                checkoutUrl={getCheckoutUrl('enterprise')}
                                highlighted
                            />
                        </div>

                        <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
                            Payments are securely processed by Lemon Squeezy. <br />
                            Cancel or change plans at any time from your settings.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
            {text}
        </li>
    )
}

function PlanCard({
    icon,
    title,
    price,
    interval,
    description,
    features,
    checkoutUrl,
    highlighted = false
}: {
    icon: React.ReactNode
    title: string
    price: string
    interval: string
    description: string
    features: string[]
    checkoutUrl: string
    highlighted?: boolean
}) {
    return (
        <div className={cn(
            "p-5 rounded-2xl border flex flex-col h-full transition-all",
            highlighted ? "border-sky-500 bg-sky-50/30 ring-1 ring-sky-500/20" : "border-slate-100 hover:border-slate-200"
        )}>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="font-bold text-slate-900">{title}</span>
            </div>

            <div className="mb-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">${price}</span>
                    <span className="text-xs text-slate-500 font-medium">{interval}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{description}</p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>

            <Button asChild className={cn(
                "w-full h-9 text-xs font-bold rounded-lg shadow-sm transition-all",
                highlighted
                    ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                    Select Plan
                </a>
            </Button>
        </div>
    )
}
