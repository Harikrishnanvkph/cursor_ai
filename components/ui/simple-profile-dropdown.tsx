"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  LogOut,
  BookOpen,
  DollarSign,
  Settings as SettingsIcon,
  Zap,
  Cloud,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useGeoLocation } from "@/hooks/useGeoLocation"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { UserAvatar } from "./user-avatar"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { cn } from "@/lib/utils"

interface SimpleProfileDropdownProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'avatar'
  className?: string
  showNavigation?: boolean
  customNavigationItems?: Array<{
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    iconColor?: string
  }>
}

export function SimpleProfileDropdown({
  size = 'md',
  variant = 'button',
  className,
  showNavigation = true,
  customNavigationItems
}: SimpleProfileDropdownProps) {
  const { signOut } = useAuth()
  const { isIndia, currencySymbol } = useGeoLocation()
  const {
    user,
    isPro,
    isLite,
    aiCreditsLimit,
    aiCreditsRemaining,
    freeAiCreditsRemaining,
    purchasedAiCredits,
    cloudChartsLimit: cloudLimit,
    savedChartsCount: cloudCount,
    permanentCloudCredits,
    bonusCloudCredits,
  } = useSubscriptionQuota()
  const [open, setOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  const defaultNavigationItems = [
    {
      href: "/about",
      label: "About",
      icon: User
    },
    {
      href: "/documentation",
      label: "Documentation",
      icon: BookOpen
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: DollarSign
    }
  ]

  const navigationItems = customNavigationItems || defaultNavigationItems

  const aiCreditPercent =
    aiCreditsLimit > 0
      ? Math.max(0, Math.min(100, Math.round((aiCreditsRemaining / aiCreditsLimit) * 100)))
      : 0
  const cloudPercent =
    cloudLimit > 0
      ? Math.max(0, Math.min(100, Math.round((cloudCount / cloudLimit) * 100)))
      : 0

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Account"
  const tierLabel = isPro ? "PRO" : isLite ? "LITE" : "FREE"
  const tierBadgeClass = isPro
    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70"
    : isLite
      ? "bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/70"
      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              "relative inline-flex items-center justify-center align-middle leading-none p-0 rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 cursor-pointer",
              variant === 'button' ? "overflow-hidden" : "",
              className
            )}
          >
            <UserAvatar size={size} showBorder showHover />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="w-72 p-0 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-8px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.05)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] rounded-2xl z-[100] font-sans overflow-hidden"
        >
          {/* 1. Identity Header */}
          <div className="px-3.5 py-3 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center gap-3">
            <UserAvatar
              size="md"
              showHover={false}
              className="h-9 w-9 shrink-0 ring-1 ring-slate-200/80 dark:ring-slate-700/80"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
                  {displayName}
                </p>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 leading-none",
                    tierBadgeClass
                  )}
                >
                  {tierLabel}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          {/* 2. Usage & Credits Section */}
          <div className="p-3 border-b border-slate-200/70 dark:border-slate-800/80 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>AI Credits</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1 leading-tight">
                  {aiCreditsRemaining}
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {" "}/ {aiCreditsLimit}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                    style={{ width: `${aiCreditPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-1.5 truncate">
                  {freeAiCreditsRemaining} free + {purchasedAiCredits} paid
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  <Cloud className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Cloud Saves</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1 leading-tight">
                  {cloudCount}
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {" "}/ {cloudLimit}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${cloudPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-1.5 truncate">
                  {permanentCloudCredits} perm{bonusCloudCredits > 0 ? ` + ${bonusCloudCredits} pack` : ""}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setIsUpgradeOpen(true)
              }}
              className="w-full h-9 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer shadow-sm"
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                <span>Top Up Credits</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-100 whitespace-nowrap">
                <span>From {currencySymbol}{isIndia ? "99" : "2"}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              </span>
            </button>
          </div>

          {/* 3. Navigation & Settings Menu Items */}
          {showNavigation && (
            <div className="p-1.5 space-y-0.5 border-b border-slate-200/70 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setIsSettingsOpen(true)
                }}
                className="group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                <span>Settings</span>
              </button>

              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <item.icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* 4. Logout Row */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </>
  )
}
