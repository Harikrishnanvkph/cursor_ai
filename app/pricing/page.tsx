"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { SiteHeader } from "@/components/site-header"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Zap,
  Cloud,
  ArrowRight,
  ChevronDown,
  Globe,
  Terminal,
  Clock,
} from "lucide-react"
import { initiateCheckout } from "@/lib/payment-client"
import { useGeoLocation } from "@/hooks/useGeoLocation"
import {
  AI_CREDIT_PACKS,
  CLOUD_CREDIT_PACKS,
  FREE_CARD_BY_CATEGORY,
  CUSTOM_REQUEST_CONFIG,
  type CreditPackId,
} from "@/lib/subscription-config"

function renderFeatureText(text: string, highlightWord?: string, isProPack?: boolean) {
  if (!highlightWord || !text.includes(highlightWord)) {
    return text
  }
  const parts = text.split(highlightWord)
  return (
    <>
      {parts[0]}
      <span
        className={`px-1.5 py-0.5 rounded font-bold text-xs inline-block ${
          isProPack
            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
            : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60"
        }`}
      >
        {highlightWord}
      </span>
      {parts.slice(1).join(highlightWord)}
    </>
  )
}

export default function PricingPage() {
  const { user } = useAuth()
  const { region, isIndia, currencySymbol } = useGeoLocation()
  const [creditTab, setCreditTab] = useState<"ai" | "cloud">("ai")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [purchasingPackId, setPurchasingPackId] = useState<CreditPackId | null>(null)

  const firstAiBonusClaimed = Boolean(user?.first_ai_bonus_claimed)
  const freeCard = FREE_CARD_BY_CATEGORY[creditTab]
  const activePacks = creditTab === "ai" ? AI_CREDIT_PACKS : CLOUD_CREDIT_PACKS

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const handleBuyPack = async (packId: CreditPackId) => {
    if (!user) {
      window.location.href = "/signin?returnUrl=%2Fpricing"
      return
    }

    setPurchasingPackId(packId)
    try {
      await initiateCheckout({
        packId,
        planTier: packId.includes("pro") ? "pro" : "lite",
        billingCycle: "one_time",
        regionOverride: region,
        user,
        onError: (err) => {
          console.error("Payment error:", err)
          setPurchasingPackId(null)
          alert(err.message || "Failed to initiate payment")
        },
      })
    } catch (err: any) {
      console.error("Checkout initiation error:", err)
      setPurchasingPackId(null)
      alert(err.message || "Failed to initiate checkout")
    }
  }

  const faqs = [
    {
      question: "How many AI credits does each chart or template use?",
      answer:
        "Generating or modifying a Chart uses 1 AI credit. Generating or modifying a Template or Format layout (which generates multiple coordinated visual elements and structured text) uses 2 AI credits.",
    },
    {
      question: "What is included for free on every account?",
      answer:
        "Every AIChartor user receives 10 Free AI Credits every month (auto-resetting every 30 days) and 5 Free Cloud Save Credits that never expire, along with full, unrestricted access to the Advanced Editor, sharing, and exports.",
    },
    {
      question: "Do purchased AI Credits ever expire?",
      answer:
        "No! Purchased AI Credits (+30 on the $2 Lite pack or +100 on the $5 Pro pack) never expire. Better yet, our system always consumes your 10 monthly free AI credits first before touching your purchased AI credits.",
    },
    {
      question: "How does the +5 Cloud Save bonus on AI Credit packs work?",
      answer:
        "On your very first purchase of any AI Credits pack ($2 Lite or $5 Pro), we permanently add +5 Cloud Save Credits to your account (bringing your permanent cloud saves from 5 to 10, which never expire). Repeat purchases of AI Credit packs grant the AI credits (+30 or +100) without adding additional permanent cloud credits.",
    },
    {
      question: "How do the Cloud Credits packs work and what happens when they expire?",
      answer:
        "Cloud Credits packs give you extra cloud chart storage when you need it: +10 cloud save credits for 2 months ($2 Lite) or +15 cloud save credits for 6 months ($5 Pro). If a time-limited cloud pack expires, your existing saved charts are never deleted—you simply won't be able to save new cloud charts above your active limit until you top up or remove older charts.",
    },
    {
      question: "Can I buy multiple credit packs?",
      answer:
        "Yes! All credit packs are one-time top-ups that stack automatically on your account. You can purchase AI Credits or Cloud Credits packs whenever you need more capacity.",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <SiteHeader />

      {/* ─── HERO HEADER SECTION ─── */}
      <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-14 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-300">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float-slow absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px]" />
          <div className="animate-float-medium absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Credit Packs
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Start free every month, or top up AI and Cloud credits whenever you need.
          </p>

          {/* Category Switcher: AI Credits | Cloud Credits */}
          <div className="pt-3 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 select-none">
              <button
                type="button"
                onClick={() => setCreditTab("ai")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  creditTab === "ai"
                    ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${creditTab === "ai" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-neutral-500"}`} />
                <span>AI Credits</span>
              </button>
              <button
                type="button"
                onClick={() => setCreditTab("cloud")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  creditTab === "cloud"
                    ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Cloud className={`w-3.5 h-3.5 ${creditTab === "cloud" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-neutral-500"}`} />
                <span>Cloud Credits</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3-COLUMN PRICING CARDS SECTION: Free | Lite User | Pro User ─── */}
      <section className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Column 1: Free Card */}
            <div className="rounded-3xl flex flex-col justify-between p-8 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-lg">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{freeCard.userTitle}</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                    {freeCard.badge}
                  </span>
                </div>

                <div className="mt-6 pb-5 border-b border-slate-200/80 dark:border-slate-800 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight">{currencySymbol}0</span>
                </div>

                <div className="py-4 border-b border-slate-200/80 dark:border-slate-800">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {freeCard.headlineGrant}
                  </span>
                </div>

                <ul className="mt-6 space-y-3.5">
                  {freeCard.features.map((feat, fIndex) => (
                    <li key={fIndex} className="flex items-start text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mr-3 mt-0.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  asChild
                  className="w-full py-6 text-sm font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  <Link href={user ? "/landing" : "/signin"}>
                    {user ? "Included Free" : "Get Started Free"}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Columns 2 & 3: Lite User | Pro User */}
            {activePacks.map((pack) => {
              const isProPack = pack.popular
              const isBuyingThis = purchasingPackId === pack.id
              const displayPrice = isIndia ? (pack.priceInr || (pack.priceUsd === 2 ? 99 : 249)) : pack.priceUsd

              return (
                <div
                  key={pack.id}
                  className={`group relative rounded-3xl flex flex-col justify-between p-8 transition-all duration-300 ${
                    isProPack
                      ? "bg-slate-900 text-white dark:bg-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10"
                      : "bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-lg"
                  }`}
                >
                  {isProPack && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {pack.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{pack.userTitle}</h3>
                      {!isProPack && pack.badge && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                          {pack.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-6 pb-5 border-b border-slate-200/80 dark:border-slate-800 flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight">{currencySymbol}{displayPrice}</span>
                    </div>

                    <div className="py-4 border-b border-slate-200/80 dark:border-slate-800">
                      <span className={`text-lg font-bold ${isProPack ? "text-indigo-300" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {pack.headlineGrant}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3.5">
                      {pack.features.map((feat, fIndex) => {
                        const alreadyClaimedBonus = feat.firstPurchaseOnly && firstAiBonusClaimed
                        return (
                          <li key={fIndex} className="flex items-start text-sm">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mr-3 mt-0.5">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <div className="flex flex-col">
                              <span className={isProPack ? "text-slate-200 font-medium" : "text-slate-700 dark:text-slate-300 font-medium"}>
                                {renderFeatureText(feat.text, feat.highlightWord, isProPack)}
                              </span>
                              {alreadyClaimedBonus && (
                                <span className="text-xs text-emerald-500 font-semibold mt-0.5">
                                  ✓ Already claimed on first purchase
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4">
                    <Button
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={purchasingPackId !== null}
                      className={`w-full py-6 text-sm font-bold rounded-2xl transition-all duration-200 cursor-pointer ${
                        isProPack
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      }`}
                    >
                      {isBuyingThis ? (
                        "Processing..."
                      ) : (
                        <>
                          <span>{pack.ctaLabel}</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom Request Box */}
          <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {CUSTOM_REQUEST_CONFIG.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {CUSTOM_REQUEST_CONFIG.description}
              </p>
            </div>
            <div className="flex flex-col sm:items-end text-center sm:text-right shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {CUSTOM_REQUEST_CONFIG.contactLabel}
              </span>
              <a
                href={`mailto:${CUSTOM_REQUEST_CONFIG.email}`}
                className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
              >
                {CUSTOM_REQUEST_CONFIG.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CORE VALUES & TRUST INDICATORS ─── */}
      <section className="py-12 bg-slate-50/50 dark:bg-slate-900/30 transition-colors duration-300 relative border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-indigo-500">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">AI Credits Never Expire</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  Your 10 monthly free AI credits are always used first. Purchased AI credits stay in your balance forever until used.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-purple-500">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Free Advanced Editor</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  Every user gets complete access to our Advanced Editor, templates, sharing, and high-res exports.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-cyan-500">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No Recurring Lock-In</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  Simple $2 and $5 one-time credit packs. Top up AI credits or cloud save slots whenever your workflow demands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE FAQ SECTION ─── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <Badge className="px-3.5 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20 font-medium">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-light">
              Everything you need to know about AI Credits, Cloud Save Credits, and first-purchase bonuses.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 text-left font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors focus:outline-none"
                  >
                    <span className="pr-4 leading-snug">{faq.question}</span>
                    <span
                      className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[300px] border-t border-slate-100 dark:border-slate-800" : "max-h-0"
                    }`}
                  >
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-light">
            © {new Date().getFullYear()} AIChartor. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
