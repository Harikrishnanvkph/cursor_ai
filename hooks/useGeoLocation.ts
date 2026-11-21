"use client"

import { useState, useEffect, useLayoutEffect } from "react"

export type PaymentRegion = "IN" | "GLOBAL"
export type PaymentGateway = "razorpay" | "dodo"

const REGION_COOKIE_NAME = "aichartor_region"
const REGION_SESSION_KEY = "aichartor_region_session_v1"

// Module-level singleton state so all hook consumers share one detection result
// without repeating storage writes or network requests across mounts.
let cachedRegion: PaymentRegion | null = null
let authoritativeResolved = false
let inFlightServerCheck: Promise<PaymentRegion | null> | null = null
let legacyStorageCleaned = false
const subscribers = new Set<(region: PaymentRegion) => void>()

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

function notifySubscribers(nextRegion: PaymentRegion) {
  for (const listener of subscribers) {
    listener(nextRegion)
  }
}

function cleanLegacyLocalStorageOnce() {
  if (legacyStorageCleaned || typeof window === "undefined") return
  legacyStorageCleaned = true
  try {
    localStorage.removeItem("aichartor_payment_region")
    localStorage.removeItem("aichartor_payment_region_v4")
    localStorage.removeItem("aichartor_payment_region_is_manual_v4")
    localStorage.removeItem("aichartor_payment_region_v3")
  } catch {
    // ignore storage errors in restricted environments
  }
}

function readRegionCookie(): PaymentRegion | null {
  if (typeof document === "undefined") return null
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${REGION_COOKIE_NAME}=(IN|GLOBAL)(?:;|$)`)
    )
    if (match && (match[1] === "IN" || match[1] === "GLOBAL")) {
      return match[1]
    }
  } catch {
    // ignore
  }
  return null
}

function readSessionCachedRegion(): PaymentRegion | null {
  if (typeof window === "undefined") return null
  try {
    const val = sessionStorage.getItem(REGION_SESSION_KEY)
    if (val === "IN" || val === "GLOBAL") return val
  } catch {
    // ignore
  }
  return null
}

function writeSessionCachedRegion(region: PaymentRegion) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(REGION_SESSION_KEY, region)
  } catch {
    // ignore
  }
}

function isLocalhostEnvironment(): boolean {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".local")
  )
}

/**
 * Synchronous client region resolution:
 * 1. In-memory singleton cache
 * 2. Edge Middleware cookie (`aichartor_region` derived from `x-vercel-ip-country` / `cf-ipcountry`)
 * 3. Localhost -> "IN" (for local Razorpay testing)
 * 4. SessionStorage cache (from one-time server verification)
 * 5. Strict IANA timezone fallback (`Asia/Kolkata` or `Asia/Calcutta` only — avoids `offset === -330`
 *    which falsely matches Sri Lanka `Asia/Colombo`, and avoids `lang.includes("-IN")` for NRIs abroad)
 */
function resolveClientRegionSync(): PaymentRegion {
  if (typeof window === "undefined") return "GLOBAL"
  if (cachedRegion) return cachedRegion

  cleanLegacyLocalStorageOnce()

  // 1. Authoritative Edge Middleware cookie
  const cookieRegion = readRegionCookie()
  if (cookieRegion) {
    cachedRegion = cookieRegion
    authoritativeResolved = true
    return cookieRegion
  }

  // 2. Local development -> Always India for Razorpay testing
  if (isLocalhostEnvironment()) {
    cachedRegion = "IN"
    authoritativeResolved = true
    return "IN"
  }

  // 3. Previously verified in this browser session
  const sessionRegion = readSessionCachedRegion()
  if (sessionRegion) {
    cachedRegion = sessionRegion
    authoritativeResolved = true
    return sessionRegion
  }

  // 4. Strict IANA timezone heuristic (optimistic until one-time server check completes)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") {
      cachedRegion = "IN"
      return "IN"
    }
  } catch {
    // ignore
  }

  cachedRegion = "GLOBAL"
  return "GLOBAL"
}

/**
 * Fallback server verification:
 * Runs at most ONCE per browser tab session, and ONLY when neither the Edge Middleware cookie
 * nor localhost detection is available. Reconciles both IN -> GLOBAL and GLOBAL -> IN.
 */
function verifyRegionWithServerOnce(): Promise<PaymentRegion | null> {
  if (authoritativeResolved || typeof window === "undefined") {
    return Promise.resolve(cachedRegion)
  }
  if (inFlightServerCheck) {
    return inFlightServerCheck
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
  inFlightServerCheck = fetch(`${serverUrl}/api/payments/config`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data) return null
      const serverRegion: PaymentRegion =
        data.isIndia || data.detectedCountry === "IN" ? "IN" : "GLOBAL"
      cachedRegion = serverRegion
      authoritativeResolved = true
      writeSessionCachedRegion(serverRegion)
      notifySubscribers(serverRegion)
      return serverRegion
    })
    .catch(() => null)
    .finally(() => {
      inFlightServerCheck = null
    })

  return inFlightServerCheck
}

export function useGeoLocation() {
  // Deterministic initial value so SSR HTML and initial client hydration always match (no React 19 hydration mismatch).
  // `useIsomorphicLayoutEffect` immediately applies the cached/cookie region before the browser paints.
  const [region, setRegion] = useState<PaymentRegion>("GLOBAL")

  useIsomorphicLayoutEffect(() => {
    const resolved = resolveClientRegionSync()
    setRegion(resolved)

    subscribers.add(setRegion)
    if (!authoritativeResolved) {
      verifyRegionWithServerOnce()
    }

    return () => {
      subscribers.delete(setRegion)
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
