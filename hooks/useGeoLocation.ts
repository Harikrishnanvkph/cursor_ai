"use client"

import { useState, useEffect } from "react"

export type PaymentRegion = "IN" | "GLOBAL"
export type PaymentGateway = "razorpay" | "dodo"

function detectRegion(): PaymentRegion {
  if (typeof window === "undefined") return "IN"

  // 1. Localhost / local development -> Always India for Razorpay testing
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.endsWith(".local")
  if (isLocalhost) return "IN"

  // 2. Browser timezone & locale heuristics for India
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    const offset = new Date().getTimezoneOffset()
    const lang = (navigator.language || "").toUpperCase()
    if (
      tz.includes("Kolkata") ||
      tz.includes("Calcutta") ||
      offset === -330 ||
      lang.includes("-IN")
    ) {
      return "IN"
    }
  } catch {
    // ignore
  }

  return "GLOBAL"
}

export function useGeoLocation() {
  const [region, setRegion] = useState<PaymentRegion>("IN")

  useEffect(() => {
    // Clear any legacy manual override keys so stale preferences don't linger
    try {
      localStorage.removeItem("aichartor_payment_region")
      localStorage.removeItem("aichartor_payment_region_v4")
      localStorage.removeItem("aichartor_payment_region_is_manual_v4")
      localStorage.removeItem("aichartor_payment_region_v3")
    } catch {
      // ignore
    }

    const localDetected = detectRegion()
    setRegion(localDetected)

    // In production, sync with server header detection if not already detected as IN
    if (
      localDetected !== "IN" &&
      typeof window !== "undefined" &&
      !window.location.hostname.includes("localhost")
    ) {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
      fetch(`${serverUrl}/api/payments/config`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.isIndia || data?.detectedCountry === "IN") {
            setRegion("IN")
          }
        })
        .catch(() => {})
    }
  }, [])

  const isIndia = region === "IN"

  return {
    region,
    isIndia,
    gateway: (isIndia ? "razorpay" : "dodo") as PaymentGateway,
    currencySymbol: isIndia ? "₹" : "$",
  }
}
