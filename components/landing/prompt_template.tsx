"use client"

import React from "react"
import { BarChart2 } from "lucide-react"

const chartTemplate = "Create a bar chart comparing the top 5 countries by smartphone usage in 2025. Include country names on the x-axis and number of users on the y-axis."

interface PromptTemplateProps {
  onSampleClick?: (template: string) => void
  className?: string
  size?: 'default' | 'compact' | 'large'
}

export function PromptTemplate({ 
  onSampleClick, 
  className = "", 
  size = 'default' 
}: PromptTemplateProps) {
  
  const handleSampleClick = () => {
    if (onSampleClick) {
      onSampleClick(chartTemplate)
    }
  }

  // Size variants
  const sizeClasses = {
    compact: {
      container: "max-w-sm p-8",
      icon: "w-10 h-10",
      iconInner: "w-5 h-5",
      title: "text-xl",
      description: "text-sm",
      padding: "p-6"
    },
    default: {
      container: "max-w-md p-12", 
      icon: "w-12 h-12",
      iconInner: "w-6 h-6",
      title: "text-2xl",
      description: "text-base",
      padding: "p-8"
    },
    large: {
      container: "max-w-xl p-16",
      icon: "w-16 h-16", 
      iconInner: "w-8 h-8",
      title: "text-2xl",
      description: "text-base",
      padding: "p-8"
    }
  }

  const styles = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center h-full ${styles.padding} ${className}`}>
      <div className={`flex flex-col items-center justify-center w-full ${styles.container} bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20`}>
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`inline-flex items-center justify-center ${styles.icon} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-xl mb-4`}>
            <BarChart2 className={`${styles.iconInner} text-white`} />
          </div>
          <h2 className={`${styles.title} font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3 text-center`}>
            Create Your Chart with AI Prompt
          </h2>
          <p className={`text-slate-600 text-center max-w-md mx-auto leading-relaxed ${styles.description}`}>
            Describe the chart you want to create in natural language. I'll generate it for you and you can ask me to modify it further!
          </p>
        </div>
        
        <div className="space-y-3 w-full">
          <button
            onClick={handleSampleClick}
            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-slate-800 font-medium px-4 py-3 rounded-xl border border-indigo-200/50 transition-all duration-200 text-left hover:shadow-lg group text-sm"
          >
            <div className="font-semibold flex items-center gap-2 mb-1">
              <div className="p-1 bg-indigo-100 rounded group-hover:bg-indigo-200 transition-colors">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
              </div>
              Sample Request
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">{chartTemplate}</div>
          </button>
          
          <div className="text-center">
            <div className="text-xs text-slate-500">
              Or type your own request in the chat panel →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the template text for use in other components
export { chartTemplate } 