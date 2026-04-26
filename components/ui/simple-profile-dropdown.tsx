"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { UserAvatar } from "./user-avatar"
import { SimpleDropdown } from "./simple-dropdown"
import { BarChart2, PencilRuler, User, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  const { user, signOut } = useAuth()

  const defaultNavigationItems = [
    {
      href: "/landing",
      label: "AI Chart",
      icon: BarChart2
    },
    {
      href: "/editor", 
      label: "Advanced Editor",
      icon: PencilRuler
    },
    {
      href: "/about",
      label: "About", 
      icon: User
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
            {user?.full_name && (
              <p className="font-semibold text-gray-900 truncate text-sm leading-snug">{user.full_name}</p>
            )}
            <p className="text-xs text-gray-500 truncate leading-snug">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      {showNavigation && (
        <div className="p-1.5 border-b border-gray-100">
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
          className="flex items-center w-full px-2.5 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </SimpleDropdown>
  )
}

