"use client"

import { useEffect, useContext } from "react"
import { SidebarPortalContext } from "./sidebar-portal-context"

interface SidebarContainerProps {
  children: React.ReactNode
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function SidebarContainer({ children, containerRef }: SidebarContainerProps) {
  const context = useContext(SidebarPortalContext)

  useEffect(() => {
    if (containerRef?.current && context) {
      context.setSidebarContainer(containerRef.current)
    }
    return () => {
      if (context) {
        context.setSidebarContainer(null)
      }
    }
  }, [context, containerRef])

  return <>{children}</>
}
