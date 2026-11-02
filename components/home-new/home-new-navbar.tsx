"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import {
  Sparkles,
  Sliders,
  LayoutDashboard,
  Palette,
  Search,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  BarChart2,
  PieChart,
  LineChart,
  Layers,
  CircleDot,
  Gauge,
  Target,
  Zap,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

interface ProductItem {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const PRODUCTS: ProductItem[] = [
  {
    title: "AI Chart Generator",
    description: "Prompt in, interactive visual out with live web data connection.",
    href: "/landing",
    icon: Sparkles,
    badge: "Popular",
  },
  {
    title: "Advanced Editor",
    description: "Pixel-perfect styling, typography, palettes, axes & layout controls.",
    href: "/editor",
    icon: Sliders,
  },
  {
    title: "Canvas Board",
    description: "Assemble multiple dynamic charts into a live shareable dashboard.",
    href: "/board",
    icon: LayoutDashboard,
  },
  {
    title: "Templates & Infographics",
    description: "Pre-crafted editorial infographic styles & presentation charts.",
    href: "#showcase-templates",
    icon: Palette,
  },
]

const QUICK_CHARTS = [
  { name: "Bar Chart & Stacked Bar", icon: BarChart2, href: "#showcase-charts" },
  { name: "Line & Area Chart", icon: LineChart, href: "#showcase-charts" },
  { name: "Pie & Donut Chart", icon: PieChart, href: "#showcase-charts" },
  { name: "Radar & Polar Chart", icon: Target, href: "#showcase-charts" },
  { name: "Gauge & KPI Visuals", icon: Gauge, href: "#showcase-charts" },
  { name: "Multi-Series Grouped", icon: Layers, href: "#showcase-charts" },
]

export function HomeNewNavbar() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Close products dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isAuthenticated = mounted && !!user
  // While the session is still being verified (and there is no cached user to show) we do not know yet
  // whether the visitor is signed in. Rendering "Sign in / Try for free" in that window is what made a
  // valid session look like it "authenticated late", so show a neutral placeholder instead.
  // The placeholder is capped (1.5s) so a slow/cold backend can never hide the sign-in buttons for long.
  const [placeholderExpired, setPlaceholderExpired] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setPlaceholderExpired(true), 1500)
    return () => clearTimeout(timer)
  }, [])
  const authResolved = mounted && (!loading || !!user || placeholderExpired)

  const handleNavigate = (href: string) => {
    setSearchOpen(false)
    setMobileMenuOpen(false)
    setProductsOpen(false)

    if (href.startsWith("#")) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      router.push(href)
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-black/[0.07] dark:border-white/[0.08] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]"
            : "bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.06]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* ── LEFT: Logo & Wordmark ── */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="flex items-center group transition-transform duration-200 active:scale-95"
              >
                <img
                  src="/images/new%20logo%20Text.png"
                  alt="AIChartor"
                  className="h-4 sm:h-[18px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:invert"
                />
              </Link>

              {/* ── DESKTOP NAV LINKS ── */}
              <nav className="hidden md:flex items-center space-x-1">
                {/* Products Dropdown (OpenAI-style mega flyout) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProductsOpen((prev) => !prev)}
                    onMouseEnter={() => setProductsOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13.5px] font-medium rounded-lg transition-colors duration-150 ${
                      productsOpen
                        ? "text-slate-950 bg-slate-100 dark:text-white dark:bg-slate-800"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>Products</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                        productsOpen ? "rotate-180 opacity-100" : ""
                      }`}
                    />
                  </button>

                  {/* Mega-menu Flyout */}
                  {productsOpen && (
                    <div
                      onMouseLeave={() => setProductsOpen(false)}
                      className="absolute top-full left-0 mt-2 w-[480px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {PRODUCTS.map((prod) => {
                          const Icon = prod.icon
                          return (
                            <Link
                              key={prod.title}
                              href={prod.href}
                              onClick={() => setProductsOpen(false)}
                              className="group flex flex-col p-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all duration-150"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-slate-200 group-hover:scale-105 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all">
                                    <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                  </div>
                                  <span className="text-[13.5px] font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {prod.title}
                                  </span>
                                </div>
                                {prod.badge && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-9">
                                {prod.description}
                              </p>
                            </Link>
                          )
                        })}
                      </div>

                      {/* Dropdown Footer Banner */}
                      <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 px-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          ✦ Powered by conversational charting engine
                        </span>
                        <button
                          onClick={() => {
                            setProductsOpen(false)
                            setSearchOpen(true)
                          }}
                          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <span>Explore all charts</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Scroll Link */}
                <button
                  onClick={() => handleNavigate("#showcase-ai-chat")}
                  className="px-3 py-1.5 text-[13.5px] font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  Features
                </button>

                {/* Charts Showcase Link */}
                <button
                  onClick={() => handleNavigate("#showcase-charts")}
                  className="px-3 py-1.5 text-[13.5px] font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  Charts
                </button>

                {/* Pricing Link */}
                <Link
                  href="/pricing"
                  className="px-3 py-1.5 text-[13.5px] font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  Pricing
                </Link>
              </nav>
            </div>

            {/* ── RIGHT: Search Icon + Auth ── */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* OpenAI-style Search (Only Icon) */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                title="Search charts (⌘K)"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Auth actions */}
              {!authResolved ? (
                <div
                  aria-hidden="true"
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className="hidden sm:block h-8 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                  <div className="h-8 w-24 sm:h-9 sm:w-28 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href={user?.is_admin ? "/admin" : "/board"}
                    className="hidden sm:inline-flex px-3 py-1.5 text-[13.5px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {user?.is_admin ? "Admin" : "Dashboard"}
                  </Link>
                  <SimpleProfileDropdown />
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/signin"
                    className="hidden sm:inline-flex px-3 py-1.5 text-[13.5px] font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>

                  {/* Primary Indigo Pill CTA */}
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 sm:px-4.5 sm:py-2 text-xs sm:text-[13px] font-semibold tracking-tight shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/35 transition-all duration-150 active:scale-95"
                  >
                    Try for free
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                aria-label="Open mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE SLIDE-DOWN DRAWER ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-black/[0.08] dark:border-white/[0.08] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-xl px-4 py-5 animate-in slide-in-from-top-2 duration-200">
            {/* Quick search input button inside mobile menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setSearchOpen(true)
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 opacity-70" />
                <span>Search charts & features...</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ⌘K
              </span>
            </button>

            {/* Products Group */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                Products
              </span>
              <div className="grid grid-cols-1 gap-1 pt-1 pb-2">
                {PRODUCTS.map((prod) => {
                  const Icon = prod.icon
                  return (
                    <Link
                      key={prod.title}
                      href={prod.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {prod.title}
                          </span>
                          {prod.badge && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              {prod.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Direct Section Links */}
            <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-2" />
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleNavigate("#showcase-ai-chat")}
                className="text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Features Showcase
              </button>
              <button
                onClick={() => handleNavigate("#showcase-charts")}
                className="text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Chart Visualizations
              </button>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Pricing & Plans
              </Link>
            </div>

            {/* Auth Actions in Mobile */}
            <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-3" />
            {!authResolved ? (
              <div aria-hidden="true" className="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  href={user?.is_admin ? "/admin" : "/board"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>Go to {user?.is_admin ? "Admin" : "Dashboard"}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm shadow-indigo-500/25 transition-all"
                >
                  Try for free
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── QUICK SEARCH COMMAND PALETTE (CMD+K / CTRL+K) ── */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type to search chart types, tools, or shortcuts..." />
        <CommandList className="max-h-[350px]">
          <CommandEmpty>No matching charts or features found.</CommandEmpty>

          <CommandGroup heading="Tools & Core Products">
            {PRODUCTS.map((prod) => {
              const Icon = prod.icon
              return (
                <CommandItem
                  key={prod.title}
                  onSelect={() => handleNavigate(prod.href)}
                  className="flex items-center gap-2.5 cursor-pointer py-2.5"
                >
                  <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {prod.title}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {prod.description}
                    </span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Chart Formats & Visualizations">
            {QUICK_CHARTS.map((chart) => {
              const Icon = chart.icon
              return (
                <CommandItem
                  key={chart.name}
                  onSelect={() => handleNavigate(chart.href)}
                  className="flex items-center gap-2.5 cursor-pointer py-2"
                >
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 text-sm">
                    {chart.name}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => handleNavigate("/pricing")}
              className="flex items-center gap-2.5 cursor-pointer py-2"
            >
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Pricing & Plans</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigate(authResolved && isAuthenticated ? "/board" : "/signin")}
              className="flex items-center gap-2.5 cursor-pointer py-2"
            >
              <span className="text-sm font-medium">
                {authResolved && isAuthenticated ? "My Dashboard" : "Sign In to Account"}
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
