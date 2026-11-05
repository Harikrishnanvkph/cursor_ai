/**
 * Client-side Payment Orchestrator
 * Integrates Dodo Payments redirect, Razorpay modal checkout, and Simulation mode for Credit Packs
 */

import type { CreditPackId } from "./subscription-config"

declare global {
  interface Window {
    Razorpay?: any
  }
}

export interface CheckoutParams {
  packId?: CreditPackId
  planTier?: "lite" | "pro" | "enterprise"
  billingCycle?: "one_time" | "monthly" | "yearly"
  regionOverride?: "IN" | "GLOBAL"
  user?: {
    id: string
    email?: string
    full_name?: string
  } | null
  onSuccess?: () => void
  onError?: (error: Error) => void
  /** Called right before the Razorpay modal opens (e.g. to close a host dialog that would trap focus) */
  onBeforeOpen?: () => void
}

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
}

/**
 * Dynamically load Razorpay standard checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if (window.Razorpay) return resolve(true)

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK script")
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Initiate checkout for a selected credit pack ('ai_lite' | 'ai_pro' | 'cloud_lite' | 'cloud_pro')
 */
export async function initiateCheckout({
  packId = "ai_pro",
  planTier = "pro",
  billingCycle = "one_time",
  regionOverride = "GLOBAL",
  user,
  onSuccess,
  onError,
  onBeforeOpen,
}: CheckoutParams): Promise<void> {
  try {
    if (!user) {
      window.location.href = `/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    const effectivePackId: CreditPackId = packId || (planTier === "lite" ? "ai_lite" : "ai_pro")

    // 1. Create checkout session from server
    const res = await fetch(`${getBaseUrl()}/api/payments/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        packId: effectivePackId,
        planTier,
        billingCycle,
        regionOverride,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || "Failed to create checkout session")
    }

    const data = await res.json()

    // ─── GATEWAY 1: RAZORPAY (WHEN ENABLED) ───
    if (data.gateway === "razorpay") {
      if (data.isSimulation) {
        const confirmRes = await fetch(`${getBaseUrl()}/api/payments/confirm-simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gateway: "razorpay",
            packId: effectivePackId,
            planTier,
            billingCycle,
            region: "GLOBAL",
            sessionId: data.orderId,
          }),
        })

        if (!confirmRes.ok) {
          throw new Error("Failed to complete simulation payment")
        }

        if (onSuccess) onSuccess()
        window.location.href = `/payment/success?gateway=razorpay&pack=${effectivePackId}&amount=${data.amountDisplay}`
        return
      }

      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Could not initialize Razorpay checkout. Please check your internet connection.")
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "USD",
        name: "AIChartor",
        description: `Credit Pack (${effectivePackId.toUpperCase()})`,
        order_id: data.orderId,
        prefill: {
          name: user.full_name || "",
          email: user.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: () => {
            if (onError) onError(new Error("Payment cancelled by user"))
          },
        },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch(`${getBaseUrl()}/api/payments/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                packId: effectivePackId,
                planTier,
                billingCycle,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.error || "Payment verification failed")
            }

            if (onSuccess) onSuccess()
            window.location.href = `/payment/success?gateway=razorpay&pack=${effectivePackId}&order_id=${response.razorpay_order_id}&amount=${data.amountDisplay}`
          } catch (err: any) {
            console.error("Verification error:", err)
            if (onError) onError(err)
            else alert(err.message || "Payment verification failed")
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (failedRes: any) => {
        console.error("Payment failed:", failedRes.error)
        window.location.href = `/payment/cancel?reason=${encodeURIComponent(failedRes.error?.description || "Payment failed")}`
      })
      if (onBeforeOpen) onBeforeOpen()
      rzp.open()
      return
    }

    // ─── GATEWAY 2: DODO PAYMENTS (USD) ───
    if (data.gateway === "dodo") {
      if (data.isSimulation) {
        const confirmRes = await fetch(`${getBaseUrl()}/api/payments/confirm-simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gateway: "dodo",
            packId: effectivePackId,
            planTier,
            billingCycle: "one_time",
            region: "GLOBAL",
            sessionId: data.sessionId,
          }),
        })

        if (!confirmRes.ok) {
          throw new Error("Failed to complete simulation payment")
        }

        if (onSuccess) onSuccess()
        window.location.href = `/payment/success?gateway=dodo&pack=${effectivePackId}&amount=${data.amount}`
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error("Missing checkout URL from Dodo Payments")
      }
    }
  } catch (error: any) {
    console.error("Checkout error:", error)
    if (onError) onError(error)
    else alert(error.message || "Unable to proceed to checkout")
  }
}
