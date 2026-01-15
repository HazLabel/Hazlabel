"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Chemical } from "@/lib/types"
import { toast } from "sonner"
import { useEffect, useRef } from "react"
import { useUser } from "./use-user"

export function useChemicals() {
    const { user, loading: userLoading } = useUser()
    const previousStatusMap = useRef<Record<string, string>>({})

    const query = useQuery({
        queryKey: ["chemicals", user?.id],
        queryFn: async () => {
            if (!user?.id) {
                return []
            }
            const response = await api.get<Chemical[]>(`/chemicals`)
            return response.data
        },
        enabled: !!user?.id && !userLoading,
        // Poll every 5 seconds if any chemical is processing
        refetchInterval: (query) => {
            const hasProcessing = query.state.data?.some(c => c.status === "processing")
            return hasProcessing ? 5000 : 30000 // Poll slower if nothing is processing
        },
    })

    // Toast notification for completed jobs
    useEffect(() => {
        if (query.data) {
            query.data.forEach(chemical => {
                const prevStatus = previousStatusMap.current[chemical.id]
                if (prevStatus === "processing" && chemical.status === "completed") {
                    toast.success(`SDS Successfully Parsed`, {
                        description: `${chemical.name} is now available in your vault.`,
                        duration: 5000,
                    })
                } else if (prevStatus === "processing" && chemical.status === "failed") {
                    toast.error(`SDS Parsing Failed`, {
                        description: chemical.error_message || `Failed to parse ${chemical.name}`,
                    })
                }
                previousStatusMap.current[chemical.id] = chemical.status
            })
        }
    }, [query.data])

    return {
        ...query,
        isLoadingUser: userLoading
    }
}

// Hook for a single chemical
export function useChemical(chemicalId: string) {
    const { user, loading: userLoading } = useUser()

    return useQuery({
        queryKey: ["chemical", chemicalId, user?.id],
        queryFn: async () => {
            if (!user?.id || !chemicalId) {
                return null
            }
            const response = await api.get<Chemical>(`/chemicals/${chemicalId}`)
            return response.data
        },
        enabled: !!user?.id && !!chemicalId && !userLoading,
    })
}
