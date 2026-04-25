"use client"

import React from "react"
import { Eye, EyeOff, Trash2 } from "lucide-react"

interface OverlayHeaderProps {
    isSelected: boolean;
    onToggleExpand: () => void;
    visualPreview: React.ReactNode;
    label: string;
    typeBadge: string;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onDelete: () => void;
}

export function OverlayHeader({
    isSelected,
    onToggleExpand,
    visualPreview,
    label,
    typeBadge,
    isVisible,
    onToggleVisibility,
    onDelete
}: OverlayHeaderProps) {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-t-lg ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
            onClick={onToggleExpand}
        >
            {/* Visual Preview (Color dot, Thumbnail, or Icon) */}
            <div className="flex-shrink-0">
                {visualPreview}
            </div>

            {/* Label/Title */}
            <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                {label}
            </span>

            {/* Type Badge */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono leading-none flex-shrink-0 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                {typeBadge}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onToggleVisibility}
                    title={isVisible ? 'Hide' : 'Show'}
                >
                    {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={onDelete}
                    title="Delete"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}
