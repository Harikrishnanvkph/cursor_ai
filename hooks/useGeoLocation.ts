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
    // 1. Detect browser timezone, offset, and locale (instant, 0 network requests)
    let isIndiaBrowser = false
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
      const offset = new Date().getTimezoneOffset()
      const lang = (navigator.language || "").toUpperCase()
      isIndiaBrowser =
        tz.includes("Kolkata") ||
        tz.includes("Calcutta") ||
        offset === -330 ||
        lang.includes("-IN")
    } catch {
      // ignore
    }

    const detected: PaymentRegion = isIndiaBrowser ? "IN" : "GLOBAL"
    setDetectedRegion(detected)

    // 2. Respect explicit manual selection in localStorage if present
    try {
      const savedRegion = localStorage.getItem(STORAGE_KEY) as PaymentRegion | null
      if (savedRegion === "IN" || savedRegion === "GLOBAL") {
        setRegionState(savedRegion)
        setIsManualOverride(true)
      } else {
        setRegionState(detected)
      }
    } catch {
      setRegionState(detected)
    }

    setLoading(false)
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
