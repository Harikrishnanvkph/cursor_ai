"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SimpleDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function SimpleDropdown({ 
  trigger, 
  children, 
  align = 'end',
  className 
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getAlignmentClasses = () => {
    switch (align) {
      case 'start':
        return 'left-0'
      case 'center':
        return 'left-1/2 transform -translate-x-1/2'
      case 'end':
        return 'right-0'
      default:
        return 'right-0'
    }
  }

  return (
    <div className="relative">
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50",
            getAlignmentClasses(),
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
