"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CreditCard,
  FileText,
  Loader2,
  XCircle,
  PlayCircle,
  ExternalLink,
  Download,
  ArrowUpCircle,
  RefreshCw
} from "lucide-react"

interface BillingDialogProps {
  subscription: {
    tier: string
    status: string
    renews_at?: string
    variant_id?: string
  }
  onUpdate?: () => void
}

interface Invoice {
  id: string
  status: string
  total: number
  currency: string
  created_at: string
  invoice_url: string
}

export function BillingDialog({ subscription, onUpdate }: BillingDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesLoaded, setInvoicesLoaded] = useState(false)

  const supabase = createClient()

  const fetchInvoices = async () => {
    if (invoicesLoaded) return

    setInvoicesLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/invoices`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setInvoicesLoaded(true)
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setInvoicesLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please sign in to manage your subscription")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to cancel subscription")
      }

      toast.success("Subscription Cancelled", {
        description: "Your subscription will remain active until the end of your billing period."
      })

      setCancelDialogOpen(false)
      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Cancel error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel subscription"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please sign in to manage your subscription")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/resume`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to resume subscription")
      }

      toast.success("Subscription Resumed", {
        description: "Your subscription has been reactivated."
      })

      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Resume error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to resume subscription"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayment = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please sign in to manage your subscription")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/update-payment-url`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to get payment update URL")
      }

      const { update_payment_url } = await response.json()
      window.open(update_payment_url, '_blank')
    } catch (error) {
      console.error("Payment update error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment method"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (variantId: string, planName: string) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please sign in to manage your subscription")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
      const response = await fetch(
        `${apiUrl}/subscription/change-plan?variant_id=${variantId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to change plan")
      }

      toast.success("Plan Updated", {
        description: `Switched to ${planName}. Changes take effect on next billing cycle.`
      })

      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Plan change error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to change plan"
      )
    } finally {
      setLoading(false)
    }
  }

  const isCancelled = subscription?.status === 'cancelled'

  // Plan configurations
  const plans = {
    professional: {
      monthly: { id: process.env.NEXT_PUBLIC_LEMON_VARIANT_PRO_MONTHLY || '1254588', name: 'Professional Monthly' },
      annual: { id: process.env.NEXT_PUBLIC_LEMON_VARIANT_PRO_ANNUAL || '1254589', name: 'Professional Annual' }
    },
    enterprise: {
      monthly: { id: process.env.NEXT_PUBLIC_LEMON_VARIANT_ENTERPRISE_MONTHLY || '1283714', name: 'Enterprise Monthly' },
      annual: { id: process.env.NEXT_PUBLIC_LEMON_VARIANT_ENTERPRISE_ANNUAL || '1283715', name: 'Enterprise Annual' }
    }
  }

  const currentVariantId = subscription?.variant_id
  const currentTier = subscription?.tier || 'free'

  // Determine current billing cycle
  const isMonthly = currentVariantId === plans.professional.monthly.id || currentVariantId === plans.enterprise.monthly.id
  const isAnnual = currentVariantId === plans.professional.annual.id || currentVariantId === plans.enterprise.annual.id

  // Available plan switches
  const availableSwitches = []

  if (currentTier === 'professional') {
    // Can switch between monthly/annual or upgrade to enterprise
    if (isMonthly) {
      availableSwitches.push({ ...plans.professional.annual, type: 'cycle', label: 'Switch to Annual (Save 17%)' })
    } else if (isAnnual) {
      availableSwitches.push({ ...plans.professional.monthly, type: 'cycle', label: 'Switch to Monthly' })
    }
    availableSwitches.push({
      ...(isMonthly ? plans.enterprise.monthly : plans.enterprise.annual),
      type: 'upgrade',
      label: 'Upgrade to Enterprise'
    })
  } else if (currentTier === 'enterprise') {
    // Can switch between monthly/annual
    if (isMonthly) {
      availableSwitches.push({ ...plans.enterprise.annual, type: 'cycle', label: 'Switch to Annual (Save 17%)' })
    } else if (isAnnual) {
      availableSwitches.push({ ...plans.enterprise.monthly, type: 'cycle', label: 'Switch to Monthly' })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300 hover:bg-slate-50"
            onClick={() => fetchInvoices()}
          >
            <CreditCard className="h-4 w-4" />
            Manage Billing
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Manage Billing</DialogTitle>
            <DialogDescription className="text-slate-500">
              Manage your subscription and billing details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Update Payment Method */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="p-2 rounded-lg bg-sky-100">
                <CreditCard className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm">Update Payment Method</h3>
                <p className="text-xs text-slate-500 mt-1">Change your credit card or payment details</p>
              </div>
              <Button
                onClick={handleUpdatePayment}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Plan Switching Options */}
            {availableSwitches.length > 0 && !isCancelled && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700 px-1">Change Plan</h3>
                {availableSwitches.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleChangePlan(plan.id, plan.name)}
                    disabled={loading}
                    className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`p-2 rounded-lg ${plan.type === 'upgrade' ? 'bg-violet-100' : 'bg-sky-100'}`}>
                      {plan.type === 'upgrade' ? (
                        <ArrowUpCircle className="h-5 w-5 text-violet-600" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-sky-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900 text-sm">{plan.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {plan.type === 'upgrade'
                          ? 'Get unlimited uploads and priority support'
                          : 'Changes take effect on next billing cycle'}
                      </p>
                    </div>
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400 shrink-0" />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Invoices */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Invoices</h3>
                </div>
                {invoicesLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {invoices.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No invoices yet</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            ${(invoice.total / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(invoice.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-md capitalize ${
                            invoice.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {invoice.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(invoice.invoice_url, '_blank')}
                          >
                            <Download className="h-4 w-4 text-slate-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cancel/Resume Subscription */}
            <div className="pt-2 border-t border-slate-200">
              {isCancelled ? (
                <Button
                  onClick={handleResumeSubscription}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      Resume Subscription
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Your subscription will remain active until{' '}
              {subscription?.renews_at && (
                <strong>
                  {new Date(subscription.renews_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </strong>
              )}
              . After that, you'll be downgraded to the free tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
