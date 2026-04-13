"use client"
import React, { useState } from 'react'
import { Hexagon, Trash2, Eye, EyeOff, Lock, Unlock, Copy, ArrowUpToLine, ArrowDownToLine, Check } from 'lucide-react'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { PanelSection } from './panel-section'
import { SHAPE_GROUPS } from '@/components/panels/template-panels/decorations-panel'
import type { DrawingMode } from '@/lib/stores/decoration-store'

export function DecorationsPanel() {
  const {
    shapes, selectedShapeId, selectedShapeIds, drawingMode,
    setSelectedShapeId, clearMultiSelect, setDrawingMode, updateShape, 
    removeShape, duplicateShape, toggleLock, bringToFront, sendToBack
  } = useDecorationStore()

  const [expanded, setExpanded] = useState(false)
  
  const handleSelectTool = (type: DrawingMode | 'select') => {
    if (type === 'select') {
      setDrawingMode(null)
      return
    }
    setDrawingMode(drawingMode === type ? null : type)
  }

  // Find currently selected shape
  const selectedShape = shapes.find(s => s.id === selectedShapeId)

  return (
    <PanelSection title="Decorations" icon={<Hexagon className="w-3.5 h-3.5" />} defaultOpen>
      <div className="space-y-4">
        
        {/* Tool Picker (Dark Theme) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Add Shape</span>
            {drawingMode && (
              <button onClick={() => setDrawingMode(null)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                Cancel
              </button>
            )}
          </div>
          
          <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 space-y-3">
            {SHAPE_GROUPS.map(g => {
              if (g.label === 'Emojis') return null // skip emojis to save space if needed
              return (
              <div key={g.label} className="space-y-1.5">
                <span className="text-[9px] uppercase text-gray-600 block">{g.label}</span>
                <div className="flex flex-wrap gap-1">
                  {g.shapes.map(s => {
                    const isActive = s.type === 'select' ? drawingMode === null : drawingMode === s.type
                    const isLabeledTool = s.type === 'freehand' || s.type === 'select' || s.type === 'marquee-select'
                    return (
                      <button
                        key={s.type}
                        onClick={() => handleSelectTool(s.type as any)}
                        title={s.label}
                        className={`flex items-center justify-center rounded transition-all ${
                          isLabeledTool ? 'px-2 h-7 gap-1.5' : 'w-7 h-7'
                        } ${
                          isActive 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-200'
                        }`}
                      >
                        <s.icon className={isLabeledTool ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                        {isLabeledTool && <span className="text-[10px]">{s.label}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )})}
            
            {drawingMode && (
              <p className="text-[9px] text-amber-400/80 text-center uppercase tracking-wide">
                Click & Drag on canvas
              </p>
            )}
          </div>
        </div>

        {/* Selected Shape Properties */}
        {selectedShapeIds.length > 1 ? (
          <div className="border-t border-gray-800 pt-3 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Multi-Select</span>
            </div>
            <div className="flex flex-col gap-2 px-3 py-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
              <span className="text-[11px] text-amber-500 font-medium">{selectedShapeIds.length} shapes selected</span>
              <div className="flex gap-2 justify-center mt-2">
                <button onClick={() => { selectedShapeIds.forEach(id => removeShape(id)); clearMultiSelect(); }} className="px-3 py-1.5 flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded text-[10px] transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button onClick={clearMultiSelect} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : selectedShape ? (
          <div className="space-y-2 border-t border-gray-800 pt-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Properties</span>
              <span className="text-[10px] text-gray-600 capitalize">{selectedShape.type.replace(/-/g, ' ')}</span>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-2 space-y-3 border border-gray-700/50">
              {/* Quick Actions */}
              <div className="flex gap-1">
                <button onClick={() => updateShape(selectedShape.id, { visible: !selectedShape.visible })} className="flex-1 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700">
                  {selectedShape.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
                </button>
                <button onClick={() => toggleLock(selectedShape.id)} className="flex-1 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700">
                  {selectedShape.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => duplicateShape(selectedShape.id)} className="flex-1 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeShape(selectedShape.id)} className="flex-1 h-7 flex items-center justify-center bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded border border-gray-700 hover:border-red-500/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Layer Actions */}
              <div className="flex gap-1">
                <button onClick={() => bringToFront(selectedShape.id)} className="flex-1 h-7 flex items-center justify-center gap-1.5 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700">
                  <ArrowUpToLine className="w-3 h-3" /> Front
                </button>
                <button onClick={() => sendToBack(selectedShape.id)} className="flex-1 h-7 flex items-center justify-center gap-1.5 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700">
                  <ArrowDownToLine className="w-3 h-3" /> Back
                </button>
              </div>

              {/* Color Controls (if applicable) */}
              {!['deco-image', 'deco-svg'].includes(selectedShape.type) && (
                <div className="grid grid-cols-2 gap-2">
                  {!['line', 'arrow', 'connected-lines', 'bezier-line', 'cloud-line'].includes(selectedShape.type) && (
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block">Fill Color</label>
                      <div className="relative">
                        <input 
                          type="color" 
                          value={selectedShape.fillColor.startsWith('#') ? selectedShape.fillColor : '#000000'}
                          onChange={e => updateShape(selectedShape.id, { fillColor: e.target.value })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded w-full">
                          <div className="w-3 aspect-square rounded-sm shadow-sm" style={{ backgroundColor: selectedShape.fillColor }} />
                          <span className="text-[10px] text-gray-300 flex-1 truncate">{selectedShape.fillColor}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 block">Border / Line</label>
                    <div className="relative">
                      <input 
                        type="color" 
                        value={selectedShape.strokeColor.startsWith('#') ? selectedShape.strokeColor : '#ffffff'}
                        onChange={e => updateShape(selectedShape.id, { strokeColor: e.target.value })}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded w-full">
                        <div className="w-3 aspect-square rounded-sm shadow-sm" style={{ backgroundColor: selectedShape.strokeColor }} />
                        <span className="text-[10px] text-gray-300 flex-1 truncate">{selectedShape.strokeColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opacity & Width */}
              <div className="grid grid-cols-2 gap-2">
                  {!['line', 'arrow', 'connected-lines', 'bezier-line', 'cloud-line'].includes(selectedShape.type) && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-[9px] text-gray-500">Opacity</label>
                      <span className="text-[9px] text-gray-400">{selectedShape.fillOpacity}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={selectedShape.fillOpacity} 
                      onChange={e => updateShape(selectedShape.id, { fillOpacity: Number(e.target.value) })}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[9px] text-gray-500">Stroke Width</label>
                    <span className="text-[9px] text-gray-400">{selectedShape.strokeWidth}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="24" 
                    value={selectedShape.strokeWidth} 
                    onChange={e => updateShape(selectedShape.id, { strokeWidth: Number(e.target.value) })}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-800 pt-3">
             <div className="flex flex-col gap-1.5 px-3 py-4 bg-gray-800/30 border border-gray-800 border-dashed rounded-lg text-center">
              <span className="text-[10px] text-gray-500">No shape selected</span>
              <span className="text-[9px] text-gray-600">Select a shape on the canvas to view properties</span>
             </div>
          </div>
        )}
      </div>
    </PanelSection>
  )
}
