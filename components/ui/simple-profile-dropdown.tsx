"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { UserAvatar } from "./user-avatar"
import { SimpleDropdown } from "./simple-dropdown"
import { User, LogOut, BookOpen, DollarSign, Settings as SettingsIcon, Zap, Cloud, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"

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
  const { user, isPro, aiCreditsLimit, aiCreditsRemaining, cloudChartsLimit: cloudLimit, savedChartsCount: cloudCount } = useSubscriptionQuota()
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

  const trigger = variant === 'button' ? (
    <div className={`relative p-0 rounded-full transition-all duration-200 transform hover:scale-105 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-hidden ${className}`}>
      <UserAvatar size={size} showBorder showHover />
    </div>
  ) : (
    <div className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${className}`}>
      <UserAvatar size={size} showBorder showHover />
    </div>
  )

  return (
    <>
    <SimpleDropdown trigger={trigger} align="end">
      {/* User Info Header */}
      <div className="flex flex-col p-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user?.avatar_url && (
            <Image
              src={user.avatar_url}
              alt="Profile"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-gray-200 shadow-sm object-cover"
              referrerPolicy="no-referrer"
              priority
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              {user?.full_name && (
                <p className="font-semibold text-gray-900 truncate text-sm leading-snug">{user.full_name}</p>
              )}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                isPro 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate leading-snug">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Quota Overview Pill */}
        <div className="mt-3 grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100/80">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1.5 border border-slate-200/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Zap className="w-3 h-3 text-indigo-500" />
              <span>AI Credits</span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {aiCreditsRemaining} / {aiCreditsLimit}
            </span>
          </div>

          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1.5 border border-slate-200/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Cloud className="w-3 h-3 text-purple-500" />
              <span>Cloud Saves</span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {cloudCount} / {cloudLimit}
            </span>
          </div>
        </div>

        {/* Upgrade Callout if on Free */}
        {!isPro && (
          <button
            type="button"
            onClick={() => setIsUpgradeOpen(true)}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Upgrade to Pro ($5/mo)</span>
          </button>
        )}
      </div>
      
      {/* Navigation Items */}
      {showNavigation && (
        <div className="p-1.5 border-b border-gray-100">
          <button 
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center w-full px-2.5 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150 text-left cursor-pointer"
          >
            <SettingsIcon className="mr-2 h-4 w-4 text-gray-500" />
            <span className="font-medium">Settings</span>
          </button>
          
          {navigationItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href} 
              className="flex items-center w-full px-2.5 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <item.icon className="mr-2 h-4 w-4 text-gray-500" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
      
      {/* Logout */}
      <div className="p-1.5">
        <button 
          className="flex items-center w-full px-2.5 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </SimpleDropdown>
    <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </>
  )
}


