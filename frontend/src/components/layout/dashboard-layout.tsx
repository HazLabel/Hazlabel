"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/use-user"
import { UploadModal } from "@/components/inventory/upload-modal"

// Loading component to prevent hydration mismatch
function LoadingScreen({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
                <p className="text-sm text-slate-500">{message}</p>
            </div>
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useUser()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    // Track client-side mounting to prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Client-side auth guard (fallback for middleware)
    useEffect(() => {
        if (mounted && !loading && !user) {
            router.replace('/login')
        }
    }, [user, loading, router, mounted])

    // Always show loading on server and initial client render to prevent hydration mismatch
    if (!mounted || loading) {
        return <LoadingScreen />
    }

    // Don't render dashboard if not authenticated
    if (!user) {
        return <LoadingScreen message="Redirecting to login..." />
    }
    
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50 relative overflow-hidden">
                <div className="relative z-10 flex w-full">
                    <AppSidebar />

                    <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                        {/* Top Bar */}
                        <header className="z-40 w-full bg-white border-b border-slate-200 flex h-14 items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="text-slate-500 hover:text-slate-900 transition-colors" />
                            </div>

                            <div className="flex items-center gap-3">
                                <UploadModal />
                                
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-9 w-9"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-sky-500 rounded-full ring-2 ring-white" />
                                </Button>

                                <div className="h-6 w-px bg-slate-200 mx-1" />

                                {/* User Avatar */}
                                {user && (
                                    <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sky-500/20">
                                            {user.email?.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-sm font-medium text-slate-900 leading-tight">
                                                {user.email?.split('@')[0]}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                Pro Plan
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-auto">
                            <div className="max-w-7xl mx-auto w-full p-6 md:p-8">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}
