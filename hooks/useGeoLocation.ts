"use client"

import { useState, useEffect, useCallback } from "react"

export type PaymentRegion = "IN" | "GLOBAL"
export type PaymentGateway = "razorpay" | "dodo"

export interface GeoLocationState {
  region: PaymentRegion
  isIndia: boolean
  gateway: PaymentGateway
  currency: "INR" | "USD"
  currencySymbol: "₹" | "$"
  detectedRegion: string
  isManualOverride: boolean
  loading: boolean
  setRegion: (region: PaymentRegion) => void
}

const STORAGE_KEY = "aichartor_payment_region"

export function useGeoLocation(): GeoLocationState {
  const [region, setRegionState] = useState<PaymentRegion>("GLOBAL")
  const [detectedRegion, setDetectedRegion] = useState<string>("GLOBAL")
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function detectLocation() {
      // 1. Check if user already has an explicit manual selection
      try {
        const savedRegion = localStorage.getItem(STORAGE_KEY) as PaymentRegion | null
        if (savedRegion === "IN" || savedRegion === "GLOBAL") {
          if (isMounted) {
            setRegionState(savedRegion)
            setIsManualOverride(true)
          }
        }
      } catch {
        // Ignore localStorage access issues
      }

      // 2. Fetch server detection from headers/IP
      try {
        const res = await fetch("/api/payments/config", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          const detected = data.detectedCountry || "GLOBAL"
          const isIndiaDetected = data.isIndia || detected === "IN"

          if (isMounted) {
            setDetectedRegion(detected)
            // If user hasn't manually overridden yet, use server detection
            const savedRegion = localStorage.getItem(STORAGE_KEY)
            if (!savedRegion) {
              setRegionState(isIndiaDetected ? "IN" : "GLOBAL")
            }
          }
          return
        }
      } catch (err) {
        console.warn("Could not fetch payment config, using client fallback:", err)
      }

      // 3. Client Timezone fallback if API is unreachable
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        const isIndiaTz = tz.includes("Kolkata") || tz.includes("Calcutta")
        if (isMounted) {
          const savedRegion = localStorage.getItem(STORAGE_KEY)
          if (!savedRegion) {
            setRegionState(isIndiaTz ? "IN" : "GLOBAL")
            setDetectedRegion(isIndiaTz ? "IN" : "GLOBAL")
          }
        }
      } catch {
        // Fallback to GLOBAL
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    detectLocation().finally(() => {
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const setRegion = useCallback((newRegion: PaymentRegion) => {
    setRegionState(newRegion)
    setIsManualOverride(true)
    try {
      localStorage.setItem(STORAGE_KEY, newRegion)
    } catch {
      // ignore
    }
  }, [])

  const isIndia = region === "IN"
  const gateway: PaymentGateway = isIndia ? "razorpay" : "dodo"
  const currency = isIndia ? "INR" : "USD"
  const currencySymbol = isIndia ? "₹" : "$"

  return {
    region,
    isIndia,
    gateway,
    currency,
    currencySymbol,
    detectedRegion,
    isManualOverride,
    loading,
    setRegion,
  }
}
