/**
 * Client-side Payment Orchestrator
 * Integrates Razorpay modal checkout and Dodo Payments redirect
 */

declare global {
  interface Window {
    Razorpay?: any
  }
}

export interface CheckoutParams {
  planTier?: "pro" | "enterprise"
  billingCycle?: "monthly" | "yearly"
  regionOverride?: "IN" | "GLOBAL"
  user?: {
    id: string
    email?: string
    full_name?: string
  } | null
  onSuccess?: () => void
  onError?: (error: Error) => void
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
 * Initiate checkout based on resolved region / gateway
 */
export async function initiateCheckout({
  planTier = "pro",
  billingCycle = "monthly",
  regionOverride,
  user,
  onSuccess,
  onError,
}: CheckoutParams): Promise<void> {
  try {
    if (!user) {
      window.location.href = `/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    // 1. Create checkout session from server
    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
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

    // ─── GATEWAY 1: RAZORPAY (INDIA / INR) ───
    if (data.gateway === "razorpay") {
      // Simulation mode (when API keys are not provided in dev/test)
      if (data.isSimulation) {
        console.log("Processing Razorpay checkout in Sandbox Simulation Mode...")
        const confirmRes = await fetch("/api/payments/confirm-simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gateway: "razorpay",
            planTier,
            billingCycle,
            region: "IN",
          }),
        })

        if (!confirmRes.ok) {
          throw new Error("Failed to complete simulation payment")
        }

        if (onSuccess) onSuccess()
        window.location.href = `/payment/success?gateway=razorpay&plan=${planTier}&cycle=${billingCycle}&amount=${data.amountDisplay}`
        return
      }

      // Real or Test Key Razorpay Checkout Modal
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Could not initialize Razorpay checkout. Please check your internet connection.")
      }

      const options = {
        key: data.keyId,
        amount: data.amount, // paise
        currency: "INR",
        name: "AIChartor",
        description: `Upgrade to ${planTier.toUpperCase()} Plan (${billingCycle})`,
        order_id: data.orderId,
        prefill: {
          name: user.full_name || "",
          email: user.email || "",
        },
        theme: {
          color: "#4f46e5", // Indigo theme
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay checkout modal closed by user")
          },
        },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            // Verify payment signature on backend
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planTier,
                billingCycle,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.error || "Payment verification failed")
            }

            if (onSuccess) onSuccess()
            window.location.href = `/payment/success?gateway=razorpay&order_id=${response.razorpay_order_id}`
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
      rzp.open()
      return
    }

    // ─── GATEWAY 2: DODO PAYMENTS (GLOBAL / USD) ───
    if (data.gateway === "dodo") {
      if (data.isSimulation) {
        // In simulation mode, confirm upgrade and route to success
        const confirmRes = await fetch("/api/payments/confirm-simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gateway: "dodo",
            planTier,
            billingCycle,
            region: "GLOBAL",
          }),
        })

        if (!confirmRes.ok) {
          throw new Error("Failed to complete simulation payment")
        }

        if (onSuccess) onSuccess()
        window.location.href = `/payment/success?gateway=dodo&plan=${planTier}&cycle=${billingCycle}&amount=${data.amount}`
        return
      }

      // Real Dodo Payments Redirect
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
