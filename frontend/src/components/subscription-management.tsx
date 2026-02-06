"use client"

import { useSubscription } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Loader2, Sparkles, TrendingUp } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"

export function SubscriptionManagement() {
  const { data: subscription, isLoading } = useSubscription()
  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Please sign in to manage your subscription")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/portal`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to get portal URL")
      }

      const { portal_url } = await response.json()
      window.open(portal_url, '_blank')
    } catch (error) {
      console.error("Portal error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to open subscription portal"
      )
    } finally {
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const tierDisplay = {
    free: {
      label: "Free",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      gradient: "from-slate-600 to-slate-700"
    },
    professional: {
      label: "Professional",
      color: "bg-sky-100 text-sky-700 border-sky-200",
      gradient: "from-sky-600 to-cyan-600"
    },
    enterprise: {
      label: "Enterprise",
      color: "bg-violet-100 text-violet-700 border-violet-200",
      gradient: "from-violet-600 to-purple-600"
    },
    unknown: {
      label: "Unknown",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      gradient: "from-slate-600 to-slate-700"
    }
  }

  const currentTier = tierDisplay[subscription?.tier || 'free']
  const isFree = subscription?.tier === 'free'
  const uploadCount = subscription?.monthly_uploads || 0
  const uploadLimit = subscription?.upload_limit || 2

  // Calculate upload percentage for progress bar
  const uploadPercentage = Math.min((uploadCount / uploadLimit) * 100, 100)
  const isNearLimit = uploadPercentage >= 80

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
            <div className="flex items-center gap-3">
              <Badge className={`${currentTier.color} border font-semibold px-3 py-1`}>
                {currentTier.label}
              </Badge>
              {subscription?.status && subscription.status !== 'active' && (
                <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                  {subscription.status}
                </span>
              )}
            </div>
          </div>

          {isFree ? (
            <Button
              asChild
              size="sm"
              className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90 text-white gap-2 shadow-md`}
            >
              <Link href="/pricing">
                <Sparkles className="h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 hover:bg-slate-50"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          )}
        </div>

        {/* Upload Usage Meter */}
        {(isFree || uploadLimit < 1000) && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Monthly Uploads</span>
              <span className={`font-semibold ${isNearLimit ? 'text-amber-600' : 'text-slate-900'}`}>
                {uploadCount} / {uploadLimit}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isNearLimit
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-sky-500 to-cyan-500'
                }`}
                style={{ width: `${uploadPercentage}%` }}
              />
            </div>

            {isNearLimit && isFree && (
              <div className="flex items-start gap-2 p-3 mt-2 bg-amber-50 border border-amber-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold mb-1">Approaching your free tier limit</p>
                  <p className="text-amber-700">
                    Upgrade to Professional for {subscription?.tier === 'professional' ? '200' : '15,000'} uploads/month
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Renewal Info */}
        {!isFree && subscription?.renews_at && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {subscription.status === 'cancelled' ? 'Expires' : 'Renews'} on{' '}
              <span className="font-medium text-slate-700">
                {new Date(subscription.renews_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Upgrade Benefits (Only for free users) */}
      {isFree && (
        <div className="p-4 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg border border-sky-200">
          <p className="text-sm font-semibold text-sky-900 mb-2">Upgrade Benefits</p>
          <ul className="space-y-1.5 text-xs text-sky-800">
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-sky-600" />
              200+ SDS uploads per month
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-sky-600" />
              Unlimited PDF downloads
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-sky-600" />
              GHS Revision 11 validation
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-sky-600" />
              Priority email support
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
