import React from "react"
import Link from "next/link"
import { ArrowLeft, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LegalLayout({ children, title, icon: Icon }: { children: React.ReactNode, title: string, icon: LucideIcon }) {
    return (
        <div className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 flex items-center justify-between">
                    <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                        <Link href="/terms" className="hover:text-sky-600 transition-colors">Terms</Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy</Link>
                        <span>•</span>
                        <Link href="/disclaimer" className="hover:text-sky-600 transition-colors">Safety Disclaimer</Link>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="bg-slate-900 p-8 md:p-12 text-white">
                        <div className="inline-flex p-3 rounded-2xl bg-white/10 mb-6">
                            <Icon className="h-8 w-8 text-sky-400" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            {title}
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Last updated: January 16, 2026
                        </p>
                    </div>

                    <div className="p-8 md:p-12 prose prose-slate max-w-none">
                        {children}
                    </div>
                </div>

                <div className="mt-12 text-center text-slate-500 text-sm">
                    <p>© 2026 HazLabel. All rights reserved.</p>
                    <p className="mt-2 text-xs">HazLabel is a precision compliance engine. Use responsibly.</p>
                </div>
            </div>
        </div>
    )
}
