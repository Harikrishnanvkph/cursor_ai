"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  MessageSquare, 
  Edit3, 
  User, 
  LogOut, 
  BarChart3, 
  ChevronDown
} from "lucide-react"

export function SiteHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                AIChartor
              </span>
            </Link>
          </div>

          {/* Main Navigation - Visible to all users */}
          <nav className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/pricing">
                Pricing
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
              <Link href="/docs">
                Docs
              </Link>
            </Button>
            
            {/* User-specific navigation - Only show when user is signed in */}
            {user && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
                  <Link href="/landing">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI Chat
                  </Link>
                </Button>
                
                <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                  <Link href="/editor">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Manual Editor
                  </Link>
                </Button>
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or User profile */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden">
                    {user.avatar_url ? (
                      <AvatarImage url={user.avatar_url} />
                    ) : (
                      <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">
                          {user.full_name?.[0] || user.email?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-52 mt-1" align="end" forceMount>
                  {/* User Info Header */}
                  <div className="flex items-center gap-2 p-2.5 border-b border-gray-100">
                    {user.avatar_url && (
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
                      {user.full_name && (
                        <p className="font-semibold text-gray-900 truncate text-sm">{user.full_name}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Navigation Items */}
                  <DropdownMenuItem asChild className="cursor-pointer py-2 hover:bg-blue-50 transition-colors duration-150">
                    <Link href="/landing" className="flex items-center w-full">
                      <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">AI Chart</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer py-2 hover:bg-green-50 transition-colors duration-150">
                    <Link href="/editor" className="flex items-center w-full">
                      <Edit3 className="mr-2 h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Advanced Editor</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer py-2 hover:bg-purple-50 transition-colors duration-150">
                    <Link href="/about" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">About</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
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
            ) : (
              <Button 
                size="lg" 
                asChild 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Link href="/signin">
                  Start Building
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function AvatarImage({ url }: { url: string }) {
  const [src, setSrc] = useState<string>(
    url?.startsWith('http') ? url : '/placeholder-user.jpg'
  )
  return (
    <Image
      src={src}
      alt="Profile"
      fill
      sizes="40px"
      className="rounded-full object-cover"
      onError={() => setSrc('/placeholder-user.jpg')}
      priority
      referrerPolicy="no-referrer"
    />
  )
}
