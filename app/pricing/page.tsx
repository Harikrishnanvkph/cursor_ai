"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { GeistSans } from "geist/font/sans"
import { useAuth } from "@/components/auth/AuthProvider"
import { HomeNewNavbar } from "@/components/home-new/home-new-navbar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Check,
  Zap,
  Cloud,
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
        className={`px-1.5 py-0.5 rounded font-bold text-[11px] sm:text-xs inline-block ${
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

  useEffect(() => {
    const bodyEl = document.body
    bodyEl.classList.add("home-page-active")

    return () => {
      bodyEl.classList.remove("home-page-active")
    }
  }, [])

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

  const litePriceLabel = `${currencySymbol}${isIndia ? 99 : 2}`
  const proPriceLabel = `${currencySymbol}${isIndia ? 249 : 5}`

  const faqs = [
    {
      question: "What is included for free on every account?",
      answer:
        "Every AIChartor user receives 10 Free AI Credits every month (auto-resetting every 30 days) and 5 Free Cloud Save Credits that never expire, along with full, unrestricted access to the Advanced Editor, sharing, and exports.",
    },
    {
      question: "Do purchased AI Credits ever expire?",
      answer:
        `No! Purchased AI Credits (+30 on the ${litePriceLabel} Lite pack or +100 on the ${proPriceLabel} Pro pack) never expire. Better yet, our system always consumes your 10 monthly free AI credits first before touching your purchased AI credits.`,
    },
    {
      question: "How does the +5 Cloud Save bonus on AI Credit packs work?",
      answer:
        `On your very first purchase of any AI Credits pack (${litePriceLabel} Lite or ${proPriceLabel} Pro), we permanently add +5 Cloud Save Credits to your account (bringing your permanent cloud saves from 5 to 10, which never expire). Repeat purchases of AI Credit packs grant the AI credits (+30 or +100) without adding additional permanent cloud credits.`,
    },
    {
      question: "How do the Cloud Credits packs work and what happens when they expire?",
      answer:
        `Cloud Credits packs give you extra cloud chart storage when you need it: +10 cloud save credits for 2 months (${litePriceLabel} Lite) or +15 cloud save credits for 6 months (${proPriceLabel} Pro). If a time-limited cloud pack expires, your existing saved charts are never deleted—you simply won't be able to save new cloud charts above your active limit until you top up or remove older charts.`,
    },
    {
      question: "Can I buy multiple credit packs?",
      answer:
        "Yes! All credit packs are one-time top-ups that stack automatically on your account. You can purchase AI Credits or Cloud Credits packs whenever you need more capacity.",
    },
  ]

  const highlights = [
    {
      icon: Globe,
      iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800/50",
      title: "AI Credits Never Expire",
      description:
        "Your 10 monthly free AI credits are always used first. Purchased AI credits stay in your balance forever until used.",
    },
    {
      icon: Terminal,
      iconClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-800/50",
      title: "Free Advanced Editor",
      description:
        "Every user gets complete access to our Advanced Editor, templates, sharing, and high-res exports.",
    },
    {
      icon: Clock,
      iconClass: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200/60 dark:border-sky-800/50",
      title: "No Recurring Lock-In",
      description:
        `Simple ${litePriceLabel} and ${proPriceLabel} one-time credit packs. Top up AI credits or cloud save slots whenever your workflow demands.`,
    },
  ]

  return (
    <div
      className={`home-new-container ${GeistSans.variable} ${GeistSans.className} font-sans min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-x-clip`}
    >
      {/* Subtle crisp grid matching / */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <HomeNewNavbar />

      <main className="relative z-10 flex-1">
        {/* ─── HERO HEADER SECTION ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-900/60 text-xs font-medium text-slate-700 dark:text-slate-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>One-Time Credit Packs</span>
            </span>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
              Simple, Transparent{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Start free every month, or top up AI and Cloud credits whenever you need.
            </p>

            {/* Category Switcher: AI Credits | Cloud Credits */}
            <div className="mt-6 inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 select-none">
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
        </section>

        {/* ─── 3-COLUMN PRICING CARDS SECTION: Free | Lite User | Pro User ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Column 1: Free Card */}
            <div className="rounded-2xl p-6 sm:p-7 flex flex-col justify-between bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{freeCard.userTitle}</h3>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {freeCard.badge}
                  </span>
                </div>

                <div className="mt-5 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight">{currencySymbol}0</span>
                </div>

                <div className="py-4 border-b border-slate-200/80 dark:border-slate-800">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {freeCard.headlineGrant}
                  </span>
                </div>

                <ul className="mt-5 space-y-3">
                  {freeCard.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={user ? "/landing" : "/signin"}
                  className="block text-center w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  {user ? "Included Free" : "Get Started Free"}
                </Link>
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
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-300 ${
                    isProPack
                      ? "bg-slate-900 text-white dark:bg-slate-900/95 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10"
                      : "bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-md"
                  }`}
                >
                  {isProPack && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                      {pack.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{pack.userTitle}</h3>
                      {!isProPack && pack.badge && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          {pack.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight">{currencySymbol}{displayPrice}</span>
                    </div>

                    <div className="py-4 border-b border-slate-200/80 dark:border-slate-800">
                      <span className={`text-base sm:text-lg font-bold ${isProPack ? "text-indigo-300" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {pack.headlineGrant}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {pack.features.map((feat, idx) => {
                        const alreadyClaimedBonus = feat.firstPurchaseOnly && firstAiBonusClaimed
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-xs">
                            <Check
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                isProPack ? "text-indigo-400" : "text-indigo-600 dark:text-indigo-400"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span
                                className={
                                  isProPack
                                    ? "text-slate-200 font-medium"
                                    : "text-slate-700 dark:text-slate-300 font-medium"
                                }
                              >
                                {renderFeatureText(feat.text, feat.highlightWord, isProPack)}
                              </span>
                              {alreadyClaimedBonus && (
                                <span className="text-[10.5px] text-emerald-500 font-semibold mt-0.5">
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
                    <button
                      type="button"
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={purchasingPackId !== null}
                      className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                        isProPack
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-[0.98]"
                      } disabled:opacity-60`}
                    >
                      {isBuyingThis ? "Processing..." : pack.ctaLabel}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom Request Banner */}
          <div className="max-w-6xl mx-auto mt-6 sm:mt-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="text-center sm:text-left">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {CUSTOM_REQUEST_CONFIG.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {CUSTOM_REQUEST_CONFIG.description}
                </p>
              </div>
              <div className="flex flex-col sm:items-end text-center sm:text-right shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {CUSTOM_REQUEST_CONFIG.contactLabel}
                </span>
                <a
                  href={`mailto:${CUSTOM_REQUEST_CONFIG.email}`}
                  className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {CUSTOM_REQUEST_CONFIG.email}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CORE VALUES & TRUST INDICATORS ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 flex gap-4 items-start shadow-2xs"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── INTERACTIVE FAQ SECTION ─── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
          <div className="text-center mb-10 sm:mb-12 space-y-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Everything you need to know about AI Credits, Cloud Save Credits, and first-purchase bonuses.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 text-left text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span className="pr-4 leading-snug">{faq.question}</span>
                    <span
                      className={`w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-200 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[300px] border-t border-slate-100 dark:border-slate-800" : "max-h-0"
                    }`}
                  >
                    <p className="px-5 py-4 sm:px-6 sm:py-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>© {new Date().getFullYear()} AIChartor. All rights reserved.</span>
            <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Theme</span>
            <ThemeToggle className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
