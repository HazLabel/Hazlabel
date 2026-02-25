"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Get initial user from server (not cached JWT)
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
            } catch (error) {
                console.error("Error getting user:", error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()

        // Listen for auth changes — fetch fresh server data instead of
        // using session.user which may have stale JWT claims (e.g. after email change)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!session) {
                    setUser(null)
                    setLoading(false)
                    return
                }
                // For sign-out, clear immediately
                if (event === "SIGNED_OUT") {
                    setUser(null)
                    setLoading(false)
                    return
                }
                // Fetch fresh user data from server
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth])

    return { user, loading, isAuthenticated: !!user }
}

// Helper to get user ID or throw
export function useUserId(): string | null {
    const { user } = useUser()
    return user?.id ?? null
}



