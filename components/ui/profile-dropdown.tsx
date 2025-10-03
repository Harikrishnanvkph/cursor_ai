"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { UserAvatar } from "./user-avatar"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu"
import { BarChart2, PencilRuler, User, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProfileDropdownProps {
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

export function ProfileDropdown({ 
  size = 'md',
  variant = 'button',
  className,
  showNavigation = true,
  customNavigationItems
}: ProfileDropdownProps) {
  const { user, signOut } = useAuth()

  const defaultNavigationItems = [
    {
      href: "/landing",
      label: "AI Chart",
      icon: BarChart2,
      iconColor: "text-blue-600"
    },
    {
      href: "/editor", 
      label: "Advanced Editor",
      icon: PencilRuler,
      iconColor: "text-green-600"
    },
    {
      href: "/about",
      label: "About", 
      icon: User,
      iconColor: "text-purple-600"
    }
  ]

  const navigationItems = customNavigationItems || defaultNavigationItems

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'button' ? (
          <Button 
            className={`bg-transparent hover:bg-transparent relative p-0 rounded-full transition-all duration-200 transform hover:scale-105 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-hidden ${className}`}
          >
            <UserAvatar size={size} showBorder showHover />
          </Button>
        ) : (
          <div className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${className}`}>
            <UserAvatar size={size} showBorder showHover />
          </div>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-52 mt-1" align="end" forceMount>
        {/* User Info Header */}
        <div className="flex items-center gap-2 p-2.5 border-b border-gray-100">
          {user?.avatar_url && (
            <Image
              src={user.avatar_url}
              alt="Profile"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-gray-200 shadow-sm object-cover"
              referrerPolicy="no-referrer"
              priority
            />
          )}
          <div className="flex-1 min-w-0">
            {user?.full_name && (
              <p className="font-semibold text-gray-900 truncate text-sm">{user.full_name}</p>
            )}
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Items */}
        {showNavigation && navigationItems.map((item, index) => (
          <DropdownMenuItem key={index} asChild className="cursor-pointer py-2 hover:bg-blue-50 transition-colors duration-150">
            <Link href={item.href} className="flex items-center w-full">
              <item.icon className={`mr-2 h-4 w-4 ${item.iconColor}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        
        {showNavigation && <DropdownMenuSeparator />}
        
        {/* Logout */}
        <DropdownMenuItem 
          className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50 transition-colors duration-150"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium text-sm">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
