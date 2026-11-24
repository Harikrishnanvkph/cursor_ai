"use client"

import Image from "next/image"
import { useAuth } from "@/components/auth/AuthProvider"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showBorder?: boolean
  showHover?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-12 w-12'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export function UserAvatar({ 
  size = 'md', 
  className,
  showBorder = false,
  showHover = true
}: UserAvatarProps) {
  const { user } = useAuth()

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden flex items-center justify-center",
      sizeClasses[size],
      showBorder && "ring-1 ring-slate-200/90 dark:ring-slate-700/80",
      showHover && "hover:ring-2 hover:ring-indigo-400/60 dark:hover:ring-indigo-500/60 transition-all duration-150",
      className
    )}>
      {user?.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt="Profile"
          fill
          sizes={`${size === 'sm' ? '32px' : size === 'md' ? '40px' : '48px'}`}
          className="rounded-full object-cover"
          referrerPolicy="no-referrer"
          priority
        />
      ) : (
        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
          <span className={cn(
            "text-white font-semibold",
            textSizeClasses[size]
          )}>
            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
          </span>
        </div>
      )}
    </div>
  )
}
