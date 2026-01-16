"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Printer,
    FileText,
    Settings,
    Database,
    LogOut,
    ChevronRight,
    Search,
    Command
} from "lucide-react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"

const navItems = [
    {
        title: "Chemical Vault",
        url: "/inventory",
        icon: Database,
        description: "Manage chemicals"
    },
    {
        title: "Print Queue",
        url: "/print",
        icon: Printer,
        description: "Bulk label printing"
    },
    {
        title: "Audit Logs",
        url: "/logs",
        icon: FileText,
        description: "Activity history"
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        description: "Preferences"
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { user } = useUser()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = "/"
    }

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-slate-200 bg-white"
        >
            {/* Header */}
            <SidebarHeader className="p-4 border-b border-slate-100 group-data-[collapsible=icon]:hidden">
                <Link href="/inventory" className="flex items-center group">
                    <Image
                        src="/logo.png"
                        alt="HazLabel"
                        width={120}
                        height={30}
                        className="h-8 w-auto hover:scale-105 transition-all"
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {/* Search hint */}
                <div className="p-2 group-data-[collapsible=icon]:hidden">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-left">
                        <Search className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-500 flex-1">Search chemicals...</span>
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500">
                            <Command className="h-2.5 w-2.5" />K
                        </kbd>
                    </button>
                </div>

                {/* Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 pt-4 pb-2 group-data-[collapsible=icon]:hidden">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={cn(
                                                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item",
                                                isActive
                                                    ? "bg-sky-50 text-sky-700"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                            )}
                                        >
                                            <Link href={item.url}>
                                                {/* Active indicator */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sky-600" />
                                                )}

                                                <item.icon className={cn(
                                                    "h-5 w-5 shrink-0 transition-colors",
                                                    isActive ? "text-sky-600" : "text-slate-400 group-hover/item:text-slate-600"
                                                )} />

                                                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                                    <span className="font-medium">{item.title}</span>
                                                </div>

                                                {isActive && (
                                                    <ChevronRight className="h-4 w-4 text-sky-600 group-data-[collapsible=icon]:hidden" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-3 border-t border-slate-100">
                {/* User info */}
                {user && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 mb-2 group-data-[collapsible=icon]:hidden">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {user.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                )}

                {/* Sign out */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            tooltip="Sign Out"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium group-data-[collapsible=icon]:hidden">Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
