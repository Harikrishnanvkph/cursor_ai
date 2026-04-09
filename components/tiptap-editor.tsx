"use client"

import { useEditor, EditorContent, Extension, Mark } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import { useEffect, useCallback, useRef, useState } from 'react'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    RemoveFormatting,
    Highlighter,
    Maximize2,
    Minus,
    Plus,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Check,
    Palette,
    ChevronDown,
    Pilcrow,
    Type,
    Eraser
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Unified Font Families (shared with RichTextToolbar) ──────────────
export const EDITOR_FONT_FAMILIES = [
    { label: 'Default', value: 'default' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Poppins', value: 'Poppins, sans-serif' },
    { label: 'Open Sans', value: 'Open Sans, sans-serif' },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Oswald', value: 'Oswald, sans-serif' },
    { label: 'Raleway', value: 'Raleway, sans-serif' },
    { label: 'Outfit', value: 'Outfit, sans-serif' },
    { label: 'DM Sans', value: 'DM Sans, sans-serif' },
    { label: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Cabin', value: 'Cabin, sans-serif' },
    { label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
    { label: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
    { label: 'Playfair Display', value: 'Playfair Display, serif' },
    { label: 'Merriweather', value: 'Merriweather, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
]

// ── Color presets ──────────────────────────────
const TEXT_COLOR_PRESETS = [
    '#1a1a2e', '#0f172a', '#1e3a5f', '#1e40af', '#7c3aed', '#9333ea',
    '#be185d', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
    '#475569', '#6b7280', '#9ca3af', '#ffffff',
]

const HIGHLIGHT_COLOR_PRESETS = [
    '#fef08a', '#fde68a', '#fed7aa', '#fecaca', '#fbcfe8', '#e9d5ff',
    '#c7d2fe', '#bae6fd', '#a7f3d0', '#d9f99d', '#fef9c3', '#ffffff',
    'transparent',
]

// Custom extension for font size (works on inline spans)
const FontSizeExtension = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                renderHTML: attributes => {
                    if (!attributes.fontSize) return {}
                    return { style: `font-size: ${attributes.fontSize}` }
                }
            }
        }
    }
})

// Line height extension - applies to block elements (paragraph, heading)
const LineHeightExtension = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: null
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultLineHeight,
                        parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.lineHeight) {
                                return {}
                            }
                            return { style: `line-height: ${attributes.lineHeight}` }
                        }
                    }
                }
            }
        ]
    },

    addCommands() {
        return {
            setLineHeight: (lineHeight: string) => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.updateAttributes(type, { lineHeight })
                )
            },
            unsetLineHeight: () => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.resetAttributes(type, 'lineHeight')
                )
            }
        } as any
    }
})

// Letter spacing extension - applies to block elements
const LetterSpacingExtension = Extension.create({
    name: 'letterSpacing',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLetterSpacing: null
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    letterSpacing: {
                        default: this.options.defaultLetterSpacing,
                        parseHTML: (element: HTMLElement) => element.style.letterSpacing || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.letterSpacing) return {}
                            return { style: `letter-spacing: ${attributes.letterSpacing}` }
                        }
                    }
                }
            }
        ]
    },

    addCommands() {
        return {
            setLetterSpacing: (letterSpacing: string) => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.updateAttributes(type, { letterSpacing })
                )
            },
            unsetLetterSpacing: () => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.resetAttributes(type, 'letterSpacing')
                )
            }
        } as any
    }
})

// Paragraph spacing extension - applies margin-top/bottom to paragraphs
const ParagraphSpacingExtension = Extension.create({
    name: 'paragraphSpacing',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    marginTop: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.marginTop || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.marginTop) return {}
                            return { style: `margin-top: ${attributes.marginTop}` }
                        }
                    },
                    marginBottom: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.marginBottom || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.marginBottom) return {}
                            return { style: `margin-bottom: ${attributes.marginBottom}` }
                        }
                    }
                }
            }
        ]
    },

    addCommands() {
        return {
            setParagraphSpacing: (spacing: string) => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.updateAttributes(type, { marginTop: spacing, marginBottom: spacing })
                )
            },
            unsetParagraphSpacing: () => ({ commands }: { commands: any }) => {
                return this.options.types.every((type: string) =>
                    commands.resetAttributes(type, ['marginTop', 'marginBottom'])
                )
            }
        } as any
    }
})

// Custom Subscript mark (avoids npm package dependency)
const SubscriptMark = Mark.create({
    name: 'subscript',
    excludes: 'superscript',
    parseHTML() {
        return [
            { tag: 'sub' },
            { style: 'vertical-align', getAttrs: (value: string) => (value === 'sub' ? {} : false) }
        ]
    },
    renderHTML() {
        return ['sub', 0]
    },
    addCommands() {
        return {
            toggleSubscript: () => ({ commands }: { commands: any }) => {
                return commands.toggleMark(this.name)
            }
        } as any
    },
    addKeyboardShortcuts() {
        return {
            'Mod-,': () => (this.editor.commands as any).toggleSubscript()
        }
    }
})

// Custom Superscript mark (avoids npm package dependency)
const SuperscriptMark = Mark.create({
    name: 'superscript',
    excludes: 'subscript',
    parseHTML() {
        return [
            { tag: 'sup' },
            { style: 'vertical-align', getAttrs: (value: string) => (value === 'super' ? {} : false) }
        ]
    },
    renderHTML() {
        return ['sup', 0]
    },
    addCommands() {
        return {
            toggleSuperscript: () => ({ commands }: { commands: any }) => {
                return commands.toggleMark(this.name)
            }
        } as any
    },
    addKeyboardShortcuts() {
        return {
            'Mod-.': () => (this.editor.commands as any).toggleSuperscript()
        }
    }
})

// Custom Image extension with width/height support for resizing
const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: element => {
                    const width = element.getAttribute('width') || element.style.width
                    return width ? width.replace('px', '') : null
                },
                renderHTML: attributes => {
                    if (!attributes.width) return {}
                    return { width: attributes.width, style: `width: ${attributes.width}px` }
                }
            },
            height: {
                default: null,
                parseHTML: element => {
                    const height = element.getAttribute('height') || element.style.height
                    return height ? height.replace('px', '') : null
                },
                renderHTML: attributes => {
                    if (!attributes.height) return {}
                    return { height: attributes.height, style: `height: ${attributes.height}px` }
                }
            }
        }
    }
})

interface TiptapEditorProps {
    initialHtml: string
    onChange: (html: string) => void
    className?: string
    contentStyle?: {
        fontSize?: number
        fontFamily?: string
        fontWeight?: string | number
        color?: string
        textAlign?: string
        lineHeight?: number | string
        letterSpacing?: number
    }
    zoneDimensions?: { width: number; height: number }
    fitToView?: boolean
    editorBg?: 'white' | 'black'
}

// Toolbar Button Component
const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children
}: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
}) => (
    <Button
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title={title}
    >
        {children}
    </Button>
)

export function TiptapEditor({ initialHtml, onChange, className = '', contentStyle, zoneDimensions, fitToView, editorBg = 'white' }: TiptapEditorProps) {
    // Build dynamic style string for editor content
    const editorStyleParts: string[] = []
    if (contentStyle?.fontSize) editorStyleParts.push(`font-size: ${contentStyle.fontSize}px`)
    if (contentStyle?.fontFamily) editorStyleParts.push(`font-family: ${contentStyle.fontFamily}`)
    if (contentStyle?.color) editorStyleParts.push(`color: ${contentStyle.color}`)
    if (contentStyle?.lineHeight) editorStyleParts.push(`line-height: ${contentStyle.lineHeight}`)
    if (contentStyle?.letterSpacing) editorStyleParts.push(`letter-spacing: ${contentStyle.letterSpacing}px`)
    const editorStyleString = editorStyleParts.join('; ')

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer'
                }
            }),
            ResizableImage.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto cursor-pointer',
                    style: 'display: inline; vertical-align: middle;'
                }
            }),
            TextStyle,
            FontSizeExtension,
            FontFamily,
            LineHeightExtension,
            LetterSpacingExtension,
            ParagraphSpacingExtension,
            SubscriptMark,
            SuperscriptMark,
            Color,
            Highlight.configure({
                multicolor: true
            })
        ],
        content: initialHtml,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onTransaction: () => {
            // Force re-render on every transaction (cursor move, selection change, formatting change)
            setEditorUpdateKey(k => k + 1)
        },
        onSelectionUpdate: ({ editor }) => {
            // Check if an image is selected
            const { from, to } = editor.state.selection
            const node = editor.state.doc.nodeAt(from)
            if (node && node.type.name === 'image') {
                setSelectedImage({
                    src: node.attrs.src,
                    width: node.attrs.width || '',
                    height: node.attrs.height || '',
                    pos: from
                })
            } else {
                setSelectedImage(null)
            }
        },
        editorProps: {
            attributes: {
                class: 'tiptap max-w-none focus:outline-none min-h-[350px] p-2',
                style: editorStyleString
            }
        }
    })

    // Update content when initialHtml changes
    useEffect(() => {
        if (editor && initialHtml !== editor.getHTML()) {
            editor.commands.setContent(initialHtml)
        }
    }, [initialHtml, editor])

    const setLink = useCallback(() => {
        if (!editor) return

        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageUrl, setImageUrl] = useState('')

    // State for font size input to allow multi-digit typing
    const [fontSizeInput, setFontSizeInput] = useState('')
    const [fontSizeInputFocused, setFontSizeInputFocused] = useState(false)
    // Force re-render on editor transactions
    const [editorUpdateKey, setEditorUpdateKey] = useState(0)

    // Compute scale for fitToView mode
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const [editorScale, setEditorScale] = useState(1)

    const computeScale = useCallback(() => {
        if (!fitToView || !editorContainerRef.current || !zoneDimensions) {
            setEditorScale(1)
            return
        }
        const container = editorContainerRef.current
        const containerWidth = container.clientWidth - 32 // 16px padding on both sides
        const containerHeight = container.clientHeight - 32 // 16px padding on top/bottom
        const zoneW = zoneDimensions.width
        const zoneH = zoneDimensions.height
        if (containerWidth > 0 && containerHeight > 0 && zoneW > 0 && zoneH > 0) {
            const scaleX = containerWidth / zoneW
            const scaleY = containerHeight / zoneH
            setEditorScale(Math.min(scaleX, scaleY, 1))
        }
    }, [fitToView, zoneDimensions])

    useEffect(() => {
        const id = requestAnimationFrame(computeScale)
        window.addEventListener('resize', computeScale)
        return () => {
            cancelAnimationFrame(id)
            window.removeEventListener('resize', computeScale)
        }
    }, [computeScale])

    // Helper: get the current font family at cursor/selection (with contentStyle fallback)
    const getCurrentFontFamily = useCallback(() => {
        if (!editor) return ''
        const attrs = editor.getAttributes('textStyle')
        if (attrs.fontFamily) return attrs.fontFamily
        // Fallback to contentStyle font family if no inline mark
        if (contentStyle?.fontFamily) {
            // Try to match the contentStyle fontFamily to one of our EDITOR_FONT_FAMILIES values
            const match = EDITOR_FONT_FAMILIES.find(f => 
                f.value === contentStyle.fontFamily || 
                contentStyle.fontFamily?.startsWith(f.label)
            )
            if (match) return match.value
            return contentStyle.fontFamily
        }
        return ''
    }, [editor, editorUpdateKey, contentStyle])

    // Helper: get the current text alignment
    const getCurrentAlignment = useCallback(() => {
        if (!editor) return 'left'
        if (editor.isActive({ textAlign: 'center' })) return 'center'
        if (editor.isActive({ textAlign: 'right' })) return 'right'
        if (editor.isActive({ textAlign: 'justify' })) return 'justify'
        return 'left'
    }, [editor, editorUpdateKey])

    // Helper: get the current heading level
    const getCurrentHeading = useCallback(() => {
        if (!editor) return 'paragraph'
        if (editor.isActive('heading', { level: 1 })) return 'h1'
        if (editor.isActive('heading', { level: 2 })) return 'h2'
        if (editor.isActive('heading', { level: 3 })) return 'h3'
        return 'paragraph'
    }, [editor, editorUpdateKey])

    // Helper: get the current font size at cursor/selection
    const getCurrentFontSize = useCallback(() => {
        if (!editor) return ''
        const attrs = editor.getAttributes('textStyle')
        const explicit = attrs.fontSize?.replace('px', '')
        if (explicit) return explicit
        // Fall back to contentStyle if no explicit mark
        return contentStyle?.fontSize ? String(contentStyle.fontSize) : ''
    }, [editor, editorUpdateKey, contentStyle])

    // State for selected image resize
    const [selectedImage, setSelectedImage] = useState<{
        src: string
        width: string
        height: string
        pos: number
    } | null>(null)

    // Update image dimensions
    const updateImageSize = useCallback((width: string, height: string) => {
        if (!editor || !selectedImage) return

        const { pos } = selectedImage
        const node = editor.state.doc.nodeAt(pos)
        if (!node || node.type.name !== 'image') return

        // Use transaction to update node attributes
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: width || null,
            height: height || null
        })
        editor.view.dispatch(tr)

        // Update local state
        setSelectedImage(prev => prev ? { ...prev, width, height } : null)
    }, [editor, selectedImage])

    const addImageFromUrl = useCallback(() => {
        if (!editor || !imageUrl) return
        // Use insertContent to avoid extra paragraph/newline
        editor.chain().focus().insertContent({
            type: 'image',
            attrs: { src: imageUrl }
        }).run()
        setImageUrl('')
    }, [editor, imageUrl])

    const addImageFromFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            // Use insertContent to avoid extra paragraph/newline
            editor.chain().focus().insertContent({
                type: 'image',
                attrs: { src: base64 }
            }).run()
        }
        reader.readAsDataURL(file)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [editor])

    // Get current line height from the active node
    const getCurrentLineHeight = () => {
        if (!editor) return ''
        const { lineHeight } = editor.getAttributes('paragraph')
        return lineHeight || ''
    }

    // Get current letter spacing from the active node
    const getCurrentLetterSpacing = () => {
        if (!editor) return ''
        const { letterSpacing } = editor.getAttributes('paragraph')
        return letterSpacing || ''
    }

    // Get current paragraph spacing from the active node
    const getCurrentParagraphSpacing = () => {
        if (!editor) return ''
        const { marginBottom } = editor.getAttributes('paragraph')
        return marginBottom || ''
    }

    // Get current text color
    const getCurrentTextColor = () => {
        if (!editor) return '#000000'
        const attrs = editor.getAttributes('textStyle')
        return attrs.color || contentStyle?.color || '#000000'
    }

    if (!editor) {
        return null
    }

    return (
        <div className={`border rounded-lg overflow-hidden flex flex-col ${className} ${editorBg === 'black' ? 'bg-black text-white' : 'bg-white'}`}>
            {/* Toolbar */}
            <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center shrink-0">
                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Font Family */}
                <Select
                    value={getCurrentFontFamily()}
                    onValueChange={(value) => {
                        if (value === 'default') {
                            editor.chain().focus().unsetFontFamily().run()
                        } else {
                            editor.chain().focus().setFontFamily(value).run()
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                        {EDITOR_FONT_FAMILIES.map(f => (
                            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value !== 'default' ? f.value : undefined }}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Font Size Stepper */}
                <div className="flex items-center h-8 border rounded-md overflow-hidden bg-white">
                    <button
                        type="button"
                        className="h-full px-1.5 hover:bg-gray-100 active:bg-gray-200 border-r text-gray-600 flex items-center"
                        title="Decrease font size"
                        onClick={() => {
                            const currentNum = parseInt(getCurrentFontSize()) || 16
                            const newSize = Math.max(6, currentNum - 1)
                            editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}px` }).run()
                            setFontSizeInput(String(newSize))
                        }}
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <input
                        type="text"
                        className="w-12 h-full text-center text-xs border-0 outline-none bg-transparent"
                        value={fontSizeInputFocused ? fontSizeInput : getCurrentFontSize()}
                        placeholder="—"
                        onFocus={() => {
                            setFontSizeInput(getCurrentFontSize())
                            setFontSizeInputFocused(true)
                        }}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '')
                            setFontSizeInput(val)
                        }}
                        onBlur={() => {
                            setFontSizeInputFocused(false)
                            if (fontSizeInput === '') {
                                editor.chain().focus().unsetMark('textStyle').run()
                            } else {
                                const num = parseInt(fontSizeInput)
                                if (num >= 1 && num <= 999) {
                                    editor.chain().focus().setMark('textStyle', { fontSize: `${num}px` }).run()
                                }
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                ;(e.target as HTMLInputElement).blur()
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="h-full px-1.5 hover:bg-gray-100 active:bg-gray-200 border-l text-gray-600 flex items-center"
                        title="Increase font size"
                        onClick={() => {
                            const currentNum = parseInt(getCurrentFontSize()) || 16
                            const newSize = Math.min(999, currentNum + 1)
                            editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}px` }).run()
                            setFontSizeInput(String(newSize))
                        }}
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>

                {/* Line Height - Icon with Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={getCurrentLineHeight() ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Line Height"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 7h2.5L5 3.5 1.5 7H4v10H1.5L5 20.5 8.5 17H6V7zm4-2v2h12V5H10zm0 14h12v-2H10v2zm0-6h12v-2H10v2z" />
                            </svg>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-28 p-1" align="start">
                        <div className="flex flex-col">
                            {[
                                { label: 'Default', value: 'default' },
                                { label: '1', value: '1' },
                                { label: '1.2', value: '1.2' },
                                { label: '1.4', value: '1.4' },
                                { label: '1.5', value: '1.5' },
                                { label: '1.6', value: '1.6' },
                                { label: '1.8', value: '1.8' },
                                { label: '2', value: '2' },
                                { label: '2.5', value: '2.5' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`text-left px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                                        getCurrentLineHeight() === opt.value || (!getCurrentLineHeight() && opt.value === 'default')
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        if (opt.value === 'default') {
                                            (editor.commands as any).unsetLineHeight()
                                        } else {
                                            (editor.commands as any).setLineHeight(opt.value)
                                        }
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Letter Spacing - Google Docs style AV icon */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={getCurrentLetterSpacing() ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Letter Spacing"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <text x="3" y="16" fontSize="11" fontWeight="600" fill="currentColor" stroke="none" fontFamily="Arial">AV</text>
                                <path d="M4 20h16" strokeLinecap="round" />
                                <path d="M7 20l-3 0" strokeLinecap="round" />
                                <path d="M20 20l-3 0" strokeLinecap="round" />
                                <path d="M4 20v-1.5" strokeLinecap="round" />
                                <path d="M20 20v-1.5" strokeLinecap="round" />
                            </svg>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-28 p-1" align="start">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase px-2 py-1">Letter Spacing</span>
                            {[
                                { label: 'Default', value: 'default' },
                                { label: 'Tight (-0.5px)', value: '-0.5px' },
                                { label: 'Normal (0)', value: '0px' },
                                { label: '0.5px', value: '0.5px' },
                                { label: '1px', value: '1px' },
                                { label: '1.5px', value: '1.5px' },
                                { label: '2px', value: '2px' },
                                { label: '3px', value: '3px' },
                                { label: '5px', value: '5px' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`text-left px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                                        getCurrentLetterSpacing() === opt.value || (!getCurrentLetterSpacing() && opt.value === 'default')
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        if (opt.value === 'default') {
                                            (editor.commands as any).unsetLetterSpacing()
                                        } else {
                                            (editor.commands as any).setLetterSpacing(opt.value)
                                        }
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Paragraph Spacing - Google Docs style vertical spacing icon */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={getCurrentParagraphSpacing() ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Paragraph Spacing"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 6h12" strokeLinecap="round" />
                                <path d="M9 10h12" strokeLinecap="round" />
                                <path d="M9 14h12" strokeLinecap="round" />
                                <path d="M9 18h12" strokeLinecap="round" />
                                <path d="M4 4v5" strokeLinecap="round" />
                                <path d="M4 15v5" strokeLinecap="round" />
                                <path d="M2.5 6L4 4l1.5 2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.5 18L4 20l1.5-2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-1" align="start">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase px-2 py-1">Paragraph Spacing</span>
                            {[
                                { label: 'Default', value: 'default' },
                                { label: 'None (0)', value: '0px' },
                                { label: 'Tight (4px)', value: '4px' },
                                { label: 'Normal (8px)', value: '8px' },
                                { label: 'Relaxed (12px)', value: '12px' },
                                { label: 'Loose (16px)', value: '16px' },
                                { label: 'Extra (24px)', value: '24px' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`text-left px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                                        getCurrentParagraphSpacing() === opt.value || (!getCurrentParagraphSpacing() && opt.value === 'default')
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        if (opt.value === 'default') {
                                            (editor.commands as any).unsetParagraphSpacing()
                                        } else {
                                            (editor.commands as any).setParagraphSpacing(opt.value)
                                        }
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.commands as any).toggleSubscript()}
                    isActive={editor.isActive('subscript')}
                    title="Subscript (Ctrl+,)"
                >
                    <SubscriptIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.commands as any).toggleSuperscript()}
                    isActive={editor.isActive('superscript')}
                    title="Superscript (Ctrl+.)"
                >
                    <SuperscriptIcon className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Headings - Compact Dropdown */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={getCurrentHeading() !== 'paragraph' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 px-1.5 gap-0.5"
                            title="Heading"
                        >
                            {getCurrentHeading() === 'h1' && <Heading1 className="h-4 w-4" />}
                            {getCurrentHeading() === 'h2' && <Heading2 className="h-4 w-4" />}
                            {getCurrentHeading() === 'h3' && <Heading3 className="h-4 w-4" />}
                            {getCurrentHeading() === 'paragraph' && <Pilcrow className="h-4 w-4" />}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-1" align="start">
                        <div className="flex flex-col">
                            {[
                                { label: 'Paragraph', value: 'paragraph', icon: <Pilcrow className="h-3.5 w-3.5" /> },
                                { label: 'Heading 1', value: 'h1', icon: <Heading1 className="h-3.5 w-3.5" /> },
                                { label: 'Heading 2', value: 'h2', icon: <Heading2 className="h-3.5 w-3.5" /> },
                                { label: 'Heading 3', value: 'h3', icon: <Heading3 className="h-3.5 w-3.5" /> },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-gray-100 transition-colors ${
                                        getCurrentHeading() === opt.value
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        if (opt.value === 'paragraph') {
                                            editor.chain().focus().setParagraph().run()
                                        } else {
                                            const level = parseInt(opt.value.replace('h', '')) as 1 | 2 | 3
                                            editor.chain().focus().toggleHeading({ level }).run()
                                        }
                                    }}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Alignment - Compact Dropdown */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-1.5 gap-0.5"
                            title="Text Alignment"
                        >
                            {getCurrentAlignment() === 'left' && <AlignLeft className="h-4 w-4" />}
                            {getCurrentAlignment() === 'center' && <AlignCenter className="h-4 w-4" />}
                            {getCurrentAlignment() === 'right' && <AlignRight className="h-4 w-4" />}
                            {getCurrentAlignment() === 'justify' && <AlignJustify className="h-4 w-4" />}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-28 p-1" align="start">
                        <div className="flex flex-col">
                            {[
                                { label: 'Left', value: 'left', icon: <AlignLeft className="h-3.5 w-3.5" /> },
                                { label: 'Center', value: 'center', icon: <AlignCenter className="h-3.5 w-3.5" /> },
                                { label: 'Right', value: 'right', icon: <AlignRight className="h-3.5 w-3.5" /> },
                                { label: 'Justify', value: 'justify', icon: <AlignJustify className="h-3.5 w-3.5" /> },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-gray-100 transition-colors ${
                                        getCurrentAlignment() === opt.value
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign(opt.value).run()
                                    }}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Link */}
                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    title="Add Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>

                {/* Image */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Add Image"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Add Image</Label>

                            {/* From URL */}
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">From URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={addImageFromUrl}
                                        disabled={!imageUrl}
                                        className="h-8 text-xs"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {/* From Local */}
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">From Local</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={addImageFromFile}
                                    className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Image Resize - Only show when image is selected */}
                {selectedImage && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="h-8 px-2 gap-1 bg-blue-600 hover:bg-blue-700"
                                title="Resize Selected Image"
                            >
                                <Maximize2 className="h-4 w-4" />
                                <span className="text-xs">Resize</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                            <div className="space-y-3">
                                <Label className="text-xs font-medium">Resize Image</Label>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-gray-500 w-12">Width</Label>
                                        <Input
                                            type="number"
                                            placeholder="Auto"
                                            value={selectedImage.width}
                                            onChange={(e) => setSelectedImage(prev =>
                                                prev ? { ...prev, width: e.target.value } : null
                                            )}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <span className="text-xs text-gray-400">px</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-gray-500 w-12">Height</Label>
                                        <Input
                                            type="number"
                                            placeholder="Auto"
                                            value={selectedImage.height}
                                            onChange={(e) => setSelectedImage(prev =>
                                                prev ? { ...prev, height: e.target.value } : null
                                            )}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <span className="text-xs text-gray-400">px</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => updateImageSize(selectedImage.width, selectedImage.height)}
                                        className="flex-1 h-8 text-xs"
                                    >
                                        Apply
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateImageSize('', '')}
                                        className="h-8 text-xs"
                                    >
                                        Reset
                                    </Button>
                                </div>

                                <p className="text-xs text-gray-400">
                                    Leave empty for auto size. Click on an image to select it.
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Text Color - Rich swatch picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Text Color"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold leading-none">A</span>
                                <div
                                    className="w-4 h-1 rounded-sm mt-0.5"
                                    style={{ backgroundColor: getCurrentTextColor() }}
                                />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" side="bottom" align="start">
                        <div className="space-y-2.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Text Color</span>
                            <div className="grid grid-cols-8 gap-1">
                                {TEXT_COLOR_PRESETS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                                            getCurrentTextColor() === c
                                                ? 'border-blue-500 scale-110 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => editor.chain().focus().setColor(c).run()}
                                        title={c}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                <span className="text-[10px] text-slate-500">Custom:</span>
                                <input
                                    type="color"
                                    value={getCurrentTextColor()}
                                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                                    className="w-6 h-6 border-0 p-0 cursor-pointer rounded"
                                />
                                <span className="text-[10px] font-mono text-slate-400">{getCurrentTextColor()}</span>
                                <button
                                    className="ml-auto text-[10px] text-gray-500 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                                    onClick={() => editor.chain().focus().unsetColor().run()}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Highlight - Rich swatch picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={editor.isActive('highlight') ? "default" : "ghost"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Highlight"
                        >
                            <Highlighter className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" side="bottom" align="start">
                        <div className="space-y-2.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Highlight Color</span>
                            <div className="grid grid-cols-7 gap-1">
                                {HIGHLIGHT_COLOR_PRESETS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                                            c === 'transparent'
                                                ? 'bg-white relative overflow-hidden'
                                                : ''
                                        } ${
                                            editor.isActive('highlight', { color: c })
                                                ? 'border-blue-500 scale-110 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                        style={c !== 'transparent' ? { backgroundColor: c } : undefined}
                                        onClick={() => {
                                            if (c === 'transparent') {
                                                editor.chain().focus().unsetHighlight().run()
                                            } else {
                                                editor.chain().focus().toggleHighlight({ color: c }).run()
                                            }
                                        }}
                                        title={c === 'transparent' ? 'No highlight' : c}
                                    >
                                        {c === 'transparent' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-0.5 bg-red-400 rotate-45 absolute" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                <span className="text-[10px] text-slate-500">Custom:</span>
                                <input
                                    type="color"
                                    defaultValue="#ffff00"
                                    onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                                    className="w-6 h-6 border-0 p-0 cursor-pointer rounded"
                                />
                                <button
                                    className="ml-auto text-[10px] text-gray-500 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Clear Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    title="Clear Formatting"
                >
                    <Eraser className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <div className={`flex-1 ${fitToView ? 'overflow-hidden' : 'overflow-y-auto'}`} ref={editorContainerRef}>
                {fitToView && zoneDimensions ? (
                    <div className="flex justify-center p-4 bg-gray-100 h-full w-full">
                        <div
                            style={{
                                width: `${zoneDimensions.width * editorScale}px`,
                                height: `${zoneDimensions.height * editorScale}px`,
                                flexShrink: 0,
                                margin: '0 auto'
                            }}
                        >
                            <div
                                style={{
                                    width: `${zoneDimensions.width}px`,
                                    height: `${zoneDimensions.height}px`,
                                    transform: `scale(${editorScale})`,
                                    transformOrigin: 'top left',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                    background: editorBg === 'black' ? 'black' : 'white',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}
                            >
                                <EditorContent editor={editor} className="h-full" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <EditorContent editor={editor} className="min-h-[400px]" />
                )}
            </div>
        </div>
    )
}
