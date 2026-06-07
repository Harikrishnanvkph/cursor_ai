"use client"
 
import React, { useEffect, useState } from 'react'
import { MessageSquare, Lightbulb, Sparkles, Sliders, Check } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { ZONE_COLORS, ZONE_ICONS, getZoneLabel, getPresetKey, MESSAGE_PRESETS } from '../format-builder-utils'
import { ZonePropertiesContent } from './zone-properties-panel'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { BaseZone } from '@/lib/format-types'
 
export function AiInstructionsPanel() {
  const {
    skeleton,
    selectedZoneId,
    setSelectedZoneId,
    selectedZone,
    updateZone,
  } = useFormatBuilder()
 
  const zones = skeleton.zones
  const zone = selectedZone
  const baseZone = zone as BaseZone | null
 
  // Determine current mode based on zone properties (contentMode takes precedence, then message vs manual image)
  const mode = baseZone
    ? ((baseZone as any).contentMode || (baseZone.message && baseZone.message.trim().length > 0 ? 'ai' : baseZone.type === 'image' && (baseZone as any).imageUrl ? 'static' : 'ai'))
    : 'ai'
 
  const [activeView, setActiveView] = useState<'ai' | 'static'>('ai')
 
  // Synchronize activeView with the selected zone's current mode when the zone selection changes
  useEffect(() => {
    if (baseZone) {
      const currentMode = ((baseZone as any).contentMode || (baseZone.message && baseZone.message.trim().length > 0 ? 'ai' : baseZone.type === 'image' && (baseZone as any).imageUrl ? 'static' : 'ai'))
      setActiveView(currentMode)
    }
  }, [selectedZoneId])
 
  const presetKey = zone ? getPresetKey(zone) : ''
  const presets = presetKey ? MESSAGE_PRESETS[presetKey] : []
 
  // Capitalized / formatted label for the properties section header
  const label = zone ? getZoneLabel(zone) : 'Zone'
  const formattedLabel = label.startsWith('stat:')
    ? `Stat (${label.substring(5).charAt(0).toUpperCase() + label.substring(5).slice(1)})`
    : label.charAt(0).toUpperCase() + label.slice(1)
 
  const handleModeChange = (newMode: 'ai' | 'static') => {
    if (!baseZone) return
    
    const updates: any = { contentMode: newMode }
    if (newMode === 'ai') {
      // Clear manual image content
      if (baseZone.type === 'image') {
        updates.imageUrl = ''
      } else if (baseZone.type === 'background' && (baseZone as any).style) {
        updates.style = { ...(baseZone as any).style, imageUrl: '' }
      }
    } else {
      // Clear AI prompt instructions
      updates.message = ''
    }
    updateZone(baseZone.id, updates)
    setActiveView(newMode)
  }
 
  return (
    <ResizablePanelGroup direction="vertical" className="flex flex-col h-full overflow-hidden w-full">
      {/* Section 1: Created Zones List */}
      <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="px-3.5 py-2.5 border-b border-gray-800 bg-gray-950/40 text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Select a Zone to Instruct / Edit
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 pr-2">
            {zones.map((z) => {
              const colors = ZONE_COLORS[z.type] || ZONE_COLORS.decoration
              const isSelected = selectedZoneId === z.id
              const zLabel = getZoneLabel(z)
              const hasMessage = (z as BaseZone).message && (z as BaseZone).message!.trim().length > 0
 
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all border ${
                    isSelected
                      ? 'bg-orange-500/10 text-orange-400 font-semibold border-orange-500/30'
                      : 'hover:bg-gray-800/40 text-gray-400 hover:text-gray-200 border-transparent'
                  }`}
                >
                  {/* Icon */}
                  <span style={{ color: colors.accent }} className="shrink-0">
                    {ZONE_ICONS[z.type]}
                  </span>
 
                  {/* Label */}
                  <span className="capitalize truncate text-xs font-medium flex-1 min-w-0">
                    {zLabel}
                  </span>
 
                  {/* Message indicator */}
                  {hasMessage && (
                    <MessageSquare className="w-3 h-3 text-orange-400 shrink-0" />
                  )}
                </button>
              )
            })}
            {zones.length === 0 && (
              <p className="text-[11px] text-gray-600 text-center py-6">
                No zones created yet.<br />Go to 'Add Zones' tab to add some.
              </p>
            )}
          </div>
        </div>
      </ResizablePanel>
 
      <ResizableHandle className="bg-gray-800 hover:bg-orange-500/50 transition-colors h-1 cursor-row-resize shrink-0" />
 
      {/* Section 2: Instruct & Edit Sub-section */}
      <ResizablePanel defaultSize={65} minSize={30} className="flex flex-col">
        {baseZone ? (
          <div className="p-3 bg-gray-950/20 flex-1 flex flex-col overflow-hidden h-full">
            {/* Mode Switcher */}
            <div className="px-1 pb-2.5 shrink-0 border-b border-gray-900 mb-2.5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  Content Source
                </label>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-semibold uppercase tracking-wider shadow-sm select-none">
                  <Check className="w-2.5 h-2.5 shrink-0" />
                  <span>{mode === 'ai' ? 'AI Active' : 'Static Active'}</span>
                </div>
              </div>
              <div className="flex bg-gray-950 p-1 gap-1.5 rounded-lg border border-gray-800 select-none">
                <button
                  onClick={() => setActiveView('ai')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-center text-[10px] uppercase font-bold tracking-wider rounded-md transition-all relative ${
                    activeView === 'ai'
                      ? 'bg-gray-800 text-orange-400 border border-gray-700/80 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 bg-transparent border-transparent hover:bg-gray-800/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Generated</span>
                  {mode === 'ai' && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Currently active content source" />
                  )}
                </button>
                <button
                  onClick={() => setActiveView('static')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-center text-[10px] uppercase font-bold tracking-wider rounded-md transition-all relative ${
                    activeView === 'static'
                      ? 'bg-gray-800 text-orange-400 border border-gray-700/80 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 bg-transparent border-transparent hover:bg-gray-800/10'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>Static / Preset</span>
                  {mode === 'static' && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Currently active content source" />
                  )}
                </button>
              </div>
            </div>
    
            {/* Scrollable Configuration Panel */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeView === 'ai' ? (
                // ──── AI Message Instructions Panel ────
                mode === 'ai' ? (
                  /* AI Generation Block */
                  <div className="p-3 rounded-lg border border-orange-500/20 bg-[#131326]/60 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-orange-400 fill-orange-500/10" />
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                        AI Message Instructions
                      </span>
                    </div>

                    <textarea
                      value={baseZone.message || ''}
                      onChange={(e) => updateZone(baseZone.id, { message: e.target.value } as any)}
                      placeholder="Instructions for AI content generation..."
                      rows={3}
                      className="w-full text-xs bg-[#0b0b16] border border-gray-800 rounded-md px-2.5 py-2 text-white placeholder:text-gray-650 resize-none focus:outline-none focus:border-orange-500/40"
                    />

                    {/* Presets suggestions */}
                    {presets && presets.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-800">
                        <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold block mb-0.5">Suggestions</label>
                        {presets.map((preset, i) => (
                          <button
                            key={i}
                            onClick={() => updateZone(baseZone.id, { message: preset } as any)}
                            className="flex items-start gap-1.5 text-left text-[10px] text-gray-400 hover:text-orange-400 transition-colors group"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20 shrink-0 mt-0.5" />
                            <span className="leading-snug text-xs">{preset}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Message output type dropdown */}
                    <div className="pt-0.5">
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Output Type</label>
                      <select
                        value={baseZone.messageType || 'auto'}
                        onChange={(e) => updateZone(baseZone.id, { messageType: e.target.value } as any)}
                        className="w-full h-8 text-xs bg-[#0b0b16] border border-gray-800 rounded px-2.5 text-gray-400 focus:outline-none focus:border-orange-500/40 cursor-pointer"
                      >
                        <option value="auto">Auto detect</option>
                        <option value="text">Plain text</option>
                        <option value="html">HTML content</option>
                        <option value="image">Image URL</option>
                        <option value="data">Data / JSON</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Warning that Static/Preset is currently selected */
                  <div className="p-5 rounded-xl border border-gray-800 bg-[#0c0c14]/80 text-center space-y-4 shadow-xl backdrop-blur-sm mt-3 mx-0.5">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400 border border-orange-500/20">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Static/Preset Active</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed max-w-[210px] mx-auto">
                        This zone is configured to use static content. Click below to enable AI instructions.
                      </p>
                    </div>
                    <button
                      onClick={() => handleModeChange('ai')}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Select AI Generated to Instruct</span>
                    </button>
                  </div>
                )
              ) : (
                // ──── Properties Panel ────
                mode === 'static' ? (
                  /* Position, size, and styling properties */
                  <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/20">
                    <ZonePropertiesContent showContentControls={true} />
                  </div>
                ) : (
                  /* Warning that AI Generated is currently selected */
                  <div className="p-5 rounded-xl border border-gray-800 bg-[#0c0c14]/80 text-center space-y-4 shadow-xl backdrop-blur-sm mt-3 mx-0.5">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400 border border-orange-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">AI Generated Active</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed max-w-[210px] mx-auto">
                        This zone is configured to generate content using AI. Click below to edit properties manually.
                      </p>
                    </div>
                    <button
                      onClick={() => handleModeChange('static')}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 shrink-0" />
                      <span>Select Static to Edit</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gray-950/10 text-center flex-1 flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-7 h-7 text-gray-700 mb-2" />
            <p className="text-[11px] text-gray-500">
              Select a zone from the list above<br />to write instructions or edit properties.
            </p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
