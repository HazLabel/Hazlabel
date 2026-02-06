import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"

interface SubscriptionStatus {
  tier: 'free' | 'professional' | 'enterprise' | 'unknown'
  status: string | null
  variant_id: string | null
  renews_at: string | null
  ends_at: string | null
  monthly_uploads?: number
  upload_limit?: number
}

export function useSubscription() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        return {
          tier: 'free',
          status: null,
          variant_id: null,
          renews_at: null,
          ends_at: null,
          monthly_uploads: 0,
          upload_limit: 2
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      return response.json()
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
