import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { BoardFontProvider } from "@/components/board/board-font-provider"

export const metadata: Metadata = {
  title: "Board | AIChartor",
  description: "View and manage your saved charts and visualizations.",
}

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BoardFontProvider>
      <div className={`board-page-container ${GeistSans.variable} ${GeistSans.className} font-sans min-h-screen`}>
        {children}
      </div>
    </BoardFontProvider>
  )
}
