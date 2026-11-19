import React from "react"
import type { StockProvider } from "@/lib/utils/stock-image-search"

export const PexelsLogo = ({ className = "w-3.5 h-3.5 rounded shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#05A081" />
    <path
      d="M12 9h4.5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5H15v5h-3V9zm3 3v3h1.5a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5H15z"
      fill="#ffffff"
    />
  </svg>
)

export const UnsplashLogo = ({ className = "w-3.5 h-3.5 shrink-0 fill-current" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
  </svg>
)

export const WikimediaLogo = ({ className = "w-3.5 h-3.5 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#006699" />
    <path d="M16 6a10 10 0 0 1 7.07 17.07L16 16V6z" fill="#339966" />
    <path d="M8.93 23.07A10 10 0 0 1 16 6v10l-7.07 7.07z" fill="#990000" />
    <circle cx="16" cy="16" r="4.5" fill="#ffffff" />
  </svg>
)

export const PixabayLogo = ({ className = "w-3.5 h-3.5 rounded shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#00AB6B" />
    <path
      d="M10.5 23V9h6.2c3.1 0 5.3 1.9 5.3 4.8 0 2.9-2.2 4.8-5.3 4.8h-3.1V23h-3.1zm3.1-7h2.8c1.5 0 2.5-.8 2.5-2.2 0-1.4-1-2.2-2.5-2.2h-2.8V16z"
      fill="#ffffff"
    />
  </svg>
)

export function renderProviderLogo(source: StockProvider, className?: string) {
  switch (source) {
    case "pexels":
      return <PexelsLogo className={className || "w-3.5 h-3.5 rounded shrink-0"} />
    case "unsplash":
      return <UnsplashLogo className={className || "w-3.5 h-3.5 shrink-0 fill-current text-slate-900"} />
    case "pixabay":
      return <PixabayLogo className={className || "w-3.5 h-3.5 rounded shrink-0"} />
    case "wikimedia":
      return <WikimediaLogo className={className || "w-3.5 h-3.5 shrink-0"} />
  }
}
