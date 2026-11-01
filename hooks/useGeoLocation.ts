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

const STORAGE_KEY = "aichartor_payment_region_v3"

export function useGeoLocation(): GeoLocationState {
  const [region, setRegionState] = useState<PaymentRegion>("IN")
  const [detectedRegion, setDetectedRegion] = useState<string>("IN")
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function detectLocation() {
      // 1. Detect browser timezone and offset (works accurately on localhost and production)
      let isIndiaBrowser = false
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        const offset = new Date().getTimezoneOffset()
        isIndiaBrowser = tz.includes("Kolkata") || tz.includes("Calcutta") || offset === -330
      } catch {
        // ignore
      }

      // 2. Check if user already has an explicit manual selection in localStorage
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

      // 3. Fetch server detection with client hint
      try {
        const clientCountryHint = isIndiaBrowser ? "IN" : "GLOBAL"
        const res = await fetch("/api/payments/config", {
          credentials: "include",
          headers: {
            "x-client-country": clientCountryHint,
          },
        })
        if (res.ok) {
          const data = await res.json()
          const detected = data.detectedCountry || (isIndiaBrowser ? "IN" : "GLOBAL")
          const isIndiaDetected = data.isIndia || detected === "IN" || isIndiaBrowser

          if (isMounted) {
            setDetectedRegion(detected)
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

      // 4. Client Timezone fallback if API is unreachable
      if (isMounted) {
        const savedRegion = localStorage.getItem(STORAGE_KEY)
        if (!savedRegion) {
          setRegionState(isIndiaBrowser ? "IN" : "GLOBAL")
          setDetectedRegion(isIndiaBrowser ? "IN" : "GLOBAL")
        }
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
